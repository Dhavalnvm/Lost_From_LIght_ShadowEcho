// src/components/common/index.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Production SOC component library — Splunk/Palo Alto inspired
// Larger fonts, sharper hierarchy, no rounded corners, dense data feel
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';

// ─── Design tokens ─────────────────────────────────────────────────────────

const T = {
  bg:      '#03070f',
  bg2:     '#060e1a',
  bg3:     '#0a1525',
  bg4:     '#0d1c30',
  border:  '#0f2034',
  border2: '#162d47',
  border3: '#1e3d5e',
  cyan:    '#00c8f0',
  green:   '#00e87a',
  red:     '#f0263e',
  orange:  '#f07020',
  yellow:  '#f0c800',
  purple:  '#9b6dff',
  text:    '#d0e8ff',
  text2:   '#5a8ab0',
  text3:   '#263d52',
} as const;

const F = {
  display: "'Syne', sans-serif",
  mono:    "'JetBrains Mono', monospace",
  sans:    "'DM Sans', sans-serif",
} as const;

// ─── Card ─────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'red' | 'amber' | 'green' | 'none';
  style?: React.CSSProperties;
}

const GLOW_STYLES: Record<string, React.CSSProperties> = {
  cyan:  { boxShadow: '0 0 24px rgba(0,200,240,0.07), inset 0 0 0 1px rgba(0,200,240,0.15)' },
  red:   { boxShadow: '0 0 24px rgba(240,38,62,0.07), inset 0 0 0 1px rgba(240,38,62,0.15)' },
  amber: { boxShadow: '0 0 24px rgba(240,112,32,0.07), inset 0 0 0 1px rgba(240,112,32,0.15)' },
  green: { boxShadow: '0 0 24px rgba(0,232,122,0.07), inset 0 0 0 1px rgba(0,232,122,0.15)' },
  none:  { border: `1px solid ${T.border}` },
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glow = 'none',
  style = {},
}) => (
  <div
    className={`panel-top ${className}`}
    style={{
      background: 'linear-gradient(135deg, #060e1a 0%, #0a1525 100%)',
      border: `1px solid ${T.border}`,
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
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
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 16,
    }}
  >
    <div>
      {/* Accent + title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {accent && (
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 9,
              color: T.cyan,
              letterSpacing: 2,
              padding: '1px 5px',
              border: `1px solid rgba(0,200,240,0.25)`,
              background: 'rgba(0,200,240,0.06)',
            }}
          >
            {accent}
          </span>
        )}
        <h2
          style={{
            fontFamily: F.sans,
            fontSize: 13,
            fontWeight: 500,
            color: T.text2,
            letterSpacing: 0.3,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h2>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p
          style={{
            fontFamily: F.mono,
            fontSize: 10,
            color: T.text3,
            marginTop: 3,
            letterSpacing: 1,
          }}
        >
          {subtitle}
        </p>
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

const SEV_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  critical: { bg: 'rgba(240,38,62,0.12)',  color: '#f0263e', border: 'rgba(240,38,62,0.35)' },
  high:     { bg: 'rgba(240,112,32,0.12)', color: '#f07020', border: 'rgba(240,112,32,0.35)' },
  medium:   { bg: 'rgba(240,200,0,0.10)',  color: '#f0c800', border: 'rgba(240,200,0,0.30)' },
  low:      { bg: 'rgba(0,204,102,0.10)',  color: '#00cc66', border: 'rgba(0,204,102,0.30)' },
};

export const SeverityBadge: React.FC<BadgeProps> = ({ severity, style = {} }) => {
  const s = SEV_STYLES[severity.toLowerCase()] ?? SEV_STYLES.low;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 8px',
        fontFamily: F.mono,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: 2,
        textTransform: 'uppercase',
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        ...style,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: s.color,
          flexShrink: 0,
        }}
      />
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
  cyan:  '#00c8f0',
  red:   '#f0263e',
  amber: '#f07020',
  green: '#00e87a',
  muted: '#5a8ab0',
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
        background: 'linear-gradient(135deg, #060e1a 0%, #0a1525 100%)',
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
  const dims: Record<string, number> = { sm: 16, md: 24, lg: 36 };
  const d = dims[size];
  return (
    <div
      style={{
        width: d,
        height: d,
        border: `${size === 'sm' ? 1.5 : 2}px solid ${T.border2}`,
        borderTopColor: T.cyan,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    />
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────

export const EmptyState: React.FC<{ message: string; icon?: string }> = ({
  message,
  icon = '∅',
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        border: `1px solid ${T.border2}`,
        background: T.bg3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
      }}
    >
      <span
        style={{
          fontFamily: F.mono,
          fontSize: 20,
          color: T.text3,
        }}
      >
        {icon}
      </span>
    </div>
    <p
      style={{
        fontFamily: F.mono,
        fontSize: 12,
        color: T.text3,
        letterSpacing: 1,
      }}
    >
      {message}
    </p>
  </div>
);

// ─── Error Banner ─────────────────────────────────────────────────────────

export const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: 'rgba(240,38,62,0.08)',
      border: `1px solid rgba(240,38,62,0.25)`,
      padding: '12px 16px',
      marginBottom: 16,
    }}
  >
    <span
      style={{
        fontFamily: F.mono,
        fontSize: 11,
        fontWeight: 700,
        color: T.red,
        letterSpacing: 2,
      }}
    >
      ERR
    </span>
    <span
      style={{
        fontFamily: F.mono,
        fontSize: 12,
        color: T.text2,
      }}
    >
      {message}
    </span>
  </div>
);

// ─── Live Indicator ───────────────────────────────────────────────────────

export const LiveIndicator: React.FC<{ updatedAt: Date | null }> = ({ updatedAt }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      border: `1px solid rgba(0,232,122,0.25)`,
      background: 'rgba(0,232,122,0.06)',
      padding: '4px 10px',
    }}
  >
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: T.green,
        boxShadow: `0 0 6px ${T.green}`,
        animation: 'pulse 2s ease-in-out infinite',
        flexShrink: 0,
      }}
    />
    <span
      style={{
        fontFamily: F.mono,
        fontSize: 9,
        color: T.green,
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}
    >
      LIVE
    </span>
    {updatedAt && (
      <span
        style={{
          fontFamily: F.mono,
          fontSize: 10,
          color: T.text2,
        }}
      >
        · {updatedAt.toLocaleTimeString()}
      </span>
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
                    'rgba(0,200,240,0.018)')
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
      background: 'linear-gradient(135deg, #060e1a 0%, #0a1525 100%)',
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
        background: 'rgba(0,200,240,0.015)',
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
  cyan:  { bg: 'rgba(0,200,240,0.07)',  border: '#00c8f0', color: '#00c8f0', hoverBg: 'rgba(0,200,240,0.14)' },
  green: { bg: 'rgba(0,232,122,0.07)',  border: '#00e87a', color: '#00e87a', hoverBg: 'rgba(0,232,122,0.14)' },
  red:   { bg: 'rgba(240,38,62,0.07)',  border: '#f0263e', color: '#f0263e', hoverBg: 'rgba(240,38,62,0.14)' },
  ghost: { bg: 'transparent',           border: T.border2, color: T.text2,   hoverBg: 'rgba(255,255,255,0.03)' },
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