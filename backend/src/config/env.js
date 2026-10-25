import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

// Load .env from project root, then fallback to backend/.env if any
dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  
  // LLM Config
  agentLlm: (process.env.Agent_llm || process.env.AGENT_LLM || 'GROQ').trim().toUpperCase(),
  groqApiKey: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.replace(/["']/g, '').trim() : '',
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  
  // Embedding & Vector DB Config
  embeddingsModel: (process.env.Emdeddings_model || process.env.EMBEDDINGS_MODEL || 'LOCAL').trim().toUpperCase(),
  localEmbeddingModel: process.env.Local_Embeddings_Model || process.env.LOCAL_EMBEDDING_MODEL || 'Xenova/bge-large-en-v1.5',
  pineconeApiKey: process.env.PINECONE_API_KEY || '',
  pineconeIndex: process.env.PINECONE_INDEX_NAME || (
    (process.env.Emdeddings_model || '').toUpperCase() === 'OPENAI' 
      ? 'fde-sop-index-openai' 
      : 'fde-sop-index-local'
  ),
  embeddingDimension: 1024,

  // MSSQL Database Config
  sqlHost: process.env.SQL_SERVER_HOST || 'localhost',
  sqlPort: parseInt(process.env.SQL_SERVER_PORT || '1433', 10),
  sqlAgentUser: process.env.SQL_AGENT_USER || 'USR_FDE_RO',
  sqlAgentPassword: process.env.SQL_AGENT_PASSWORD || 'AgentPassword2026!',
  sqlAdminUser: process.env.SQL_ADMIN_USER || 'sa',
  sqlAdminPassword: process.env.SQL_ADMIN_PASSWORD || 'FdeEnterprisePass123!',
  sqlDatabase: process.env.SQL_DATABASE || 'master',

  projectRoot
};
