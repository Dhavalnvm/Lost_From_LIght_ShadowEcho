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

const METH_COLORS = ['#00d4ff','#00ff88','#ff6600','#ffcc00','#9d4edd'];

const ImpactPage: React.FC = () => {
  const [methodology, setMethodology] = useState<Methodology | null>(null);

  useEffect(() => {
    apiFetch<Methodology>('/api/impact/methodology')
      .then(setMethodology)
      .catch(console.error);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.3s ease' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
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
            LEAK IMPACT ESTIMATOR
          </h1>
          <p style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 11,
            color: 'rgba(90,138,176,0.7)',
            letterSpacing: '0.15em',
            marginTop: 4,
            textTransform: 'uppercase',
          }}>
            Financial · regulatory · reputational risk assessment
          </p>
        </div>
      </div>

      {/* ── Main grid ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <ImpactPanel />

        {methodology && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Overview */}
            <div style={{
              padding: 18,
              border: '1px solid rgba(14,32,53,1)',
              background: 'rgba(7,16,28,0.9)',
            }}>
              <div style={{
                fontFamily: "'Share Tech Mono',monospace",
                fontSize: 9,
                letterSpacing: '0.25em',
                color: 'rgba(90,138,176,0.5)',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}>
                ◈ Methodology Overview
              </div>
              <p style={{
                fontFamily: "'Share Tech Mono',monospace",
                fontSize: 12,
                color: 'rgba(200,223,240,0.75)',
                lineHeight: 1.8,
              }}>
                {methodology.overview}
              </p>
            </div>

            {/* Methodology entries */}
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
                  ◈ Assessment Dimensions
                </span>
              </div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(methodology.methodology).map(([key, val], i) => {
                  const color = METH_COLORS[i % METH_COLORS.length];
                  return (
                    <div key={key} style={{
                      padding: '12px 14px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderLeft: `3px solid ${color}`,
                    }}>
                      <div style={{
                        fontFamily: "'Share Tech Mono',monospace",
                        fontSize: 10,
                        fontWeight: 700,
                        color,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        marginBottom: 5,
                      }}>
                        {key.replace(/_/g, ' ')}
                      </div>
                      <p style={{
                        fontFamily: "'Share Tech Mono',monospace",
                        fontSize: 11,
                        color: 'rgba(90,138,176,0.7)',
                        lineHeight: 1.6,
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
              padding: 16,
              border: '1px solid rgba(255,204,0,0.15)',
              background: 'rgba(255,204,0,0.03)',
            }}>
              <div style={{
                fontFamily: "'Share Tech Mono',monospace",
                fontSize: 9,
                letterSpacing: '0.25em',
                color: '#ffcc00',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}>
                ◬ Limitations
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {methodology.limitations.map((l, i) => (
                  <li key={i} style={{
                    display: 'flex',
                    gap: 8,
                    fontFamily: "'Share Tech Mono',monospace",
                    fontSize: 11,
                    color: 'rgba(90,138,176,0.65)',
                    lineHeight: 1.6,
                  }}>
                    <span style={{ color: '#ffcc00', flexShrink: 0 }}>·</span>
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