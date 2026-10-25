import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Pinecone } from '@pinecone-database/pinecone';
import { config } from '../src/config/env.js';
import { generateEmbedding } from '../src/services/embeddings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

const policyDir = path.join(projectRoot, 'data', 'policy');
const cacheDir = path.join(projectRoot, 'data', 'cache');
const hashCacheFile = path.join(cacheDir, 'ingestion_hash_cache.json');

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

let hashCache = {};
if (fs.existsSync(hashCacheFile)) {
  try {
    hashCache = JSON.parse(fs.readFileSync(hashCacheFile, 'utf-8'));
  } catch {
    hashCache = {};
  }
}

/**
 * Text splitter helper: splits string into chunks with size and overlap.
 */
function chunkText(text, chunkSize = 600, overlap = 60) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const piece = text.slice(start, end).trim();
    if (piece) chunks.push(piece);
    start += (chunkSize - overlap);
  }
  return chunks;
}

/**
 * Parses files according to extension.
 */
async function parseDocument(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const rawChunks = [];

  if (ext === '.md' || ext === '.txt') {
    const content = fs.readFileSync(filePath, 'utf-8');
    const pieces = chunkText(content);
    for (const piece of pieces) {
      rawChunks.push({ text: piece, metadata: {} });
    }
  } else if (ext === '.pdf') {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      const pieces = chunkText(data.text || '');
      for (const piece of pieces) {
        rawChunks.push({ text: piece, metadata: { pages: data.numpages } });
      }
    } catch (err) {
      console.error(`  ❌ Failed parsing PDF ${path.basename(filePath)}:`, err.message);
    }
  } else if (ext === '.csv' || ext === '.xlsx') {
    try {
      const xlsx = (await import('xlsx')).default;
      const workbook = xlsx.readFile(filePath);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(firstSheet);
      rows.forEach((row, idx) => {
        const rowStr = Object.entries(row)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ');
        if (rowStr.trim()) {
          rawChunks.push({ text: rowStr, metadata: { row_index: idx } });
        }
      });
    } catch (err) {
      console.error(`  ❌ Failed reading spreadsheet ${path.basename(filePath)}:`, err.message);
    }
  }

  return rawChunks.filter(c => c.text && c.text.trim().length > 0);
}

async function runIngestion() {
  console.log('\n=======================================================');
  console.log('📦 Starting SOP Document Ingestion Pipeline (JavaScript)');
  console.log(`📁 Source Directory: ${policyDir}`);
  console.log(`🌲 Pinecone Index: ${config.pineconeIndex} (${config.embeddingDimension} Dim)`);
  console.log('=======================================================\n');

  if (!config.pineconeApiKey) {
    throw new Error('PINECONE_API_KEY is missing in environment variables.');
  }

  const pc = new Pinecone({ apiKey: config.pineconeApiKey });

  // 1. Verify or create index
  const indexList = await pc.listIndexes();
  const indexNames = (indexList.indexes || []).map(i => i.name);

  if (!indexNames.includes(config.pineconeIndex)) {
    console.log(`Creating Pinecone index: ${config.pineconeIndex}...`);
    await pc.createIndex({
      name: config.pineconeIndex,
      dimension: config.embeddingDimension,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });
    console.log('Index created successfully.');
  }

  const index = pc.index(config.pineconeIndex);

  // 2. Discover policy files
  if (!fs.existsSync(policyDir)) {
    console.log(`Directory ${policyDir} does not exist. Creating it now...`);
    fs.mkdirSync(policyDir, { recursive: true });
  }

  const validExtensions = ['.md', '.txt', '.pdf', '.csv', '.xlsx'];
  const files = fs.readdirSync(policyDir)
    .filter(f => validExtensions.includes(path.extname(f).toLowerCase()));

  console.log(`Found ${files.length} policy file(s) in ${policyDir}...`);

  const updatedCache = { ...hashCache };
  let cacheModified = false;

  for (const fileName of files) {
    const filePath = path.join(policyDir, fileName);
    const fileBytes = fs.readFileSync(filePath);
    const fileHash = crypto.createHash('md5').update(fileBytes).digest('hex');

    if (hashCache[fileName] === fileHash) {
      console.log(`✨ Skipped (Unchanged): ${fileName}`);
      continue;
    }

    console.log(`🔄 Processing updates: ${fileName}...`);
    cacheModified = true;

    try {
      const chunks = await parseDocument(filePath);
      if (chunks.length === 0) {
        console.warn(`  ⚠️ No valid text chunks extracted from ${fileName}.`);
        continue;
      }

      console.log(`  Extracting & embedding ${chunks.length} chunk(s)...`);
      const vectors = [];

      for (let idx = 0; idx < chunks.length; idx++) {
        const chunk = chunks[idx];
        const vectorValues = await generateEmbedding(chunk.text);

        vectors.push({
          id: `${fileName}-chunk-${idx}`,
          values: vectorValues,
          metadata: {
            ...chunk.metadata,
            source_file: fileName,
            file_format: path.extname(fileName).replace('.', '').toUpperCase(),
            document_type: 'Compliance Asset',
            text: chunk.text
          }
        });
      }

      // Upsert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert(batch);
        console.log(`  📤 Upserted batch ${i + 1} - ${i + batch.length} of ${vectors.length}`);
      }

      updatedCache[fileName] = fileHash;
      console.log(`✅ Ingested ${fileName} successfully.`);
    } catch (err) {
      console.error(`❌ Error during ingestion of ${fileName}:`, err.message);
    }
  }

  if (cacheModified) {
    fs.writeFileSync(hashCacheFile, JSON.stringify(updatedCache, null, 2));
    console.log('\n💾 Hash cache updated.');
  } else {
    console.log('\n🌴 Index is already up-to-date.');
  }
}

runIngestion().catch(err => {
  console.error('\nFatal Ingestion Error:', err);
  process.exit(1);
});
