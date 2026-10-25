import React, { useState } from 'react';
import { ServerOff, RefreshCw, Power, CheckCircle2, ArrowRight, ShieldAlert, Cpu, Database, Eye } from 'lucide-react';

export default function ServerStandbyScreen({ onRetry, onBypassDemo }) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryClick = async () => {
    setIsRetrying(true);
    await onRetry();
    setTimeout(() => setIsRetrying(false), 800);
  };

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        background: '#f4f3ef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        fontFamily: 'var(--font-sans)'
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          background: '#ffffff',
          border: '1px solid #ded9cd',
          borderRadius: '14px',
          padding: '36px 32px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
          textAlign: 'center'
        }}
      >
        {/* Status Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fef3c7',
            border: '2px solid #fde68a',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}
        >
          <Power size={30} color="#b45309" />
        </div>

        {/* Badge */}
        <div style={{ marginBottom: '14px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f5f4ef',
              border: '1px solid #ded9cd',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#57534e',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
            AWS Cloud • Cost Optimization Standby
          </span>
        </div>

        {/* Heading */}
        <h2
          style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            color: '#1c1917',
            margin: '0 0 10px 0',
            letterSpacing: '-0.02em'
          }}
        >
          AWS EC2 Backend is Currently Stopped
        </h2>

        {/* Explanation */}
        <p
          style={{
            fontSize: '0.875rem',
            color: '#57534e',
            lineHeight: 1.6,
            margin: '0 0 22px 0'
          }}
        >
          To maintain zero cloud compute costs, the AWS EC2 instance is kept in <strong>Stopped mode</strong>.
          Start the instance from your AWS Console to resume real-time AI reasoning, live SQL telemetry queries across <strong>32,065 fleet records</strong>, and audit logs.
        </p>

        {/* Infrastructure Checklist Grid */}
        <div
          style={{
            background: '#faf9f5',
            border: '1px solid #e8e5dc',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '24px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: '#57534e', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ServerOff size={14} color="#b45309" />
              AWS EC2 Compute Server
            </span>
            <span style={{ fontWeight: 600, color: '#b45309' }}>Stopped (Standby)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: '#57534e', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={14} color="#78716c" />
              Docker MSSQL Database (32k rows)
            </span>
            <span style={{ fontWeight: 600, color: '#78716c' }}>Paused</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: '#57534e', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={14} color="#0f766e" />
              Pinecone Vector DB & SOPs
            </span>
            <span style={{ fontWeight: 600, color: '#0f766e' }}>Ready (Cloud)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleRetryClick}
            disabled={isRetrying}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px 18px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: isRetrying ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={16} className={isRetrying ? 'animate-spin' : ''} />
            <span>{isRetrying ? 'Checking AWS Connection...' : 'Check Server Status (Retry)'}</span>
          </button>

          <button
            onClick={onBypassDemo}
            type="button"
            style={{
              width: '100%',
              padding: '10px 18px',
              background: 'transparent',
              border: '1px solid #ded9cd',
              borderRadius: '8px',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#57534e',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f4ef'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Eye size={14} />
            <span>Preview UI Layout (Demo Mode)</span>
          </button>
        </div>

        <div style={{ marginTop: '16px', fontSize: '0.725rem', color: '#a8a29e' }}>
          Auto-polling server every 6 seconds • Reconnects automatically once EC2 boots
        </div>
      </div>
    </div>
  );
}
