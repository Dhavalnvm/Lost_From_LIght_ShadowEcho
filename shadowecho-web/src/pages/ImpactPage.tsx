// src/pages/ImpactPage.tsx
import React, { useEffect, useState } from 'react';
import ImpactPanel from '../components/panels/ImpactPanel';
import { apiFetch } from '../services/api';

interface MethodologyEntry {
  description: string;
  methods?: string[];
  types?: string[];
  regulations?: string[];
  method?: string;
  dimensions?: string[];
  note?: string;
}

interface Methodology {
  overview: string;
  methodology: Record<string, MethodologyEntry>;
  limitations: string[];
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

const METH_COLORS = ['#2563eb', '#16a34a', '#ff6600', '#ffcc00', '#9d4edd'];

const ImpactPage: React.FC = () => {
  const [methodology, setMethodology] = useState<Methodology | null>(null);

  useEffect(() => {
    apiFetch<Methodology>('/api/impact/methodology')
      .then(setMethodology)
      .catch(console.error);
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
          Leak Impact Estimator
        </h1>
        <p style={{
          fontFamily: T.fontMono, fontSize: 10, color: T.muted,
          letterSpacing: '0.22em', marginTop: 6, textTransform: 'uppercase',
        }}>
          Financial · regulatory · reputational risk assessment
        </p>
      </div>

      {/* ── Main grid ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <ImpactPanel />

        {methodology && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Overview */}
            <div style={{
              padding: '18px 20px',
              border: `1px solid ${T.border}`,
              background: T.bg1,
            }}>
              <div style={{
                fontFamily: T.fontMono, fontSize: 9,
                letterSpacing: '0.22em', color: T.muted,
                textTransform: 'uppercase', marginBottom: 12,
              }}>
                ◈ Methodology Overview
              </div>
              <p style={{
                fontFamily: T.fontMono, fontSize: 11,
                color: 'rgba(200,223,240,0.7)', lineHeight: 1.8,
              }}>
                {methodology.overview}
              </p>
            </div>

            {/* Assessment Dimensions */}
            <div style={{ border: `1px solid ${T.border}`, background: T.bg1, overflow: 'hidden' }}>
              <div style={{
                padding: '10px 16px', borderBottom: `1px solid ${T.border}`,
                background: 'rgba(37,99,235,0.02)',
              }}>
                <span style={{
                  fontFamily: T.fontMono, fontSize: 9,
                  letterSpacing: '0.22em', color: T.muted, textTransform: 'uppercase',
                }}>
                  ◈ Assessment Dimensions
                </span>
              </div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {Object.entries(methodology.methodology).map(([key, val], i) => {
                  const color = METH_COLORS[i % METH_COLORS.length];
                  return (
                    <div
                      key={key}
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(0,0,0,0.02)',
                        border: `1px solid ${T.border}`,
                        borderLeft: `3px solid ${color}`,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.03)'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.02)'}
                    >
                      <div style={{
                        fontFamily: T.fontMono, fontSize: 9,
                        fontWeight: 700, color,
                        letterSpacing: '0.18em', textTransform: 'uppercase',
                        marginBottom: 5,
                      }}>
                        {key.replace(/_/g, ' ')}
                      </div>
                      <p style={{
                        fontFamily: T.fontMono, fontSize: 10,
                        color: T.muted, lineHeight: 1.65,
                      }}>
                        {val.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Limitations */}
            <div style={{
              padding: '16px 18px',
              border: '1px solid rgba(255,204,0,0.15)',
              background: 'rgba(255,204,0,0.025)',
            }}>
              <div style={{
                fontFamily: T.fontMono, fontSize: 9,
                letterSpacing: '0.22em', color: '#ffcc00',
                textTransform: 'uppercase', marginBottom: 12,
              }}>
                ◬ Limitations
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {methodology.limitations.map((l, i) => (
                  <li key={i} style={{
                    display: 'flex', gap: 10,
                    fontFamily: T.fontMono, fontSize: 10,
                    color: T.muted, lineHeight: 1.65,
                  }}>
                    <span style={{ color: '#ffcc00', flexShrink: 0, marginTop: 1 }}>·</span>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImpactPage;