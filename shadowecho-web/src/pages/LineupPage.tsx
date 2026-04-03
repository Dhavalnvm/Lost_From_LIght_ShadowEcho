// src/pages/LineupPage.tsx
import React from 'react';
import LineupPanel from '../components/panels/LineupPanel';

const SIM_LEVELS = [
  {
    range: '90–100%',
    color: '#ff2244',
    bg: 'rgba(255,34,68,0.06)',
    border: 'rgba(255,34,68,0.25)',
    label: 'VERY HIGH',
    note: 'Likely same author or copied content. Verify independently.',
    barW: '100%',
  },
  {
    range: '75–89%',
    color: '#ff6600',
    bg: 'rgba(255,102,0,0.06)',
    border: 'rgba(255,102,0,0.25)',
    label: 'HIGH',
    note: 'Possibly same actor or campaign. Analyst judgment required.',
    barW: '80%',
  },
  {
    range: '60–74%',
    color: '#ffcc00',
    bg: 'rgba(255,204,0,0.04)',
    border: 'rgba(255,204,0,0.2)',
    label: 'MODERATE',
    note: 'Shared topic or style — may be coincidental.',
    barW: '60%',
  },
  {
    range: '<60%',
    color: 'rgba(90,138,176,0.5)',
    bg: 'rgba(255,255,255,0.02)',
    border: 'rgba(255,255,255,0.06)',
    label: 'LOW',
    note: 'Weak connection. Included for completeness.',
    barW: '35%',
  },
];

const LineupPage: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.3s ease' }}>

    {/* ── Header ────────────────────────────────────────────────── */}
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
            THE LINEUP
          </h1>
          <p style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 11,
            color: 'rgba(90,138,176,0.7)',
            letterSpacing: '0.15em',
            marginTop: 4,
            textTransform: 'uppercase',
          }}>
            Behavioral + linguistic similarity · never claims identity
          </p>
        </div>
      </div>

      {/* Warning pill */}
      <div style={{
        padding: '8px 14px',
        border: '1px solid rgba(255,204,0,0.3)',
        background: 'rgba(255,204,0,0.04)',
        maxWidth: 260,
      }}>
        <div style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: 9,
          color: '#ffcc00',
          letterSpacing: '0.15em',
          marginBottom: 3,
        }}>
          ◬ ANALYST NOTICE
        </div>
        <p style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: 9,
          color: 'rgba(255,204,0,0.65)',
          lineHeight: 1.5,
        }}>
          Similarity scores are behavioral indicators only. Independent verification required before action.
        </p>
      </div>
    </div>

    {/* ── Main grid ─────────────────────────────────────────────── */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
      <LineupPanel />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Similarity scale */}
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
              ◈ Similarity Scale
            </span>
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SIM_LEVELS.map(item => (
              <div
                key={item.range}
                style={{
                  padding: '12px 14px',
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{
                    fontFamily: "'Orbitron',monospace",
                    fontSize: 13,
                    fontWeight: 700,
                    color: item.color,
                  }}>
                    {item.range}
                  </span>
                  <span style={{
                    fontFamily: "'Share Tech Mono',monospace",
                    fontSize: 8,
                    letterSpacing: '0.2em',
                    color: item.color,
                    padding: '2px 6px',
                    border: `1px solid ${item.border}`,
                  }}>
                    {item.label}
                  </span>
                </div>
                {/* Visual bar */}
                <div style={{
                  height: 3,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  marginBottom: 8,
                }}>
                  <div style={{
                    width: item.barW,
                    height: '100%',
                    background: item.color,
                    borderRadius: 2,
                  }} />
                </div>
                <p style={{
                  fontFamily: "'Share Tech Mono',monospace",
                  fontSize: 10,
                  color: 'rgba(90,138,176,0.6)',
                  lineHeight: 1.5,
                }}>
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
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
              ◈ Method
            </span>
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '⬡', color: '#00d4ff', label: 'BGE-M3 Embeddings', desc: 'Posts encoded as 1024-dim vectors capturing semantic + behavioral patterns.' },
              { icon: '◈', color: '#00ff88', label: 'ChromaDB Search', desc: 'Cosine similarity against the full post vector store.' },
              { icon: '◉', color: '#ffcc00', label: 'Analyst Layer', desc: 'Scores shown with explicit uncertainty. You decide identity, not the model.' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: item.color, fontSize: 16, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <div>
                  <div style={{
                    fontFamily: "'Share Tech Mono',monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color: item.color,
                    marginBottom: 3,
                  }}>
                    {item.label}
                  </div>
                  <p style={{
                    fontFamily: "'Share Tech Mono',monospace",
                    fontSize: 10,
                    color: 'rgba(90,138,176,0.6)',
                    lineHeight: 1.6,
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