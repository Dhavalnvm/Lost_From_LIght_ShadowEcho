// src/pages/ChatPage.tsx
import React from 'react';
import ChatPanel from '../components/panels/ChatPanel';

const DATA_SOURCES = [
  {
    icon: '◈',
    label: 'ChromaDB',
    desc: 'Semantic vector search — 1,205 docs',
    color: '#00d4ff',
    detail: 'BGE-M3 embeddings',
  },
  {
    icon: '⬡',
    label: 'SQLite Alerts',
    desc: 'Recent alerts with severity + confidence',
    color: '#ff6600',
    detail: 'Live read',
  },
  {
    icon: '◉',
    label: 'Dashboard Stats',
    desc: 'Live situational awareness snapshot',
    color: '#00ff88',
    detail: 'Auto-refreshed',
  },
  {
    icon: '≡',
    label: 'Org Mentions',
    desc: 'Cross-source org name pattern matching',
    color: '#ffcc00',
    detail: 'Exact + semantic',
  },
];

const EXAMPLE_QUESTIONS = [
  { q: 'Summarize the latest critical alerts', tag: 'ALERTS' },
  { q: 'What credentials were recently leaked?', tag: 'CREDS' },
  { q: 'Are there any ransomware indicators?', tag: 'MALWARE' },
  { q: 'Which organizations are being targeted?', tag: 'ORGS' },
  { q: 'Describe the current threat landscape', tag: 'OVERVIEW' },
  { q: 'What IOCs were detected today?', tag: 'IOC' },
  { q: 'What is the signal-to-noise ratio?', tag: 'STATS' },
  { q: 'Who are the most active threat actors?', tag: 'ACTORS' },
];

const TAG_COLORS: Record<string, string> = {
  ALERTS: '#ff2244', CREDS: '#ff6600', MALWARE: '#ff2244',
  ORGS: '#00d4ff', OVERVIEW: '#00ff88', IOC: '#ff6600',
  STATS: '#00d4ff', ACTORS: '#ffcc00',
};

const ChatPage: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.3s ease' }}>

    {/* ── Page header ─────────────────────────────────────────── */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{
            fontFamily: "'Orbitron',monospace",
            fontSize: 26,
            fontWeight: 700,
            color: '#c8dff0',
            letterSpacing: '0.1em',
            lineHeight: 1,
          }}>
            ANALYST ASSISTANT
          </h1>
          <p style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 11,
            color: 'rgba(90,138,176,0.7)',
            letterSpacing: '0.15em',
            marginTop: 4,
            textTransform: 'uppercase',
          }}>
            RAG-powered · grounded in live intelligence data
          </p>
        </div>
      </div>
      {/* Model pill */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        border: '1px solid rgba(0,255,136,0.2)',
        background: 'rgba(0,255,136,0.05)',
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#00ff88',
          boxShadow: '0 0 8px #00ff88',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
        <span style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: 10,
          color: '#00ff88',
          letterSpacing: '0.15em',
        }}>
          llama3.2:3b · ONLINE
        </span>
      </div>
    </div>

    {/* ── Main grid ───────────────────────────────────────────── */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

      {/* Chat panel */}
      <div style={{
        border: '1px solid rgba(14,32,53,1)',
        background: 'rgba(7,16,28,0.9)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 600,
      }}>
        {/* Chat header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 18px',
          borderBottom: '1px solid rgba(14,32,53,1)',
          background: 'rgba(0,212,255,0.02)',
        }}>
          <span style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 9,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(90,138,176,0.6)',
          }}>
            ◈ INTELLIGENCE CHAT SESSION
          </span>
          <span style={{
            marginLeft: 'auto',
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 9,
            color: 'rgba(90,138,176,0.4)',
          }}>
            {new Date().toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <ChatPanel />
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Data sources */}
        <div style={{
          border: '1px solid rgba(14,32,53,1)',
          background: 'rgba(7,16,28,0.9)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid rgba(14,32,53,1)',
            background: 'rgba(0,212,255,0.02)',
          }}>
            <span style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 9,
              letterSpacing: '0.25em',
              color: 'rgba(90,138,176,0.6)',
              textTransform: 'uppercase',
            }}>
              ◈ RAG DATA SOURCES
            </span>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DATA_SOURCES.map(s => (
              <div
                key={s.label}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span style={{ color: s.color, fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>
                  {s.icon}
                </span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{
                      fontFamily: "'Share Tech Mono',monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#c8dff0',
                    }}>
                      {s.label}
                    </span>
                    <span style={{
                      fontFamily: "'Share Tech Mono',monospace",
                      fontSize: 8,
                      color: s.color,
                      padding: '1px 5px',
                      border: `1px solid ${s.color}33`,
                      background: `${s.color}0d`,
                      letterSpacing: '0.1em',
                    }}>
                      {s.detail}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: "'Share Tech Mono',monospace",
                    fontSize: 10,
                    color: 'rgba(90,138,176,0.6)',
                    lineHeight: 1.5,
                  }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example questions */}
        <div style={{
          border: '1px solid rgba(14,32,53,1)',
          background: 'rgba(7,16,28,0.9)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid rgba(14,32,53,1)',
            background: 'rgba(0,212,255,0.02)',
          }}>
            <span style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 9,
              letterSpacing: '0.25em',
              color: 'rgba(90,138,176,0.6)',
              textTransform: 'uppercase',
            }}>
              ◈ EXAMPLE QUERIES
            </span>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {EXAMPLE_QUESTIONS.map(({ q, tag }) => {
              const tagColor = TAG_COLORS[tag] ?? '#00d4ff';
              return (
                <div
                  key={q}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '8px 10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'default',
                  }}
                >
                  <span style={{
                    fontFamily: "'Share Tech Mono',monospace",
                    fontSize: 7,
                    color: tagColor,
                    padding: '2px 5px',
                    border: `1px solid ${tagColor}33`,
                    background: `${tagColor}0d`,
                    letterSpacing: '0.1em',
                    flexShrink: 0,
                    marginTop: 1,
                  }}>
                    {tag}
                  </span>
                  <span style={{
                    fontFamily: "'Share Tech Mono',monospace",
                    fontSize: 11,
                    color: 'rgba(90,138,176,0.75)',
                    lineHeight: 1.5,
                  }}>
                    {q}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ChatPage;