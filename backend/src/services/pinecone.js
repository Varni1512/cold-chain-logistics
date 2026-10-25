import { Pinecone } from '@pinecone-database/pinecone';
import { config } from '../config/env.js';
import { generateEmbedding } from './embeddings.js';

let pineconeClient = null;

function getPineconeClient() {
  if (!config.pineconeApiKey) {
    throw new Error('PINECONE_API_KEY is missing in environment variables.');
  }
  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey: config.pineconeApiKey });
  }
  return pineconeClient;
}

/**
 * Searches the Pinecone SOP Vector Store for relevant compliance guidelines.
 * @param {string} query - Natural language query
 * @param {number} topK - Number of results to return
 * @returns {Promise<string>} Formatted SOP clauses
 */
export async function searchComplianceSop(query, topK = 2) {
  try {
    const pc = getPineconeClient();
    const index = pc.index(config.pineconeIndex);

    // 1. Generate 1024-dimension query embedding
    const queryVector = await generateEmbedding(query);

    // 2. Query Pinecone
    const queryResponse = await index.query({
      vector: queryVector,
      topK,
      includeMetadata: true
    });

    const matches = queryResponse.matches || [];
    if (matches.length === 0) {
      return 'No matching compliance clauses found in Standard Operating Procedures.';
    }

    const formattedDocs = matches.map(m => {
      const source = m.metadata?.source_file || 'SOP';
      const format = m.metadata?.file_format || 'RAW';
      const text = m.metadata?.text || m.metadata?.page_content || JSON.stringify(m.metadata);
      return `[Source: ${source} | Format: ${format} | Score: ${(m.score || 0).toFixed(3)}]\n${text}`;
    });

    return `--- COMPLIANCE SOP CONTEXT ---\n${formattedDocs.join('\n\n')}\n------------------------------`;
  } catch (err) {
    console.error('Pinecone Vector Retrieval Error:', err);
    return `Vector Store Retrieval Error: ${err.message}`;
  }
}

/**
 * Upserts a batch of document vectors into Pinecone.
 */
export async function upsertVectors(vectors) {
  const pc = getPineconeClient();
  const index = pc.index(config.pineconeIndex);
  await index.upsert(vectors);
}

/**
 * Purges vectors by metadata filter (e.g. source_file).
 */
export async function deleteVectorsBySource(sourceFile) {
  const pc = getPineconeClient();
  const index = pc.index(config.pineconeIndex);
  try {
    await index.deleteMany({ source_file: { $eq: sourceFile } });
  } catch (err) {
    // Pinecone free tier may not support metadata filter delete, ignore silently if unsupported
    console.warn(`Could not purge ${sourceFile} via metadata filter:`, err.message);
  }
}
