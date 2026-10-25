import express from 'express';
import { executeAdminQuery } from '../config/db.js';
import { config } from '../config/env.js';

const router = express.Router();

/**
 * Administrative endpoint to fetch audit logs with credential verification.
 */
router.post('/logs', async (req, res) => {
  try {
    const { username, password, limit = 100 } = req.body;

    if (!username || !password) {
      return res.status(401).json({ error: 'Admin username and password are required.' });
    }

    if (username !== config.sqlAdminUser || password !== config.sqlAdminPassword) {
      return res.status(403).json({ error: 'Invalid Administrator Credentials.' });
    }

    const query = `
      SELECT TOP ${parseInt(limit, 10)}
        LogID, Timestamp, SessionID, NodeExecuted, ToolName, Content
      FROM FDE_VIEWS.AgentAuditLog
      ORDER BY Timestamp DESC
    `;

    const logs = await executeAdminQuery(username, password, query);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    console.error('Audit logs error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
