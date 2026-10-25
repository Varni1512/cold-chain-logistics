import { config } from '../config/env.js';

let transformerPipeline = null;

/**
 * Initializes and caches the local Transformer feature-extraction pipeline.
 * Uses 1024-dimensional model (e.g. Xenova/bge-large-en-v1.5).
 */
async function getTransformerPipeline() {
  if (!transformerPipeline) {
    const { pipeline } = await import('@xenova/transformers');
    let modelTarget = config.localEmbeddingModel || 'Xenova/bge-large-en-v1.5';
    if (modelTarget.startsWith('BAAI/')) {
      modelTarget = 'Xenova/bge-large-en-v1.5';
    }
    
    console.log(`[Embeddings] Loading local model: ${modelTarget}...`);
    transformerPipeline = await pipeline('feature-extraction', modelTarget);
    console.log(`[Embeddings] Local model loaded successfully.`);
  }
  return transformerPipeline;
}

/**
 * Generates a 1024-dimensional vector embedding for the input text.
 * @param {string} text - Content to embed
 * @returns {Promise<number[]>} Array of 1024 floats
 */
export async function generateEmbedding(text) {
  const cleanText = text.replace(/\n+/g, ' ').trim();
  const mode = config.embeddingsModel;

  // Option 1: Cloud OpenAI Embeddings
  if (mode === 'OPENAI' && config.openaiApiKey) {
    const { OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: config.openaiApiKey });
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: cleanText,
      dimensions: config.embeddingDimension // 1024
    });
    return response.data[0].embedding;
  }

  // Option 2: Local Ollama (if configured)
  if (mode === 'OLLAMA') {
    try {
      const res = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'bge-m3', prompt: cleanText })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.embedding && data.embedding.length === config.embeddingDimension) {
          return data.embedding;
        }
      }
    } catch {
      // Fallback to in-process Xenova transformers
    }
  }

  // Option 3 (Default & 100% Free): In-process Transformers.js (ONNX on CPU)
  const extractor = await getTransformerPipeline();
  const output = await extractor(cleanText, { pooling: 'mean', normalize: true });
  const rawVector = Array.from(output.data);

  // Ensure dimension matches Pinecone target (1024)
  if (rawVector.length === config.embeddingDimension) {
    return rawVector;
  } else if (rawVector.length > config.embeddingDimension) {
    return rawVector.slice(0, config.embeddingDimension);
  } else {
    // Pad with zeros if smaller
    const padded = new Array(config.embeddingDimension).fill(0);
    for (let i = 0; i < rawVector.length; i++) padded[i] = rawVector[i];
    return padded;
  }
}
