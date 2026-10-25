import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PowerBIDashboard from './components/PowerBIDashboard';
import DispatchChat from './components/DispatchChat';
import AuditTrail from './components/AuditTrail';
import { fetchHealth } from './api/client';

function generateSessionId() {
  return 'sess-' + Math.random().toString(36).substring(2, 8);
}

export default function App() {
  const [currentTab, setTab] = useState('dashboard');
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('fde_session_id') || generateSessionId();
  });
  const [health, setHealth] = useState(null);

  useEffect(() => {
    localStorage.setItem('fde_session_id', sessionId);
  }, [sessionId]);

  const loadHealth = async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch {
      setHealth({ services: { mssql: 'Offline', llmModel: 'Offline' } });
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  const resetSession = () => {
    const newId = generateSessionId();
    setSessionId(newId);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-app)' }}>
      {/* Sleek Left Sidebar (Exactly 3 Navigation Sections) */}
      <Sidebar
        currentTab={currentTab}
        setTab={setTab}
        sessionId={sessionId}
        resetSession={resetSession}
        health={health}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {currentTab === 'dashboard' && <PowerBIDashboard />}
        {currentTab === 'dispatch' && <DispatchChat sessionId={sessionId} />}
        {currentTab === 'audit' && <AuditTrail />}
      </main>
    </div>
  );
}
