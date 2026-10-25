import React from 'react';
import { AlertTriangle, Table, ArrowRight, FileText } from 'lucide-react';

export default function MarkdownView({ content }) {
  if (!content) return null;

  // Check if content has the standard incident sections
  const hasExecutiveSummary = /Executive Summary/i.test(content);
  const hasTelemetry = /Telemetry/i.test(content);
  const hasActionPlan = /Action Plan/i.test(content);

  if (hasExecutiveSummary || (hasTelemetry && hasActionPlan)) {
    return <StructuredIncidentReport content={content} />;
  }

  // Check if content is comparing Tier 1 vs Tier 2 escalation
  if (/Tier 1/i.test(content) && /Tier 2/i.test(content)) {
    return <EscalationComparisonView content={content} />;
  }

  // Fallback to general formatted view
  return <GeneralFormattedView content={content} />;
}

/**
 * Robust extraction of the 3 incident sections regardless of markdown header formatting.
 */
function extractSections(text) {
  // Find where section 2 begins (Telemetry)
  const s2Match = text.search(/(?:###|\*\*|•|\b)\s*2\.\s*(?:Telemetry|Environment)/i);
  // Find where section 3 begins (Action Plan)
  const s3Match = text.search(/(?:###|\*\*|•|\b)\s*3\.\s*(?:Required\s*)?Action/i);
  // Find where citation begins (including any markdown bold or heading prefix)
  const citMatch = text.search(/(?:(?:\*\*|###|#|•)\s*)?(?:SOP\s*Compliance\s*Citation|Citation:)/i);

  let exec = '';
  let telemetry = '';
  let action = '';
  let citation = '';

  if (s2Match !== -1) {
    exec = text.substring(0, s2Match).trim();

    if (s3Match !== -1 && s3Match > s2Match) {
      telemetry = text.substring(s2Match, s3Match).trim();

      if (citMatch !== -1 && citMatch > s3Match) {
        action = text.substring(s3Match, citMatch).trim().replace(/[*_#]+$/, '').trim();
        citation = text.substring(citMatch).trim();
      } else {
        action = text.substring(s3Match).trim();
      }
    } else {
      telemetry = text.substring(s2Match).trim();
    }
  } else {
    exec = text.trim();
  }

  return { exec, telemetry, action, citation };
}

/**
 * Structured view for 3-part Incident Control analysis.
 */
function StructuredIncidentReport({ content }) {
  const { exec, telemetry, action, citation } = extractSections(content);

  return (
    <div className="markdown-container">
      {/* 1. Executive Summary Card */}
      {exec && (
        <div className="section-card" style={{ borderLeftColor: '#c2410c', marginBottom: '16px' }}>
          <div className="section-title" style={{ color: '#c2410c' }}>
            <AlertTriangle size={17} />
            <span>1. Executive Summary</span>
          </div>
          <div style={{ color: '#292524', fontSize: '0.9rem' }}>
            {renderExecBullets(exec)}
          </div>
        </div>
      )}

      {/* 2. Telemetry & Environment Analysis Card */}
      {telemetry && (
        <div className="section-card" style={{ borderLeftColor: '#0f766e', marginBottom: '16px' }}>
          <div className="section-title" style={{ color: '#0f766e' }}>
            <Table size={17} />
            <span>2. Telemetry & Corridor Analysis</span>
          </div>
          {renderTelemetrySection(telemetry)}
        </div>
      )}

      {/* 3. Required Action Plan Card */}
      {action && (
        <div className="section-card" style={{ borderLeftColor: '#1e293b', marginBottom: '16px' }}>
          <div className="section-title" style={{ color: '#1e293b' }}>
            <ArrowRight size={17} />
            <span>3. Required Dispatch Action Plan</span>
          </div>
          {renderActionSteps(action)}
        </div>
      )}

      {/* 4. SOP Citation Callout */}
      {citation && (
        <div className="citation-callout">
          <FileText size={16} style={{ flexShrink: 0 }} />
          <div>
            <strong>SOP Compliance Citation:</strong>{' '}
            {citation.replace(/^[\s*#]*(?:SOP\s*Compliance\s*Citation:?|Citation:?)\s*/i, '').replace(/[*#]/g, '').trim()}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Cleans and renders bullet points in Executive Summary.
 */
function renderExecBullets(text) {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    // Filter out heading lines like "1. Executive Summary"
    .filter(l => !l.match(/^(?:###|\*\*|•|\b)?\s*1\.\s*Executive\s*Summary/i));

  if (lines.length === 0) {
    return <p style={{ margin: 0 }}>Incident overview recorded.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {lines.map((line, idx) => {
        const cleanLine = line.replace(/^[•*\-\s]+/, '').replace(/[*_]/g, '').trim();
        if (!cleanLine) return null;

        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ color: '#c2410c', fontWeight: 'bold', fontSize: '1.1rem', lineHeight: 1 }}>•</span>
            <span style={{ lineHeight: 1.55 }}>{cleanLine}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Parses markdown tables and analysis notes in Section 2.
 */
function renderTelemetrySection(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Extract table rows (lines that contain pipes)
  const tableLines = lines.filter(l => l.includes('|'));
  // Extract analysis commentary lines (lines that don't have pipes and aren't section header)
  const nonTableLines = lines.filter(l => 
    !l.includes('|') && 
    !l.match(/^(?:###|\*\*|•|\b)?\s*2\.\s*(?:Telemetry|Environment)/i)
  );

  let headers = [];
  let rows = [];

  if (tableLines.length >= 2) {
    headers = tableLines[0]
      .split('|')
      .map(h => h.trim())
      .filter(Boolean);

    // Skip separator line if present (e.g. |:---|:---|)
    const dataStartIdx = tableLines[1].includes('---') ? 2 : 1;
    for (let i = dataStartIdx; i < tableLines.length; i++) {
      const cells = tableLines[i]
        .split('|')
        .map(c => c.trim())
        .filter(Boolean);
      if (cells.length > 0) rows.push(cells);
    }
  }

  return (
    <div>
      {/* PowerBI Style Formatted Table */}
      {headers.length > 0 && rows.length > 0 ? (
        <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid #ded9cd', background: '#ffffff', margin: '8px 0 12px 0' }}>
          <table className="bi-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i}>{h.replace(/[*_]/g, '')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, rIdx) => (
                <tr key={rIdx}>
                  {r.map((cell, cIdx) => {
                    const isTemp = cell.includes('°C');
                    const isRisk = cell.toLowerCase().includes('high risk');
                    return (
                      <td 
                        key={cIdx} 
                        style={{ 
                          fontWeight: isTemp || isRisk ? 600 : 400,
                          color: isTemp && parseFloat(cell) > 4.0 ? '#991b1b' : isRisk ? '#991b1b' : '#1c1917'
                        }}
                      >
                        {cell.replace(/[*_]/g, '')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Analysis Commentary */}
      {nonTableLines.length > 0 && (
        <div style={{ background: '#f5f4ef', border: '1px solid #ded9cd', borderRadius: '6px', padding: '10px 14px', fontSize: '0.85rem', color: '#44403c' }}>
          {nonTableLines.map((line, idx) => {
            const clean = line.replace(/[*_]/g, '');
            return (
              <p key={idx} style={{ margin: '4px 0', lineHeight: 1.5 }}>
                {clean.toLowerCase().startsWith('analysis:') ? (
                  <>
                    <strong style={{ color: '#1c1917' }}>Analysis:</strong> {clean.replace(/^analysis:\s*/i, '')}
                  </>
                ) : (
                  clean
                )}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Parses individual action plan steps in Section 3 into structured step cards.
 */
function renderActionSteps(text) {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .filter(l => !l.match(/^(?:###|\*\*|•|\b)?\s*3\.\s*(?:Required\s*)?Action/i))
    .filter(l => l.replace(/[*_#•\-\s]/g, '').length > 0);

  const rawSteps = [];
  lines.forEach(line => {
    const match = line.match(/^(\d+)\.\s*(.*)/);
    if (match) {
      const content = match[2].trim();
      if (content.replace(/[*_#•\-\s]/g, '').length > 0) {
        rawSteps.push({ num: match[1], content });
      }
    } else if (line.startsWith('-') || line.startsWith('*')) {
      const content = line.replace(/^[-*]\s*/, '').trim();
      if (content.replace(/[*_#•\-\s]/g, '').length > 0) {
        rawSteps.push({ num: rawSteps.length + 1, content });
      }
    } else if (rawSteps.length > 0) {
      const content = line.trim();
      if (content.replace(/[*_#•\-\s]/g, '').length > 0) {
        rawSteps[rawSteps.length - 1].content += ' ' + content;
      }
    }
  });

  const steps = rawSteps.filter(s => s.content.replace(/[*_#•\-\s]/g, '').length > 0);

  if (steps.length === 0) {
    const fallback = text.replace(/[*_#]/g, '').trim();
    return fallback ? <div style={{ fontSize: '0.85rem' }}>{fallback}</div> : null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {steps.map((s, idx) => {
        const parts = s.content.split(/[:–-]\s*(.+)/);
        const title = parts.length >= 2 ? parts[0].replace(/[*_]/g, '').trim() : '';
        const body = parts.length >= 2 ? parts[1].replace(/[*_]/g, '').trim() : s.content.replace(/[*_]/g, '').trim();

        return (
          <div key={idx} className="action-step">
            <div className="action-num">{idx + 1}</div>
            <div style={{ fontSize: '0.875rem', color: '#292524', lineHeight: 1.5 }}>
              {title ? (
                <>
                  <strong style={{ color: '#1c1917' }}>{title}:</strong> {body}
                </>
              ) : (
                body
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Custom comparison cards for Tier 1 vs Tier 2 Escalation inquiry.
 */
function EscalationComparisonView({ content }) {
  const blocks = content.split(/(?=Tier\s*[12]\s*Escalation)/i);
  const intro = blocks[0].includes('Tier') ? '' : blocks[0];
  const tier1Block = blocks.find(b => b.toLowerCase().includes('tier 1')) || '';
  const tier2Block = blocks.find(b => b.toLowerCase().includes('tier 2')) || '';
  const bottomLine = content.match(/Bottom line:.*$/im)?.[0] || '';

  return (
    <div className="markdown-container">
      {intro && <p style={{ marginBottom: '14px', color: '#44403c' }}>{intro.trim()}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '14px' }}>
        {/* Tier 1 Card */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #ded9cd',
            borderTop: '4px solid #166534',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span className="badge badge-safe">TIER 1 ESCALATION</span>
            <span style={{ fontSize: '0.75rem', color: '#78716c' }}>Shift Routine</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#292524', lineHeight: 1.55 }}>
            {renderSubSections(tier1Block.replace(/Tier\s*1\s*Escalation/i, ''))}
          </div>
        </div>

        {/* Tier 2 Card */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #ded9cd',
            borderTop: '4px solid #991b1b',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span className="badge badge-danger">TIER 2 ESCALATION</span>
            <span style={{ fontSize: '0.75rem', color: '#78716c' }}>High-Risk Breach</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#292524', lineHeight: 1.55 }}>
            {renderSubSections(tier2Block.replace(/Tier\s*2\s*Escalation/i, ''))}
          </div>
        </div>
      </div>

      {bottomLine && (
        <div style={{ background: '#f5f4ef', border: '1px solid #ded9cd', borderRadius: '6px', padding: '12px 16px', fontSize: '0.85rem', color: '#1c1917' }}>
          <strong>📌 {bottomLine.replace(/[*_]/g, '')}</strong>
        </div>
      )}
    </div>
  );
}

function renderSubSections(text) {
  const items = text.split(/\s*-\s+/).filter(Boolean);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item, idx) => {
        const parts = item.split(/:\s*(.+)/);
        if (parts.length >= 2) {
          return (
            <div key={idx}>
              <strong style={{ color: '#1e293b' }}>{parts[0].replace(/[*_]/g, '')}:</strong>{' '}
              <span style={{ color: '#44403c' }}>{parts[1].replace(/[*_]/g, '')}</span>
            </div>
          );
        }
        return <p key={idx} style={{ margin: 0 }}>{item.replace(/[*_]/g, '')}</p>;
      })}
    </div>
  );
}

function GeneralFormattedView({ content }) {
  const paragraphs = content.split('\n\n').filter(Boolean);

  return (
    <div className="markdown-container">
      {paragraphs.map((p, idx) => (
        <p key={idx} style={{ margin: '8px 0', lineHeight: 1.6, color: '#292524', fontSize: '0.9rem' }}>
          {p.replace(/[*_]/g, '')}
        </p>
      ))}
    </div>
  );
}
