import React from 'react';
import { 
  BarChart3, 
  MessageSquare, 
  ShieldCheck, 
  Database, 
  Cpu, 
  Layers,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ currentTab, setTab, sessionId, resetSession, health }) {
  const isConnected = health?.services?.mssql === 'Connected';

  const navItems = [
    {
      id: 'dispatch',
      label: 'AI Dispatch Console',
      subtitle: 'Incident RAG & Chat Agent',
      icon: MessageSquare
    },
    {
      id: 'audit',
      label: 'Audit & Compliance',
      subtitle: 'Decrypted SQL Audit Logs',
      icon: ShieldCheck
    },
    {
      id: 'dashboard',
      label: 'Operations Dashboard',
      subtitle: 'Real-time Analytics & KPIs',
      icon: BarChart3
    },
    
  ];

  return (
    <aside
      style={{
        width: '280px',
        background: '#ffffff',
        borderRight: '1px solid #ded9cd',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0
      }}
    >
      {/* Top Branding */}
      <div>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid #ded9cd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#1e293b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800
              }}
            >
              <Layers size={20} color="#f8fafc" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1c1917', margin: 0, letterSpacing: '-0.02em' }}>
                Cold-Chain FDE
              </h1>
              <span style={{ fontSize: '0.725rem', color: '#78716c', fontWeight: 500 }}>
                Enterprise Operations Portal
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items (Exactly 3 Sections) */}
        <div style={{ padding: '16px 12px' }}>
          <div style={{ fontSize: '0.685rem', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 10px 8px 10px' }}>
            System Navigation
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: isActive ? '#f4f3ef' : 'transparent',
                    border: isActive ? '1px solid #ded9cd' : '1px solid transparent',
                    color: isActive ? '#1c1917' : '#57534e',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    width: '100%'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = '#faf9f6';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        background: isActive ? '#1e293b' : '#eae8e1',
                        color: isActive ? '#ffffff' : '#57534e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: isActive ? 700 : 600 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#78716c' }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  {isActive && <ChevronRight size={14} color="#1c1917" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom System Status & Telemetry Metadata */}
      <div style={{ padding: '16px', borderTop: '1px solid #ded9cd', background: '#faf9f5' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.725rem', color: '#78716c', fontWeight: 600 }}>AWS Cloud EC2</span>
            <span className={`badge ${isConnected ? 'badge-safe' : 'badge-warn'}`} style={{ fontSize: '0.7rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConnected ? '#059669' : '#d97706', display: 'inline-block' }}></span>
              {isConnected ? 'Running (c7i-flex)' : 'Stopped (Standby)'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.725rem', color: '#78716c', fontWeight: 600 }}>MSSQL Database</span>
            <span className={`badge ${isConnected ? 'badge-safe' : 'badge-warn'}`} style={{ fontSize: '0.7rem' }}>
              <Database size={11} />
              {health?.services?.mssql || 'Offline'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.725rem', color: '#78716c', fontWeight: 600 }}>LLM Provider</span>
            <span className="badge badge-neutral" style={{ fontSize: '0.7rem', color: '#1e293b' }}>
              <Cpu size={11} />
              {health?.services?.llmModel || 'Groq Reasoner'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
