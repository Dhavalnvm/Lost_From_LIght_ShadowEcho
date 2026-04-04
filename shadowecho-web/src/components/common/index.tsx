// src/components/common/index.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Production SOC component library — Splunk/Palo Alto inspired
// Larger fonts, sharper hierarchy, no rounded corners, dense data feel
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';

// ─── Design tokens ─────────────────────────────────────────────────────────

const T = {
  bg:      '#ffffff',
  bg2:     '#f8f9fa',
  bg3:     '#f1f3f5',
  bg4:     '#e9ecef',
  border:  '#dee2e6',
  border2: '#ced4da',
  border3: '#adb5bd',
  cyan:    '#2563eb',
  green:   '#16a34a',
  red:     '#dc2626',
  orange:  '#ea580c',
  yellow:  '#ca8a04',
  purple:  '#7c3aed',
  text:    '#111827',
  text2:   '#6b7280',
  text3:   '#9ca3af',
} as const;

const F = {
  display: 'Inter, system-ui, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  sans: 'Inter, system-ui, sans-serif',
} as const;

// ─── Card ─────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'red' | 'amber' | 'green' | 'none';
  style?: React.CSSProperties;
}

const GLOW_STYLES: Record<string, React.CSSProperties> = {
  cyan:  { boxShadow: '0 0 24px rgba(37,99,235,0.07), inset 0 0 0 1px rgba(37,99,235,0.15)' },
  red:   { boxShadow: '0 0 24px rgba(240,38,62,0.07), inset 0 0 0 1px rgba(240,38,62,0.15)' },
  amber: { boxShadow: '0 0 24px rgba(240,112,32,0.07), inset 0 0 0 1px rgba(240,112,32,0.15)' },
  green: { boxShadow: '0 0 24px rgba(22,163,74,0.07), inset 0 0 0 1px rgba(22,163,74,0.15)' },
  none:  { border: `1px solid ${T.border}` },
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glow = 'none',
  style = {},
}) => (
  <div
    className={`panel-top relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    style={{
      ...GLOW_STYLES[glow],
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  accent?: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  accent,
  action,
}) => (
  <div className="mb-4 flex items-start justify-between gap-3">
    <div>
      <div className="flex items-center gap-2.5">
        {accent && (
          <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-xs font-medium tracking-wider text-blue-700">
            {accent}
          </span>
        )}
        <h2 className="text-base font-semibold uppercase tracking-wide text-slate-800">{title}</h2>
      </div>
      {subtitle && (
        <p className="mt-1.5 font-mono text-sm tracking-wide text-slate-500">{subtitle}</p>
      )}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ─── Severity Badge ───────────────────────────────────────────────────────

interface BadgeProps {
  severity: string;
  className?: string;
  style?: React.CSSProperties;
}

const SEV_CLASS: Record<string, string> = {
  critical: 'border-red-200 bg-red-50 text-red-700',
  high: 'border-orange-200 bg-orange-50 text-orange-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-green-200 bg-green-50 text-green-700',
};

const SEV_DOT: Record<string, string> = {
  critical: 'bg-red-600',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-green-500',
};

export const SeverityBadge: React.FC<BadgeProps> = ({ severity, className = '', style = {} }) => {
  const key = severity.toLowerCase();
  const box = SEV_CLASS[key] ?? SEV_CLASS.low;
  const dot = SEV_DOT[key] ?? SEV_DOT.low;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-wider ${box} ${className}`}
      style={style}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {severity}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  color?: 'cyan' | 'red' | 'amber' | 'green' | 'muted';
  accent?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const COLOR_MAP: Record<string, string> = {
  cyan:  '#2563eb',
  red:   '#dc2626',
  amber: '#ea580c',
  green: '#16a34a',
  muted: '#6b7280',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  color = 'cyan',
  accent,
  trend,
  trendValue,
}) => {
  const col = COLOR_MAP[color];
  const trendColor = trend === 'up' ? T.red : trend === 'down' ? T.green : T.text2;

  return (
    <div
      className="panel-top"
      style={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%)',
        border: `1px solid ${T.border}`,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Bottom glow accent */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${col}88, transparent)`,
        }}
      />

      {/* Label */}
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 9,
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: T.text3,
          marginBottom: 10,
        }}
      >
        {label}
      </div>

      {/* Value row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 6 }}>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 38,
            fontWeight: 900,
            color: col,
            lineHeight: 1,
            textShadow: `0 0 24px ${col}44`,
          }}
        >
          {value ?? '—'}
        </div>

        {trend && trendValue && (
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: trendColor,
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            {trendValue}
          </div>
        )}
      </div>

      {/* Sub + accent row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {sub && (
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 10,
              color: T.text3,
              letterSpacing: 0.5,
            }}
          >
            {sub}
          </div>
        )}
        {accent && (
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 9,
              color: col,
              padding: '2px 6px',
              border: `1px solid ${col}33`,
              background: `${col}0d`,
              letterSpacing: 1,
            }}
          >
            {accent}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Stat Pill (topbar variant) ───────────────────────────────────────────

interface StatPillProps {
  label: string;
  value: number | string;
  color?: 'cyan' | 'red' | 'amber' | 'green' | 'muted';
}

export const StatPill: React.FC<StatPillProps> = ({ label, value, color = 'cyan' }) => {
  const col = COLOR_MAP[color];
  return (
    <div style={{ textAlign: 'right' }}>
      <div
        style={{
          fontFamily: F.display,
          fontSize: 22,
          fontWeight: 700,
          color: col,
          lineHeight: 1,
          textShadow: `0 0 16px ${col}44`,
        }}
      >
        {value ?? '—'}
      </div>
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 8,
          color: T.text3,
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
};

// ─── Loading Spinner ──────────────────────────────────────────────────────

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dims: Record<string, number> = { sm: 18, md: 28, lg: 40 };
  const d = dims[size];
  const bw = size === 'sm' ? 1.5 : 2;
  return (
    <div
      className="shrink-0 animate-spin rounded-full border-solid border-slate-200 border-t-blue-600"
      style={{ width: d, height: d, borderWidth: bw }}
    />
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────

export const EmptyState: React.FC<{ message: string; icon?: string }> = ({
  message,
  icon = '∅',
}) => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
      <span className="font-mono text-xl text-slate-400">{icon}</span>
    </div>
    <p className="max-w-md font-mono text-sm leading-relaxed tracking-wide text-slate-600">{message}</p>
  </div>
);

// ─── Error Banner ─────────────────────────────────────────────────────────

export const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div className="mb-4 flex items-center gap-3 border border-red-200 bg-red-50 px-4 py-3">
    <span className="font-mono text-sm font-bold tracking-wider text-red-700">ERR</span>
    <span className="font-mono text-sm leading-relaxed text-slate-700">{message}</span>
  </div>
);

// ─── Live Indicator ───────────────────────────────────────────────────────

export const LiveIndicator: React.FC<{ updatedAt: Date | null }> = ({ updatedAt }) => (
  <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-1.5">
    <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-green-600 shadow-[0_0_6px_rgba(22,163,74,0.6)]" />
    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-green-700">LIVE</span>
    {updatedAt && (
      <span className="font-mono text-sm text-slate-600">· {updatedAt.toLocaleTimeString()}</span>
    )}
  </div>
);

// ─── Score Bar ────────────────────────────────────────────────────────────

interface ScoreBarProps {
  value: number;       // 0–100
  color?: string;
  showLabel?: boolean;
  height?: number;
}

export const ScoreBar: React.FC<ScoreBarProps> = ({
  value,
  color = T.cyan,
  showLabel = true,
  height = 3,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div
      style={{
        flex: 1,
        height,
        background: T.border,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
    {showLabel && (
      <span
        style={{
          fontFamily: F.mono,
          fontSize: 10,
          color: T.text2,
          minWidth: 32,
          textAlign: 'right',
        }}
      >
        {value}%
      </span>
    )}
  </div>
);

// ─── Confidence Ring ─────────────────────────────────────────────────────

export const ConfidenceRing: React.FC<{ pct: number; size?: number }> = ({
  pct,
  size = 64,
}) => {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const fill = (pct / 100) * circ;
  const col = pct > 75 ? T.red : pct > 50 ? T.orange : T.cyan;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={T.border2}
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={3}
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="butt"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <span
          style={{
            fontFamily: F.display,
            fontSize: size > 56 ? 13 : 10,
            fontWeight: 700,
            color: col,
            lineHeight: 1,
          }}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
};

// ─── Data Table ───────────────────────────────────────────────────────────

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  emptyMessage = 'No data',
}: DataTableProps<T>) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: F.mono,
          fontSize: 11,
        }}
      >
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={String(col.key)}
                style={{
                  padding: '8px 14px',
                  textAlign: col.align ?? 'left',
                  fontFamily: F.mono,
                  fontSize: 8,
                  fontWeight: 400,
                  letterSpacing: 2.5,
                  textTransform: 'uppercase',
                  color: T.text3,
                  borderBottom: `1px solid ${T.border2}`,
                  borderTop: `1px solid ${T.border}`,
                  background: T.bg3,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '32px 14px',
                  textAlign: 'center',
                  color: T.text3,
                  fontFamily: F.mono,
                  fontSize: 11,
                  letterSpacing: 1,
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr
                key={String(row[rowKey])}
                style={{ borderBottom: `1px solid ${T.border}` }}
                onMouseEnter={e =>
                  ((e.currentTarget as HTMLElement).style.background =
                    'rgba(37,99,235,0.018)')
                }
                onMouseLeave={e =>
                  ((e.currentTarget as HTMLElement).style.background = 'transparent')
                }
              >
                {columns.map(col => (
                  <td
                    key={String(col.key)}
                    style={{
                      padding: '10px 14px',
                      color: T.text,
                      textAlign: col.align ?? 'left',
                      verticalAlign: 'middle',
                    }}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key as string] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Panel (titled container) ─────────────────────────────────────────────

interface PanelProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
  noPadding?: boolean;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  action,
  children,
  style = {},
  noPadding = false,
}) => (
  <div
    className="panel-top"
    style={{
      background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%)',
      border: `1px solid ${T.border}`,
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}
  >
    {/* Header */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: `1px solid ${T.border}`,
        background: 'rgba(37,99,235,0.015)',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: F.sans,
          fontSize: 11,
          fontWeight: 500,
          color: T.text2,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </span>
      {action}
    </div>

    {/* Content */}
    <div style={noPadding ? {} : { padding: 16 }}>
      {children}
    </div>
  </div>
);

// ─── Button ───────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'cyan' | 'green' | 'red' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const BTN_VARIANTS: Record<string, { bg: string; border: string; color: string; hoverBg: string }> = {
  cyan:  { bg: 'rgba(37,99,235,0.07)',  border: '#2563eb', color: '#2563eb', hoverBg: 'rgba(37,99,235,0.14)' },
  green: { bg: 'rgba(22,163,74,0.07)',  border: '#16a34a', color: '#16a34a', hoverBg: 'rgba(22,163,74,0.14)' },
  red:   { bg: 'rgba(240,38,62,0.07)',  border: '#dc2626', color: '#dc2626', hoverBg: 'rgba(240,38,62,0.14)' },
  ghost: { bg: 'transparent',           border: T.border2, color: T.text2,   hoverBg: 'rgba(0,0,0,0.03)' },
};

const BTN_SIZES: Record<string, { padding: string; fontSize: number }> = {
  sm: { padding: '5px 10px', fontSize: 9 },
  md: { padding: '8px 16px', fontSize: 10 },
  lg: { padding: '11px 22px', fontSize: 11 },
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  loading = false,
  disabled,
  style = {},
  ...rest
}) => {
  const v = BTN_VARIANTS[variant];
  const s = BTN_SIZES[size];
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      style={{
        background: v.bg,
        border: `1px solid ${v.border}`,
        color: v.color,
        padding: s.padding,
        fontFamily: F.mono,
        fontSize: s.fontSize,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.35 : 1,
        transition: 'background 0.14s, box-shadow 0.14s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseEnter={e => {
        if (!isDisabled)
          (e.currentTarget as HTMLElement).style.background = v.hoverBg;
      }}
      onMouseLeave={e => {
        if (!isDisabled)
          (e.currentTarget as HTMLElement).style.background = v.bg;
      }}
    >
      {loading && (
        <div
          style={{
            width: 10,
            height: 10,
            border: `1.5px solid ${v.border}44`,
            borderTopColor: v.color,
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  );
};

// ─── Input / Textarea / Select ────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, style = {}, ...rest }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    {label && (
      <label
        style={{
          fontFamily: F.mono,
          fontSize: 9,
          color: T.text3,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>
    )}
    <input
      className="se-input"
      style={{ fontSize: 12, ...style }}
      {...rest}
    />
  </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, style = {}, ...rest }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    {label && (
      <label
        style={{
          fontFamily: F.mono,
          fontSize: 9,
          color: T.text3,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>
    )}
    <textarea
      className="se-ta"
      style={{ fontSize: 12, ...style }}
      {...rest}
    />
  </div>
);