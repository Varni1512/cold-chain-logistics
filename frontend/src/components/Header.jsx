import React from 'react';
import { 
  BarChart3, 
  MessageSquare, 
  Truck, 
  ShieldCheck, 
  RefreshCw, 
  Database, 
  Cpu,
  Layers
} from 'lucide-react';

export default function Header({ currentTab, setTab, sessionId, resetSession, health }) {
  const isConnected = health?.services?.mssql === 'Connected';

  return (
    <header
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #ded9cd',
        padding: '12px 28px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}
    >
      {/* Brand & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            background: '#1e293b',
            color: '#ffffff',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.1rem'
          }}
        >
          <Layers size={20} color="#f8fafc" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1c1917', letterSpacing: '-0.02em' }}>
              Cold-Chain Operations Portal
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '0.685rem', background: '#f4f3ef', color: '#57534e' }}>
              Enterprise Edition
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#78716c', margin: 0 }}>
            Automated Fleet Telemetry, Spoilage Control & Audit Compliance
          </p>
        </div>
      </div>

      {/* Navigation Tabs (PowerBI Style Tabs) */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f4f3ef', padding: '4px', borderRadius: '8px', border: '1px solid #ded9cd' }}>
        <button
          onClick={() => setTab('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '6px',
            fontSize: '0.825rem',
            fontWeight: 600,
            background: currentTab === 'dashboard' ? '#ffffff' : 'transparent',
            color: currentTab === 'dashboard' ? '#1c1917' : '#78716c',
            boxShadow: currentTab === 'dashboard' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            border: currentTab === 'dashboard' ? '1px solid #ded9cd' : '1px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <BarChart3 size={15} />
          Executive Dashboard
        </button>

        <button
          onClick={() => setTab('dispatch')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '6px',
            fontSize: '0.825rem',
            fontWeight: 600,
            background: currentTab === 'dispatch' ? '#ffffff' : 'transparent',
            color: currentTab === 'dispatch' ? '#1c1917' : '#78716c',
            boxShadow: currentTab === 'dispatch' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            border: currentTab === 'dispatch' ? '1px solid #ded9cd' : '1px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <MessageSquare size={15} />
          Dispatch Assistant
        </button>

        <button
          onClick={() => setTab('radar')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '6px',
            fontSize: '0.825rem',
            fontWeight: 600,
            background: currentTab === 'radar' ? '#ffffff' : 'transparent',
            color: currentTab === 'radar' ? '#1c1917' : '#78716c',
            boxShadow: currentTab === 'radar' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            border: currentTab === 'radar' ? '1px solid #ded9cd' : '1px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <Truck size={15} />
          Fleet Telemetry
        </button>

        <button
          onClick={() => setTab('audit')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '6px',
            fontSize: '0.825rem',
            fontWeight: 600,
            background: currentTab === 'audit' ? '#ffffff' : 'transparent',
            color: currentTab === 'audit' ? '#1c1917' : '#78716c',
            boxShadow: currentTab === 'audit' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            border: currentTab === 'audit' ? '1px solid #ded9cd' : '1px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <ShieldCheck size={15} />
          Audit Trail
        </button>
      </nav>

      {/* System Status Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className={`badge ${isConnected ? 'badge-safe' : 'badge-warn'}`}>
            <Database size={12} />
            SQL: {health?.services?.mssql || 'Connecting...'}
          </span>

          <span className="badge badge-neutral" style={{ color: '#1e293b' }}>
            <Cpu size={12} />
            {health?.services?.llmModel || 'Groq Reasoner'}
          </span>
        </div>

        <button
          onClick={resetSession}
          className="btn-secondary"
          style={{ padding: '5px 10px', fontSize: '0.75rem', color: '#78716c' }}
          title="Reset chat memory session"
        >
          <RefreshCw size={12} />
          Reset ({sessionId.slice(0, 6)})
        </button>
      </div>
    </header>
  );
}
