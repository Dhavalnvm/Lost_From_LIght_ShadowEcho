// src/components/charts/AlertDistribution.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Splunk/Palo Alto SOC aesthetic — larger fonts, sharper data hierarchy
// Guard: summary is null/undefined during initial fetch → loading state
// Only non-zero slices are passed to recharts (prevents arc-math corruption)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AlertSummary } from '../../types/api';
import { Card, SectionHeader } from '../common';
import DarkTooltip from '../ui/DarkTooltip';

interface Props {
  summary: AlertSummary | null | undefined;
}

// ── Design tokens (local, avoids import cycle) ───────────────────────────────

const T = {
  bg3:    '#0a1525',
  border: '#0f2034',
  text:   '#d0e8ff',
  text2:  '#5a8ab0',
  text3:  '#263d52',
  mono:   "'JetBrains Mono', monospace",
  sans:   "'DM Sans', sans-serif",
  disp:   "'Syne', sans-serif",
} as const;

const SEV = [
  { key: 'critical' as const, label: 'Critical', color: '#f0263e' },
  { key: 'high'     as const, label: 'High',     color: '#f07020' },
  { key: 'medium'   as const, label: 'Medium',   color: '#f0c800' },
  { key: 'low'      as const, label: 'Low',       color: '#00cc66' },
];

// ── Custom label on pie ──────────────────────────────────────────────────────

const renderLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number; percent: number;
}) => {
  if (percent < 0.06) return null; // skip tiny slices
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 500 }}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
};

// ── Component ────────────────────────────────────────────────────────────────

const AlertDistributionChart: React.FC<Props> = ({ summary }) => {

  // Hard guard — null/undefined while first API fetch is in-flight
  if (!summary) {
    return (
      <Card className="animate-fade-in">
        <SectionHeader
          title="Alert Distribution"
          accent="03"
          subtitle="severity breakdown"
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 180,
            fontFamily: T.mono,
            fontSize: 12,
            color: T.text3,
            letterSpacing: 2,
          }}
        >
          Loading…
        </div>
      </Card>
    );
  }

  const total = summary.total ?? 0;

  // Only non-zero slices — recharts arc math breaks on zero-value entries
  const pieData = SEV
    .map(s => ({ ...s, value: summary[s.key] ?? 0 }))
    .filter(d => d.value > 0);

  return (
    <Card className="animate-fade-in">
      <SectionHeader
        title="Alert Distribution"
        accent="03"
        subtitle="severity breakdown"
      />

      {total === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 180,
            gap: 12,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              border: `1px solid ${T.border}`,
              background: T.bg3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: T.mono,
              fontSize: 18,
              color: T.text3,
            }}
          >
            ∅
          </div>
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 11,
              color: T.text3,
              letterSpacing: 1.5,
            }}
          >
            No alerts recorded yet
          </span>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          {/* ── Donut chart ── */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <ResponsiveContainer width={156} height={156}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={66}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#060e1a"
                  labelLine={false}
                  label={renderLabel}
                  isAnimationActive={false}
                >
                  {pieData.map((entry, idx) => (
                    <Cell
                      key={`${entry.key}-${idx}`}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Centre label — total count */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  fontFamily: T.disp,
                  fontWeight: 800,
                  fontSize: 26,
                  color: T.text,
                  lineHeight: 1,
                }}
              >
                {total}
              </span>
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 8,
                  color: T.text3,
                  letterSpacing: 2.5,
                  textTransform: 'uppercase',
                  marginTop: 3,
                }}
              >
                TOTAL
              </span>
            </div>
          </div>

          {/* ── Legend + bars ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {SEV.map(({ key, label, color }) => {
              const value = summary[key] ?? 0;
              const pct   = total > 0 ? (value / total) * 100 : 0;

              return (
                <div key={key} style={{ marginBottom: 10 }}>
                  {/* Label row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          background: color,
                          flexShrink: 0,
                          boxShadow: `0 0 5px ${color}66`,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: T.mono,
                          fontSize: 11,
                          color: T.text2,
                          letterSpacing: 0.5,
                        }}
                      >
                        {label}
                      </span>
                    </div>

                    {/* Count + pct */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: T.disp,
                          fontSize: 16,
                          fontWeight: 700,
                          color: value > 0 ? color : T.text3,
                          lineHeight: 1,
                        }}
                      >
                        {value}
                      </span>
                      <span
                        style={{
                          fontFamily: T.mono,
                          fontSize: 9,
                          color: T.text3,
                          minWidth: 32,
                          textAlign: 'right',
                        }}
                      >
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: 3,
                      background: T.border,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${color}88, ${color})`,
                        transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Summary data has no unacknowledged field; callout intentionally removed */}
          </div>
        </div>
      )}
    </Card>
  );
};

export default AlertDistributionChart;