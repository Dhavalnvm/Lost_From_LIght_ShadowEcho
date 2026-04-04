// src/pages/ChatPage.tsx
import React from 'react';
import ChatPanel from '../components/panels/ChatPanel';

/* ─── Design tokens ──────────────────────────────────────────────── */
const T = {
  bg1:    'rgba(248,249,250,0.95)',
  border: 'rgba(37,99,235,0.08)',
  borderStrong: 'rgba(37,99,235,0.2)',
  muted:  'rgba(107,114,128,0.55)',
  text:   '#111827',
  cyan:   '#2563eb',
  fontDisplay: "'Syne', sans-serif",
  fontMono:    "'JetBrains Mono', monospace",
};

const DATA_SOURCES = [
  {
    icon: '◈',
    label: 'ChromaDB',
    desc: 'Semantic vector search — 1,205 docs',
    color: '#2563eb',
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
    color: '#16a34a',
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
  ORGS: '#2563eb', OVERVIEW: '#16a34a', IOC: '#ff6600',
  STATS: '#2563eb', ACTORS: '#ffcc00',
};

const ChatPage: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.3s ease' }}>

    {/* ── Header ─────────────────────────────────────────────── */}
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      paddingBottom: 20, borderBottom: `1px solid ${T.border}`,
    }}>
      <div>
        <h1 style={{
          fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 700,
          color: T.text, letterSpacing: '0.18em', lineHeight: 1,
          textTransform: 'uppercase',
        }}>
          Analyst Assistant
        </h1>
        <p style={{
          fontFamily: T.fontMono, fontSize: 10, color: T.muted,
          letterSpacing: '0.22em', marginTop: 6, textTransform: 'uppercase',
        }}>
          RAG-powered · grounded in live intelligence data
        </p>
      </div>

      {/* Model pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 16px',
        border: `1px solid rgba(0,255,136,0.2)`,
        background: 'rgba(0,255,136,0.04)',
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#16a34a', boxShadow: '0 0 8px #16a34a',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
        <span style={{
          fontFamily: T.fontMono, fontSize: 9,
          color: '#16a34a', letterSpacing: '0.15em',
        }}>
          llama3.2:3b · ONLINE
        </span>
      </div>
    </div>

    {/* ── Main grid ──────────────────────────────────────────── */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>

      {/* Chat panel */}
      <div style={{
        border: `1px solid ${T.border}`, background: T.bg1,
        display: 'flex', flexDirection: 'column', minHeight: 620,
        overflow: 'hidden',
      }}>
        {/* Chat header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px',
          borderBottom: `1px solid ${T.border}`,
          background: 'rgba(37,99,235,0.02)',
        }}>
          <span style={{
            fontFamily: T.fontMono, fontSize: 9,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: T.muted,
          }}>
            ◈ Intelligence Chat Session
          </span>
          <span style={{
            marginLeft: 'auto',
            fontFamily: T.fontMono, fontSize: 9, color: 'rgba(107,114,128,0.35)',
          }}>
            {new Date().toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <ChatPanel />
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Data sources */}
        <div style={{ border: `1px solid ${T.border}`, background: T.bg1, overflow: 'hidden' }}>
          <div style={{
            padding: '10px 16px', borderBottom: `1px solid ${T.border}`,
            background: 'rgba(37,99,235,0.02)',
          }}>
            <span style={{
              fontFamily: T.fontMono, fontSize: 9,
              letterSpacing: '0.22em', color: T.muted, textTransform: 'uppercase',
            }}>
              ◈ RAG Data Sources
            </span>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {DATA_SOURCES.map(s => (
              <div
                key={s.label}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px',
                  background: 'rgba(0,0,0,0.02)',
                  border: `1px solid ${T.border}`,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = `${s.color}22`}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = T.border}
              >
                <span style={{ color: s.color, fontSize: 15, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>
                  {s.icon}
                </span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <span style={{ fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, color: T.text }}>
                      {s.label}
                    </span>
                    <span style={{
                      fontFamily: T.fontMono, fontSize: 7,
                      color: s.color, padding: '1px 5px',
                      border: `1px solid ${s.color}33`,
                      background: `${s.color}0d`,
                      letterSpacing: '0.1em',
                    }}>
                      {s.detail}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: T.fontMono, fontSize: 10,
                    color: T.muted, lineHeight: 1.5,
                  }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example questions */}
        <div style={{ border: `1px solid ${T.border}`, background: T.bg1, overflow: 'hidden' }}>
          <div style={{
            padding: '10px 16px', borderBottom: `1px solid ${T.border}`,
            background: 'rgba(37,99,235,0.02)',
          }}>
            <span style={{
              fontFamily: T.fontMono, fontSize: 9,
              letterSpacing: '0.22em', color: T.muted, textTransform: 'uppercase',
            }}>
              ◈ Example Queries
            </span>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {EXAMPLE_QUESTIONS.map(({ q, tag }) => {
              const tagColor = TAG_COLORS[tag] ?? T.cyan;
              return (
                <div
                  key={q}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '8px 10px',
                    background: 'rgba(0,0,0,0.02)',
                    border: `1px solid ${T.border}`,
                    cursor: 'default', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.03)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.02)'}
                >
                  <span style={{
                    fontFamily: T.fontMono, fontSize: 7,
                    color: tagColor, padding: '2px 5px',
                    border: `1px solid ${tagColor}33`,
                    background: `${tagColor}0d`,
                    letterSpacing: '0.1em',
                    flexShrink: 0, marginTop: 1,
                  }}>
                    {tag}
                  </span>
                  <span style={{
                    fontFamily: T.fontMono, fontSize: 10,
                    color: T.muted, lineHeight: 1.5,
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