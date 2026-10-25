import express from 'express';
import { fetchRecentFleet, fetchFleetStats } from '../services/telemetry.js';

const router = express.Router();

/**
 * Returns aggregated KPI statistics computed over all 32,065+ rows in MSSQL.
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await fetchFleetStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Returns latest active fleet positions and telemetry.
 */
router.get('/fleet', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '200', 10);
    const fleet = await fetchRecentFleet(limit);
    res.json({ success: true, count: fleet.length, data: fleet });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
