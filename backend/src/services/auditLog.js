import sql from 'mssql';
import { getAgentDb } from '../config/db.js';

/**
 * Records agent reasoning steps and tool execution records into FDE_VIEWS.AgentAuditLog.
 * Fails silently so audit logging errors never crash the user-facing workflow.
 */
export async function writeAuditLog(sessionId, nodeExecuted, toolName, content) {
  try {
    const pool = await getAgentDb();
    const cleanContent = typeof content === 'object' ? JSON.stringify(content) : String(content || '');

    await pool.request()
      .input('session_id', sql.VarChar(50), String(sessionId || 'anonymous').slice(0, 50))
      .input('node_executed', sql.VarChar(50), String(nodeExecuted || 'unknown').slice(0, 50))
      .input('tool_name', sql.VarChar(100), String(toolName || 'agent_action').slice(0, 100))
      .input('content', sql.NVarChar(sql.MAX), cleanContent)
      .query(`
        INSERT INTO FDE_VIEWS.AgentAuditLog (SessionID, NodeExecuted, ToolName, Content)
        VALUES (@session_id, @node_executed, @tool_name, @content)
      `);
  } catch (err) {
    console.warn(`[AuditLog] Log write skipped: ${err.message}`);
  }
}
