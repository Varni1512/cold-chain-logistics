import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, AlertOctagon, Terminal, CheckCircle2 } from 'lucide-react';
import { fetchAuditLogs } from '../api/client';

export default function AuditTrail() {
  const [username, setUsername] = useState('sa');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const handleAuthenticate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetchAuditLogs(username, password);
      if (res.success) {
        setLogs(res.data);
        setIsAuthenticated(true);
      } else {
        setError(res.error || 'Authentication failed. Please verify administrator credentials.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to the audit service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', overflowY: 'auto', height: '100vh', boxSizing: 'border-box' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#1c1917', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={22} color="#0f766e" />
          Regulatory Agent Audit Trail
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#78716c', margin: '3px 0 0 0' }}>
          Air-gapped database records captured inside <code>FDE_VIEWS.AgentAuditLog</code>
        </p>
      </div>

      {!isAuthenticated ? (
        /* Authorization Gate */
        <div style={{ maxWidth: '440px', margin: '60px auto' }}>
          <div className="bi-card" style={{ padding: '32px 28px', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#f5f4ef',
                border: '1px solid #ded9cd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto'
              }}
            >
              <Lock size={22} color="#1e293b" />
            </div>

            <h3 style={{ fontSize: '1.15rem', color: '#1c1917', marginBottom: '6px' }}>
              Database Security Gate
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#78716c', marginBottom: '20px', lineHeight: 1.5 }}>
              Enter database administrator credentials (defined in <code>.env</code> as <code>SQL_ADMIN_USER</code>) to decrypt and load audit records.
            </p>

            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  marginBottom: '16px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <AlertOctagon size={15} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAuthenticate} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '0.785rem', color: '#57534e', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Admin Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    border: '1px solid #ded9cd',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#1c1917',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.785rem', color: '#57534e', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Admin Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter administrator password..."
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    border: '1px solid #ded9cd',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#1c1917',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '6px', padding: '10px' }}
              >
                {loading ? 'Authenticating with SQL Server...' : 'Authenticate & Load Audit Logs'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Authenticated Logs View */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-safe">
                <CheckCircle2 size={13} />
                Authenticated Administrator: {username}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#78716c' }}>
                Loaded {logs.length} audit records
              </span>
            </div>

            <button
              onClick={() => setIsAuthenticated(false)}
              className="btn-secondary"
              style={{ fontSize: '0.785rem', padding: '5px 12px' }}
            >
              Sign Out
            </button>
          </div>

          <div className="bi-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="bi-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th style={{ width: '160px' }}>Execution Timestamp</th>
                  <th style={{ width: '130px' }}>Session ID</th>
                  <th style={{ width: '120px' }}>Graph Node</th>
                  <th style={{ width: '180px' }}>Tool Executed</th>
                  <th>Payload Summary</th>
                  <th style={{ width: '80px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#78716c' }}>
                      No audit records found in the database.
                    </td>
                  </tr>
                ) : (
                  logs.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#78716c' }}>{row.LogID}</td>
                      <td style={{ color: '#57534e', fontFamily: 'var(--font-mono)', fontSize: '0.785rem' }}>
                        {row.Timestamp ? new Date(row.Timestamp).toLocaleDateString() + ' ' + new Date(row.Timestamp).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#78716c' }}>
                          {String(row.SessionID || '').slice(0, 10)}...
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{row.NodeExecuted}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#1c1917' }}>
                        {row.ToolName}
                      </td>
                      <td style={{ maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#57534e', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                        {row.Content}
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedLog(row)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          <Eye size={12} />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Modal / Inspector Drawer */}
          {selectedLog && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(28, 25, 23, 0.4)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100
              }}
              onClick={() => setSelectedLog(null)}
            >
              <div
                className="bi-card"
                style={{
                  width: '680px',
                  maxWidth: '92vw',
                  maxHeight: '80vh',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '24px',
                  borderRadius: '10px'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ color: '#1c1917', fontSize: '1.05rem', margin: 0 }}>
                      Audit Record #{selectedLog.LogID} - {selectedLog.ToolName}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: '#78716c', marginTop: '3px' }}>
                      Node: <code>{selectedLog.NodeExecuted}</code> • Session: <code>{selectedLog.SessionID}</code>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLog(null)}
                    style={{ color: '#78716c', fontSize: '1.2rem', padding: '4px 8px' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', background: '#f5f4ef', padding: '14px', borderRadius: '6px', border: '1px solid #ded9cd' }}>
                  <pre style={{ margin: 0, fontSize: '0.8rem', color: '#1c1917', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'var(--font-mono)' }}>
                    {selectedLog.Content}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
