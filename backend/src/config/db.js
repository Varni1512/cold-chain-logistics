import sql from 'mssql';
import { config } from './env.js';

const agentConfig = {
  server: config.sqlHost,
  port: config.sqlPort,
  user: config.sqlAgentUser,
  password: config.sqlAgentPassword,
  database: config.sqlDatabase,
  connectionTimeout: 3000,
  requestTimeout: 8000,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let agentPool = null;

export async function getAgentDb() {
  if (!agentPool) {
    try {
      agentPool = await new sql.ConnectionPool(agentConfig).connect();
    } catch (err) {
      console.error('MSSQL Agent Connection Error:', err.message);
      throw err;
    }
  }
  return agentPool;
}

export async function executeAdminQuery(user, password, queryText) {
  const adminConfig = {
    server: config.sqlHost,
    port: config.sqlPort,
    user: user,
    password: password,
    database: config.sqlDatabase,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true
    }
  };

  const pool = await new sql.ConnectionPool(adminConfig).connect();
  try {
    const result = await pool.request().query(queryText);
    return result.recordset;
  } finally {
    await pool.close();
  }
}
