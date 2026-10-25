const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function sendChatMessage(sessionId, history, message) {
  const res = await fetch(`${API_BASE}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, history, message })
  });
  return res.json();
}

export function streamChatMessage(sessionId, history, message, { onTrace, onComplete, onError }) {
  const controller = new AbortController();

  fetch(`${API_BASE}/api/agent/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, history, message }),
    signal: controller.signal
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;
          const eventMatch = block.match(/^event:\s*(.+)$/m);
          const dataMatch = block.match(/^data:\s*(.+)$/m);

          if (dataMatch) {
            try {
              const data = JSON.parse(dataMatch[1]);
              const eventType = eventMatch ? eventMatch[1].trim() : 'message';

              if (eventType === 'trace' && onTrace) onTrace(data);
              if (eventType === 'complete' && onComplete) onComplete(data);
              if (eventType === 'error' && onError) onError(data);
            } catch (err) {
              console.error('SSE JSON parse error:', err);
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError' && onError) {
        onError({ error: err.message });
      }
    });

  return () => controller.abort();
}

export async function fetchFleetStats() {
  const res = await fetch(`${API_BASE}/api/telemetry/stats`);
  return res.json();
}

export async function fetchFleetTelemetry(limit = 200) {
  const res = await fetch(`${API_BASE}/api/telemetry/fleet?limit=${limit}`);
  return res.json();
}

export async function fetchAuditLogs(username, password, limit = 100) {
  const res = await fetch(`${API_BASE}/api/audit/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, limit })
  });
  return res.json();
}
