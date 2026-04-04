// src/pages/LineupPage.tsx
import React from 'react';
import LineupPanel from '../components/panels/LineupPanel';

/* ─── Design tokens ──────────────────────────────────────────────── */
const T = {
  bg1:    'rgba(248,249,250,0.95)',
  border: 'rgba(37,99,235,0.08)',
  muted:  'rgba(107,114,128,0.55)',
  text:   '#111827',
  cyan:   '#2563eb',
  fontDisplay: "'Syne', sans-serif",
  fontMono:    "'JetBrains Mono', monospace",
};

const SIM_LEVELS = [
  {
    range: '90–100%',
    color: '#ff2244',
    bg: 'rgba(255,34,68,0.05)',
    border: 'rgba(255,34,68,0.22)',
    label: 'VERY HIGH',
    note: 'Likely same author or copied content. Verify independently.',
    barW: '100%',
  },
  {
    range: '75–89%',
    color: '#ff6600',
    bg: 'rgba(255,102,0,0.05)',
    border: 'rgba(255,102,0,0.22)',
    label: 'HIGH',
    note: 'Possibly same actor or campaign. Analyst judgment required.',
    barW: '80%',
  },
  {
    range: '60–74%',
    color: '#ffcc00',
    bg: 'rgba(255,204,0,0.04)',
    border: 'rgba(255,204,0,0.18)',
    label: 'MODERATE',
    note: 'Shared topic or style — may be coincidental.',
    barW: '60%',
  },
  {
    range: '<60%',
    color: 'rgba(107,114,128,0.55)',
    bg: 'rgba(0,0,0,0.02)',
    border: 'rgba(0,0,0,0.04)',
    label: 'LOW',
    note: 'Weak connection. Included for completeness.',
    barW: '35%',
  },
];

const LineupPage: React.FC = () => (
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
          The Lineup
        </h1>
        <p style={{
          fontFamily: T.fontMono, fontSize: 10, color: T.muted,
          letterSpacing: '0.22em', marginTop: 6, textTransform: 'uppercase',
        }}>
          Behavioral + linguistic similarity · never claims identity
        </p>
      </div>

      {/* Analyst notice pill */}
      <div style={{
        padding: '10px 16px',
        border: '1px solid rgba(255,204,0,0.25)',
        background: 'rgba(255,204,0,0.03)',
        maxWidth: 260,
      }}>
        <div style={{
          fontFamily: T.fontMono, fontSize: 8,
          color: '#ffcc00', letterSpacing: '0.18em',
          textTransform: 'uppercase', marginBottom: 5,
        }}>
          ◬ Analyst Notice
        </div>
        <p style={{
          fontFamily: T.fontMono, fontSize: 9,
          color: 'rgba(255,204,0,0.6)', lineHeight: 1.55,
        }}>
          Similarity scores are behavioral indicators only. Independent verification required before action.
        </p>
      </div>
    </div>

    {/* ── Main grid ─────────────────────────────────────────── */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>
      <LineupPanel />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Similarity scale */}
        <div style={{ border: `1px solid ${T.border}`, background: T.bg1, overflow: 'hidden' }}>
          <div style={{
            padding: '10px 16px', borderBottom: `1px solid ${T.border}`,
            background: 'rgba(37,99,235,0.02)',
          }}>
            <span style={{
              fontFamily: T.fontMono, fontSize: 9,
              letterSpacing: '0.22em', color: T.muted, textTransform: 'uppercase',
            }}>
              ◈ Similarity Scale
            </span>
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {SIM_LEVELS.map(item => (
              <div
                key={item.range}
                style={{
                  padding: '12px 14px',
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: 7,
                }}>
                  <span style={{
                    fontFamily: T.fontDisplay, fontSize: 13,
                    fontWeight: 700, color: item.color,
                  }}>
                    {item.range}
                  </span>
                  <span style={{
                    fontFamily: T.fontMono, fontSize: 8,
                    letterSpacing: '0.18em', color: item.color,
                    padding: '2px 7px', border: `1px solid ${item.border}`,
                    textTransform: 'uppercase',
                  }}>
                    {item.label}
                  </span>
                </div>
                {/* Bar */}
                <div style={{
                  height: 3, background: 'rgba(0,0,0,0.04)',
                  borderRadius: 2, overflow: 'hidden', marginBottom: 8,
                }}>
                  <div style={{
                    width: item.barW, height: '100%',
                    background: item.color, borderRadius: 2,
                  }} />
                </div>
                <p style={{
                  fontFamily: T.fontMono, fontSize: 10,
                  color: T.muted, lineHeight: 1.55,
                }}>
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Method */}
        <div style={{ border: `1px solid ${T.border}`, background: T.bg1, overflow: 'hidden' }}>
          <div style={{
            padding: '10px 16px', borderBottom: `1px solid ${T.border}`,
            background: 'rgba(37,99,235,0.02)',
          }}>
            <span style={{
              fontFamily: T.fontMono, fontSize: 9,
              letterSpacing: '0.22em', color: T.muted, textTransform: 'uppercase',
            }}>
              ◈ Method
            </span>
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '⬡', color: T.cyan,    label: 'BGE-M3 Embeddings', desc: 'Posts encoded as 1024-dim vectors capturing semantic + behavioral patterns.' },
              { icon: '◈', color: '#16a34a', label: 'ChromaDB Search',   desc: 'Cosine similarity against the full post vector store.' },
              { icon: '◉', color: '#ffcc00', label: 'Analyst Layer',      desc: 'Scores shown with explicit uncertainty. You decide identity, not the model.' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: item.color, fontSize: 15, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <div>
                  <div style={{
                    fontFamily: T.fontMono, fontSize: 11,
                    fontWeight: 700, color: item.color, marginBottom: 3,
                  }}>
                    {item.label}
                  </div>
                  <p style={{
                    fontFamily: T.fontMono, fontSize: 10,
                    color: T.muted, lineHeight: 1.6,
                  }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default LineupPage;