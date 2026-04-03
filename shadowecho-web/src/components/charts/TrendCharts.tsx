// src/components/charts/TrendCharts.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Production SOC trend charts — Splunk/Palo Alto inspired
// Larger axis labels, bigger legend text, heavier value emphasis
//
// Fixed:
//   - Both charts guard data.length < 2 (recharts crashes on 0–1 points)
//   - AreaChart only plots severity keys (critical/high/medium/low)
//   - BarChart only plots total_posts + signals
//   - NaN guard on formatter
//   - isAnimationActive={false} prevents flicker on fast refresh
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import type { TimeSeriesPoint } from '../../types/api';
import { Card, SectionHeader } from '../common';
import DarkTooltip from '../ui/DarkTooltip';

interface Props {
  data: TimeSeriesPoint[];
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const T = {
  bg3:    '#0a1525',
  border: '#0f2034',
  border2:'#162d47',
  text2:  '#5a8ab0',
  text3:  '#263d52',
  red:    '#f0263e',
  orange: '#f07020',
  yellow: '#f0c800',
  low:    '#4a5568',
  green:  '#00e87a',
  mono:   "'JetBrains Mono', monospace",
  disp:   "'Syne', sans-serif",
} as const;

// ── Shared chart config ───────────────────────────────────────────────────────

const AXIS_TICK = {
  fill: T.text2,
  fontSize: 11,
  fontFamily: T.mono,
};

const GRID_PROPS = {
  strokeDasharray: '3 3' as const,
  stroke: T.border2,
  vertical: false as const,
};

const Y_AXIS_PROPS = {
  tick: AXIS_TICK,
  axisLine: false as const,
  tickLine: false as const,
  allowDecimals: false as const,
  width: 32,
};

const X_AXIS_PROPS = {
  tick: AXIS_TICK,
  axisLine: false as const,
  tickLine: false as const,
  interval: 'preserveStartEnd' as const,
};

// ── Severity palette ──────────────────────────────────────────────────────────

const SEV_COLORS: Record<string, string> = {
  critical: T.red,
  high:     T.orange,
  medium:   T.yellow,
  low:      T.low,
};

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyChart: React.FC<{ height?: number }> = ({ height = 220 }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height,
      fontFamily: T.mono,
      fontSize: 12,
      color: T.text3,
      letterSpacing: 2,
    }}
  >
    Collecting data points…
  </div>
);

// ── Custom Legend ─────────────────────────────────────────────────────────────

interface LegendPayload {
  value: string;
  color: string;
  dataKey?: string;
}

const CustomLegend: React.FC<{ payload?: LegendPayload[] }> = ({ payload }) => {
  if (!payload?.length) return null;
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        justifyContent: 'center',
        paddingTop: 10,
        flexWrap: 'wrap',
      }}
    >
      {payload.map((entry, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              background: entry.color,
              boxShadow: `0 0 4px ${entry.color}66`,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              color: T.text2,
              letterSpacing: 0.5,
            }}
          >
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Alert Severity Trend (stacked area) ────────────────────────────────────

export const AlertTrendChart: React.FC<Props> = ({ data }) => (
  <Card className="animate-fade-in">
    <SectionHeader
      title="Alert Severity Trend"
      accent="01"
      subtitle="real-time · rolling window"
    />

    {data.length < 2 ? (
      <EmptyChart />
    ) : (
      <div style={{ marginLeft: -4 }}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              {(['critical', 'high', 'medium', 'low'] as const).map(key => (
                <linearGradient key={key} id={`se-grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={SEV_COLORS[key]} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={SEV_COLORS[key]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid {...GRID_PROPS} />

            <XAxis
              dataKey="time"
              {...X_AXIS_PROPS}
            />
            <YAxis {...Y_AXIS_PROPS} />

            <Tooltip content={<DarkTooltip />} />

            {/* Legend using custom renderer */}
            <Legend content={<CustomLegend />} />

            {(['critical', 'high', 'medium', 'low'] as const).map(key => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={key.charAt(0).toUpperCase() + key.slice(1)}
                stroke={SEV_COLORS[key]}
                fill={`url(#se-grad-${key})`}
                strokeWidth={1.8}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </Card>
);

// ─── Signal Detection Rate (grouped bar) ────────────────────────────────────

export const SignalTrendChart: React.FC<Props> = ({ data }) => (
  <Card className="animate-fade-in">
    <SectionHeader
      title="Signal Detection Rate"
      accent="02"
      subtitle="posts ingested vs signals identified"
    />

    {data.length < 2 ? (
      <EmptyChart />
    ) : (
      <div style={{ marginLeft: -4 }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            barCategoryGap="30%"
            barGap={2}
          >
            <CartesianGrid {...GRID_PROPS} />

            <XAxis
              dataKey="time"
              {...X_AXIS_PROPS}
            />
            <YAxis {...Y_AXIS_PROPS} />

            <Tooltip content={<DarkTooltip />} />

            <Legend content={<CustomLegend />} />

            {/* Total posts — dark fill, acts as background bar */}
            <Bar
              dataKey="total_posts"
              name="Total Posts"
              fill="rgba(26,52,80,0.9)"
              stroke={T.border2}
              strokeWidth={0.5}
              isAnimationActive={false}
            />

            {/* Signals — bright green, overlaid */}
            <Bar
              dataKey="signals"
              name="Signals"
              fill={T.green}
              opacity={0.85}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Live SNR readout — computed from last data point */}
        {(() => {
          const last = data[data.length - 1];
          if (!last) return null;
          const total = last.total_posts ?? 0;
          const sigs  = last.signals ?? 0;
          const rate  = total > 0 ? ((sigs / total) * 100).toFixed(1) : '—';

          return (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 16,
                marginTop: 10,
                paddingTop: 10,
                borderTop: `1px solid ${T.border}`,
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: 9,
                    color: T.text3,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    marginRight: 8,
                  }}
                >
                  Latest window
                </span>
                <span
                  style={{
                    fontFamily: T.disp,
                    fontSize: 14,
                    fontWeight: 700,
                    color: T.text2,
                  }}
                >
                  {total.toLocaleString()} posts
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 10px',
                  background: 'rgba(0,232,122,0.07)',
                  border: `1px solid rgba(0,232,122,0.2)`,
                }}
              >
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: 9,
                    color: T.text3,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                  }}
                >
                  SNR
                </span>
                <span
                  style={{
                    fontFamily: T.disp,
                    fontSize: 16,
                    fontWeight: 800,
                    color: T.green,
                  }}
                >
                  {rate}%
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    )}
  </Card>
);