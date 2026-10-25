import express from 'express';
import { config } from '../config/env.js';
import { getAgentDb } from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  let dbStatus = 'Disconnected';
  try {
    const pool = await getAgentDb();
    if (pool.connected) dbStatus = 'Connected';
  } catch {
    dbStatus = 'Unreachable';
  }

  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    services: {
      mssql: dbStatus,
      llmProvider: config.agentLlm,
      llmModel: config.groqModel,
      embeddingsModel: config.embeddingsModel,
      embeddingDimension: config.embeddingDimension,
      pineconeIndex: config.pineconeIndex
    }
  });
});

export default router;
