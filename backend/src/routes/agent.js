import express from 'express';
import { runAgentOrchestrator } from '../agent/orchestrator.js';

const router = express.Router();

/**
 * Standard REST query endpoint.
 */
router.post('/chat', async (req, res) => {
  try {
    const { sessionId, history = [], message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const sid = sessionId || 'session-' + Date.now();
    const result = await runAgentOrchestrator(sid, history, message);

    res.json({
      success: true,
      sessionId: sid,
      content: result.content,
      traces: result.traces
    });
  } catch (err) {
    console.error('Agent chat error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal Agent Orchestration Error'
    });
  }
});

/**
 * Real-time Server-Sent Events (SSE) streaming endpoint.
 */
router.post('/stream', async (req, res) => {
  const { sessionId, history = [], message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sid = sessionId || 'session-' + Date.now();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const result = await runAgentOrchestrator(sid, history, message, (progressEvent) => {
      sendEvent('trace', progressEvent);
    });

    sendEvent('complete', {
      sessionId: sid,
      content: result.content,
      traces: result.traces
    });
    res.end();
  } catch (err) {
    console.error('Agent stream error:', err);
    sendEvent('error', { error: err.message });
    res.end();
  }
});

export default router;
