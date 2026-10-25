import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PowerBIDashboard from './components/PowerBIDashboard';
import DispatchChat from './components/DispatchChat';
import AuditTrail from './components/AuditTrail';
import ServerStandbyScreen from './components/ServerStandbyScreen';
import { fetchHealth } from './api/client';
import { AlertCircle, RefreshCw } from 'lucide-react';

function generateSessionId() {
  return 'sess-' + Math.random().toString(36).substring(2, 8);
}

export default function App() {
  const [currentTab, setTab] = useState('dispatch');
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('fde_session_id') || generateSessionId();
  });
  const [health, setHealth] = useState(null);
  const [isOnline, setIsOnline] = useState(null); // null = initial check, true = running, false = stopped
  const [isDemoBypass, setIsDemoBypass] = useState(false);

  useEffect(() => {
    localStorage.setItem('fde_session_id', sessionId);
  }, [sessionId]);

  const loadHealth = async () => {
    try {
      const data = await fetchHealth();
      if (data && data.status === 'online') {
        setHealth(data);
        setIsOnline(true);
      } else {
        setHealth({ status: 'offline', services: { mssql: 'Offline', llmModel: 'Offline' } });
        setIsOnline(false);
      }
    } catch {
      setHealth({ status: 'offline', services: { mssql: 'Offline', llmModel: 'Offline' } });
      setIsOnline(false);
    }
  };

  useEffect(() => {
    loadHealth();
    // Poll every 6 seconds when offline so it detects instantly when EC2 starts, every 25s when online
    const intervalTime = isOnline === false ? 6000 : 25000;
    const interval = setInterval(loadHealth, intervalTime);
    return () => clearInterval(interval);
  }, [isOnline]);

  const resetSession = () => {
    const newId = generateSessionId();
    setSessionId(newId);
  };

  // If server is confirmed offline and user hasn't chosen to bypass, show the clear Standby Screen
  if (isOnline === false && !isDemoBypass) {
    return (
      <ServerStandbyScreen
        onRetry={loadHealth}
        onBypassDemo={() => setIsDemoBypass(true)}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-app)' }}>
      
      {/* Optional Demo Mode Banner if user bypassed standby screen */}
      {isOnline === false && isDemoBypass && (
        <div
          style={{
            background: '#fef3c7',
            borderBottom: '1px solid #fde68a',
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#92400e',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} color="#b45309" />
            <span>
              <strong>AWS EC2 Server is Stopped (Demo Mode):</strong> Live queries and AI dispatch reasoning are in standby. Start EC2 to resume live operations.
            </span>
          </div>
          <button
            onClick={loadHealth}
            style={{
              background: '#ffffff',
              border: '1px solid #fde68a',
              borderRadius: '4px',
              padding: '3px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#92400e',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RefreshCw size={12} />
            <span>Check EC2 Status</span>
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, height: isOnline === false && isDemoBypass ? 'calc(100vh - 37px)' : '100vh', width: '100vw', overflow: 'hidden' }}>
        {/* Sleek Left Sidebar (Exactly 3 Navigation Sections) */}
        <Sidebar
          currentTab={currentTab}
          setTab={setTab}
          sessionId={sessionId}
          resetSession={resetSession}
          health={health}
        />

        {/* Main Content Area */}
        <main style={{ flex: 1, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {currentTab === 'dashboard' && <PowerBIDashboard />}
          {currentTab === 'dispatch' && <DispatchChat sessionId={sessionId} />}
          {currentTab === 'audit' && <AuditTrail />}
        </main>
      </div>
    </div>
  );
}
