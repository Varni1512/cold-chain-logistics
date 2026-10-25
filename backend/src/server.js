import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';

import agentRoutes from './routes/agent.js';
import telemetryRoutes from './routes/telemetry.js';
import auditRoutes from './routes/audit.js';
import healthRoutes from './routes/health.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Route Mounts
app.use('/api/agent', agentRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/health', healthRoutes);

// Root Welcome
app.get('/', (req, res) => {
  res.json({
    name: 'Cold-Chain Logistics AI Orchestrator API',
    version: '1.0.0',
    endpoints: [
      'POST /api/agent/chat',
      'POST /api/agent/stream',
      'GET  /api/telemetry/fleet',
      'POST /api/audit/logs',
      'GET  /api/health'
    ]
  });
});

app.listen(config.port, () => {
  console.log(`\n=======================================================`);
  console.log(`🚀 Cold-Chain AI Orchestrator Node.js Backend Online`);
  console.log(`📡 Listening on: http://localhost:${config.port}`);
  console.log(`🧠 LLM Reasoning: [${config.agentLlm} -> ${config.groqModel}]`);
  console.log(`📊 Embeddings: [${config.embeddingsModel} -> 1024 Dim Space]`);
  console.log(`🌲 Pinecone Index: [${config.pineconeIndex}]`);
  console.log(`=======================================================\n`);
});
