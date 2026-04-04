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
import { CHART } from '../../constants/chartColors';
import { Card, SectionHeader } from '../common';
import DarkTooltip from '../ui/DarkTooltip';

interface Props {
  data: TimeSeriesPoint[];
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const T = {
  border: '#e2e8f0',
  border2: CHART.slate300,
  text2:  '#475569',
  text3:  '#94a3b8',
  red:    CHART.red600,
  orange: CHART.orange500,
  yellow: CHART.amber500,
  low:    CHART.emerald500,
  green:  CHART.emerald500,
  mono:   'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  disp:   'Inter, system-ui, sans-serif',
} as const;

// ── Shared chart config ───────────────────────────────────────────────────────

const AXIS_TICK = {
  fill: T.text2,
  fontSize: 13,
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
  width: 44,
};

const X_AXIS_PROPS = {
  tick: AXIS_TICK,
  axisLine: false as const,
  tickLine: false as const,
  interval: 'preserveStartEnd' as const,
};

// ── Severity palette ──────────────────────────────────────────────────────────

const SEV_COLORS: Record<string, string> = {
  critical: CHART.red400,
  high:     CHART.orange500,
  medium:   CHART.amber400,
  low:      CHART.emerald500,
};

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyChart: React.FC<{ height?: number }> = ({ height = 220 }) => (
  <div
    className="flex items-center justify-center text-sm text-slate-500"
    style={{ height, fontFamily: T.mono }}
  >
    No data found
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
              fontSize: 12,
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
              fill={CHART.slate400}
              stroke={CHART.slate300}
              strokeWidth={0.5}
              opacity={0.85}
              isAnimationActive={false}
            />

            <Bar
              dataKey="signals"
              name="Signals"
              fill={CHART.blue500}
              opacity={0.9}
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
                    fontSize: 11,
                    color: T.text3,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    marginRight: 8,
                  }}
                >
                  Latest window
                </span>
                <span
                  style={{
                    fontFamily: T.disp,
                    fontSize: 16,
                    fontWeight: 700,
                    color: T.text2,
                  }}
                >
                  {total.toLocaleString()} posts
                </span>
              </div>
              <div
                className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1"
              >
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: 11,
                    color: T.text3,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  SNR
                </span>
                <span
                  className="text-lg font-bold text-emerald-600"
                  style={{ fontFamily: T.disp }}
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