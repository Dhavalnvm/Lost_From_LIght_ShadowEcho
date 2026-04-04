// src/pages/DecoderPage.tsx
import React, { useEffect, useState } from 'react';
import DecoderPanel from '../components/panels/DecoderPanel';
import { apiFetch } from '../services/api';

interface DictStats {
  coverage: Record<string, number>;
  threat_categories: string[];
  languages: string[];
  examples: { input: string; decoded: string }[];
}

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

const DecoderPage: React.FC = () => {
  const [dict, setDict] = useState<DictStats | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await apiFetch<DictStats>('/api/decode/dictionary');
        setDict(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(err.message);
        }
      }
    };
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.3s ease' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <h1 style={{
          fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 700,
          color: T.text, letterSpacing: '0.18em', lineHeight: 1,
          textTransform: 'uppercase',
        }}>
          Slang Decoder
        </h1>
        <p style={{
          fontFamily: T.fontMono, fontSize: 10, color: T.muted,
          letterSpacing: '0.22em', marginTop: 6, textTransform: 'uppercase',
        }}>
          Dark web coded language · multi-language support
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <DecoderPanel />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dict && (
            <div style={{ border: `1px solid ${T.border}`, background: T.bg1, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{
                padding: '10px 16px', borderBottom: `1px solid ${T.border}`,
                background: 'rgba(37,99,235,0.02)',
              }}>
                <span style={{
                  fontFamily: T.fontMono, fontSize: 9,
                  letterSpacing: '0.22em', color: T.muted, textTransform: 'uppercase',
                }}>
                  ∑ Dictionary Coverage
                </span>
              </div>
              <div style={{ padding: 14 }}>
                {/* Coverage grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: 8, marginBottom: 14,
                }}>
                  {Object.entries(dict.coverage).map(([key, val]) => (
                    <div
                      key={key}
                      style={{
                        padding: '14px 14px 12px',
                        background: 'rgba(37,99,235,0.04)',
                        border: `1px solid ${T.border}`,
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(37,99,235,0.25)'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = T.border}
                    >
                      <div style={{
                        fontFamily: T.fontDisplay, fontWeight: 700,
                        fontSize: 22, color: T.cyan, lineHeight: 1,
                      }}>
                        {val}
                      </div>
                      <div style={{
                        fontFamily: T.fontMono, fontSize: 9,
                        color: T.muted, marginTop: 5, letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}>
                        {key.replace(/_/g, ' ')}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Language tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {dict.languages.map(l => (
                    <span
                      key={l}
                      style={{
                        padding: '3px 9px',
                        background: 'rgba(37,99,235,0.06)',
                        border: `1px solid rgba(37,99,235,0.18)`,
                        fontFamily: T.fontMono, fontSize: 9,
                        color: T.cyan, letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {dict && (
            <div style={{ border: `1px solid ${T.border}`, background: T.bg1, overflow: 'hidden' }}>
              <div style={{
                padding: '10px 16px', borderBottom: `1px solid ${T.border}`,
                background: 'rgba(37,99,235,0.02)',
              }}>
                <span style={{
                  fontFamily: T.fontMono, fontSize: 9,
                  letterSpacing: '0.22em', color: T.muted, textTransform: 'uppercase',
                }}>
                  eg Example Inputs
                </span>
              </div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {dict.examples.map((ex, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 12px',
                      background: 'rgba(0,0,0,0.02)',
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    <p style={{
                      fontFamily: T.fontMono, fontSize: 10,
                      color: '#ffcc00', marginBottom: 5, lineHeight: 1.5,
                    }}>
                      "{ex.input}"
                    </p>
                    <p style={{
                      fontFamily: T.fontMono, fontSize: 10,
                      color: T.muted, lineHeight: 1.5,
                    }}>
                      → {ex.decoded}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DecoderPage;