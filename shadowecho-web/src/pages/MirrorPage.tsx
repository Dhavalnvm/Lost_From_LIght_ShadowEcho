// src/pages/MirrorPage.tsx
import React from 'react';
import MirrorPanel from '../components/panels/MirrorPanel';

const HOW_IT_WORKS = [
  {
    icon: '◈',
    color: '#00d4ff',
    title: 'Exact Match',
    tag: 'SQLite',
    desc: 'Searches the full post database for direct mentions of the organization name across all ingested sources.',
  },
  {
    icon: '⬡',
    color: '#00ff88',
    title: 'Semantic Search',
    tag: 'ChromaDB',
    desc: 'BGE-M3 vector similarity finds contextually related posts even without an explicit name mention.',
  },
  {
    icon: '◉',
    color: '#ff6600',
    title: 'Threat Enrichment',
    tag: 'Detector',
    desc: 'Each post is scanned for credentials and IOCs to surface the highest-risk mentions first.',
  },
];

const TIPS = [
  'Try partial names — "HDFC" finds more than "HDFC Bank Ltd."',
  'Semantic search catches aliases and abbreviations',
  'Posts with credentials are flagged automatically',
  'Results are ranked by signal score × recency',
];

const MirrorPage: React.FC = () => (
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
            THE MIRROR
          </h1>
          <p style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 11,
            color: 'rgba(90,138,176,0.7)',
            letterSpacing: '0.15em',
            marginTop: 4,
            textTransform: 'uppercase',
          }}>
            Search what threat actors say about any organization
          </p>
        </div>
      </div>

      {/* Coverage badge */}
      <div style={{
        padding: '10px 16px',
        border: '1px solid rgba(0,212,255,0.15)',
        background: 'rgba(0,212,255,0.04)',
        textAlign: 'right',
      }}>
        <div style={{
          fontFamily: "'Orbitron',monospace",
          fontSize: 22,
          fontWeight: 700,
          color: '#00d4ff',
          lineHeight: 1,
        }}>
          1,205
        </div>
        <div style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: 8,
          letterSpacing: '0.2em',
          color: 'rgba(90,138,176,0.5)',
          marginTop: 4,
          textTransform: 'uppercase',
        }}>
          Posts in Index
        </div>
      </div>
    </div>

    {/* ── Main grid ─────────────────────────────────────────────── */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>
      <MirrorPanel />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

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
              ◈ How It Works
            </span>
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {HOW_IT_WORKS.map(item => (
              <div
                key={item.title}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderLeft: `3px solid ${item.color}`,
                }}
              >
                <span style={{ color: item.color, fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                  {item.icon}
                </span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <span style={{
                      fontFamily: "'Share Tech Mono',monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#c8dff0',
                    }}>
                      {item.title}
                    </span>
                    <span style={{
                      fontFamily: "'Share Tech Mono',monospace",
                      fontSize: 8,
                      color: item.color,
                      padding: '1px 5px',
                      border: `1px solid ${item.color}33`,
                      background: `${item.color}0d`,
                      letterSpacing: '0.1em',
                    }}>
                      {item.tag}
                    </span>
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

        {/* Tips */}
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
              ◈ Search Tips
            </span>
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {TIPS.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{
                  fontFamily: "'Orbitron',monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#00d4ff',
                  flexShrink: 0,
                  marginTop: 1,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{
                  fontFamily: "'Share Tech Mono',monospace",
                  fontSize: 11,
                  color: 'rgba(90,138,176,0.65)',
                  lineHeight: 1.6,
                }}>
                  {tip}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Match types legend */}
        <div style={{
          padding: 14,
          border: '1px solid rgba(14,32,53,1)',
          background: 'rgba(7,16,28,0.9)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 9,
            letterSpacing: '0.25em',
            color: 'rgba(90,138,176,0.5)',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}>
            ◈ Match Types
          </div>
          {[
            { type: 'EXACT', color: '#00d4ff', desc: 'Direct name found in post body' },
            { type: 'SEMANTIC', color: '#00ff88', desc: 'Contextually related via embeddings' },
          ].map(m => (
            <div key={m.type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontFamily: "'Share Tech Mono',monospace",
                fontSize: 8,
                color: m.color,
                padding: '2px 6px',
                border: `1px solid ${m.color}33`,
                background: `${m.color}0d`,
                letterSpacing: '0.1em',
                flexShrink: 0,
              }}>
                {m.type}
              </span>
              <span style={{
                fontFamily: "'Share Tech Mono',monospace",
                fontSize: 10,
                color: 'rgba(90,138,176,0.55)',
              }}>
                {m.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default MirrorPage;