import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Terminal, 
  ChevronDown, 
  ChevronRight, 
  User, 
  Bot, 
  Loader2, 
  Sparkles,
  HelpCircle,
  Cpu,
  CheckCircle2
} from 'lucide-react';
import { streamChatMessage } from '../api/client';
import MarkdownView from './MarkdownView';

const SUGGESTED_QUERIES = [
  "Find any active shipments near Los Angeles (Latitude ~33.8, Longitude ~-118.1). Check the local weather there, and tell me if the current cargo temperature violates the SOP for fresh perishables.",
  "I'm a new dispatcher on the night shift. Can you quickly explain the difference between a Tier 1 and Tier 2 escalation?",
  "Check all shipments currently marked as High Risk with delay probability greater than 0.60 in the database."
];

export default function DispatchChat({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');
  const [activeTraces, setActiveTraces] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState('0.0');
  const [isLiveThinkingOpen, setIsLiveThinkingOpen] = useState(false);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTraces, currentStatus, isLiveThinkingOpen]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSend = async (queryText = null) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setCurrentStatus('Analyzing dispatcher intent & query parameters...');
    setActiveTraces([]);
    setIsLiveThinkingOpen(false);

    startTimeRef.current = Date.now();
    setElapsedSeconds('0.0');
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSeconds(((Date.now() - startTimeRef.current) / 1000).toFixed(1));
      }
    }, 100);

    const tracesAccumulator = [];

    streamChatMessage(
      sessionId,
      messages.map(m => ({ role: m.role, content: m.content })),
      textToSend,
      {
        onTrace: (event) => {
          if (event.type === 'status') {
            setCurrentStatus(event.message);
          } else {
            tracesAccumulator.push(event);
            setActiveTraces([...tracesAccumulator]);
          }
        },
        onComplete: (data) => {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          const finalDuration = startTimeRef.current
            ? ((Date.now() - startTimeRef.current) / 1000).toFixed(1)
            : null;

          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: data.content,
              traces: tracesAccumulator,
              duration: finalDuration
            }
          ]);
          setIsLoading(false);
          setCurrentStatus('');
          setActiveTraces([]);
        },
        onError: (err) => {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          const finalDuration = startTimeRef.current
            ? ((Date.now() - startTimeRef.current) / 1000).toFixed(1)
            : null;

          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `⚠️ System Error: ${err.error || 'Failed to communicate with reasoning agent.'}`,
              traces: tracesAccumulator,
              duration: finalDuration
            }
          ]);
          setIsLoading(false);
          setCurrentStatus('');
          setActiveTraces([]);
        }
      }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '24px 28px', boxSizing: 'border-box' }}>
      
      {/* Suggestions Pills on Empty State */}
      {messages.length === 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: '#57534e', fontSize: '0.8rem', fontWeight: 600 }}>
            <HelpCircle size={15} color="#78716c" />
            <span>Suggested Operational Dispatch Inquiries:</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
            {SUGGESTED_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                style={{
                  textAlign: 'left',
                  background: '#ffffff',
                  border: '1px solid #ded9cd',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  color: '#292524',
                  fontSize: '0.825rem',
                  lineHeight: 1.45,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f5f4ef';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#ffffff';
                }}
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Feed */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: '22px' }}>
            
            {/* User Message */}
            {msg.role === 'user' ? (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    maxWidth: '75%',
                    background: '#1e293b',
                    color: '#ffffff',
                    padding: '12px 16px',
                    borderRadius: '12px 12px 2px 12px',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                  }}
                >
                  {msg.content}
                </div>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <User size={16} color="#ffffff" />
                </div>
              </div>
            ) : (
              /* Assistant Message */
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#0f766e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Bot size={16} color="#ffffff" />
                </div>
                <div style={{ flex: 1, maxWidth: '94%' }}>
                  
                  {/* ChatGPT / Gemini Style Collapsible Thinking Dropdown */}
                  {msg.traces && msg.traces.length > 0 && (
                    <ThinkingDropdown traces={msg.traces} duration={msg.duration} />
                  )}

                  {/* Main Response Box (Clean Structured Report Card) */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #ded9cd',
                      borderRadius: '10px',
                      padding: '20px 24px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                    }}
                  >
                    <MarkdownView content={msg.content} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Live Loading / Streaming Step with interactive live dropdown */}
        {isLoading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#0f766e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Bot size={16} color="#ffffff" />
            </div>
            <div style={{ flex: 1, maxWidth: '94%' }}>
              <ThinkingDropdown
                traces={activeTraces}
                isLive={true}
                elapsedSeconds={elapsedSeconds}
                currentStatus={currentStatus}
                isOpen={isLiveThinkingOpen}
                onToggle={() => setIsLiveThinkingOpen(!isLiveThinkingOpen)}
              />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          marginTop: '12px',
          display: 'flex',
          gap: '10px',
          background: '#ffffff',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #ded9cd',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about active shipments, temperature violations, corridor weather, or SOP rules..."
          disabled={isLoading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#1c1917',
            fontSize: '0.9rem',
            padding: '6px'
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="btn-primary"
          style={{
            padding: '8px 18px',
            opacity: input.trim() && !isLoading ? 1 : 0.6,
            cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed'
          }}
        >
          {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}

/**
 * ChatGPT / Gemini style "Thought process & Tools" single collapsible dropdown.
 */
function ThinkingDropdown({ 
  traces = [], 
  isLive = false, 
  elapsedSeconds = '0.0', 
  currentStatus = '', 
  duration = null,
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const toggle = controlledOnToggle || (() => setInternalIsOpen(!internalIsOpen));

  // Count unique tools executed
  const toolNames = [...new Set(traces.filter(t => t.name).map(t => t.name))];
  const toolCount = toolNames.length;

  return (
    <div style={{ marginBottom: '10px' }}>
      <button
        onClick={toggle}
        type="button"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: isLive ? '#ffffff' : '#ffffff',
          border: isLive ? '1px solid #0f766e' : '1px solid #ded9cd',
          borderRadius: '20px',
          padding: '6px 14px',
          fontSize: '0.775rem',
          color: '#57534e',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: isLive ? '0 1px 4px rgba(15,118,110,0.1)' : '0 1px 2px rgba(0,0,0,0.02)',
          maxWidth: '100%',
          flexWrap: 'wrap'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = isLive ? '#f0fdfa' : '#f5f4ef';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = '#ffffff';
        }}
      >
        {isLive ? (
          <Loader2 size={13} className="animate-spin" color="#0f766e" />
        ) : (
          <Sparkles size={13} color="#0f766e" />
        )}

        {isLive ? (
          <>
            <span style={{ fontWeight: 600, color: '#0f766e' }}>
              Thinking ({elapsedSeconds}s)
            </span>
            <span style={{ color: '#44403c', maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              • {currentStatus || 'Reasoning with enterprise tools...'}
            </span>
            <span style={{ fontSize: '0.685rem', color: '#0f766e', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '12px', padding: '1px 8px', fontWeight: 600 }}>
              {isOpen ? 'Collapse live trace' : 'Open live trace'}
            </span>
          </>
        ) : (
          <>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>
              Thought {duration ? `for ${duration}s` : 'process'}
            </span>
            <span style={{ color: '#78716c' }}>
              • Reasoned with {toolCount} enterprise tools ({traces.length} steps)
            </span>
          </>
        )}

        {isOpen ? <ChevronDown size={13} color="#78716c" /> : <ChevronRight size={13} color="#78716c" />}
      </button>

      {/* Expanded Step-by-Step Tool Invocations */}
      {isOpen && (
        <div
          style={{
            marginTop: '8px',
            background: '#ffffff',
            border: isLive ? '1px solid #99f6e4' : '1px solid #ded9cd',
            borderRadius: '8px',
            padding: '12px 14px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isLive ? `Live Reasoning Timeline (${elapsedSeconds}s elapsed)` : `Agent Execution Timeline ${duration ? `(${duration}s)` : ''}`}
            </div>
            {isLive && (
              <span style={{ fontSize: '0.7rem', color: '#0f766e', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0f766e', display: 'inline-block' }}></span>
                Streaming live
              </span>
            )}
          </div>

          {traces.length === 0 && isLive && (
            <div style={{ fontSize: '0.75rem', color: '#78716c', padding: '8px 0', fontStyle: 'italic' }}>
              Analyzing dispatcher intent and selecting required enterprise tools...
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {traces.map((trace, idx) => {
              const isInput = trace.type === 'tool_input';

              return (
                <div
                  key={idx}
                  style={{
                    background: '#f9f8f5',
                    border: '1px solid #ded9cd',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: isInput ? '#1e293b' : '#0f766e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Terminal size={12} />
                      {isInput ? `Call: ${trace.name}` : `Output: ${trace.name}`}
                    </span>
                    <span style={{ fontSize: '0.685rem', color: '#78716c' }}>
                      Step #{idx + 1}
                    </span>
                  </div>

                  <pre
                    style={{
                      margin: 0,
                      background: '#ffffff',
                      border: '1px solid #e8e5dc',
                      borderRadius: '4px',
                      padding: '6px 8px',
                      fontSize: '0.725rem',
                      color: '#292524',
                      overflowX: 'auto',
                      maxHeight: '140px',
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {isInput
                      ? JSON.stringify(trace.args, null, 2)
                      : String(trace.content || '')}
                  </pre>
                </div>
              );
            })}

            {/* In-progress status banner if live */}
            {isLive && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  background: '#f0fdfa',
                  border: '1px solid #99f6e4',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#0f766e'
                }}
              >
                <Loader2 size={13} className="animate-spin" />
                <span style={{ fontWeight: 600 }}>Active Subsystem:</span>
                <span>{currentStatus || 'Processing...'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
