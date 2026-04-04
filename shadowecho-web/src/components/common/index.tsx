import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`} style={style}>
    {children}
  </div>
);

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
  <div className="mb-5 flex items-start justify-between gap-4">
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        {accent ? (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">
            {accent}
          </span>
        ) : null}
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export const SeverityBadge: React.FC<{ severity: string; className?: string }> = ({
  severity,
  className = '',
}) => {
  const tone =
    severity.toLowerCase() === 'critical'
      ? 'bg-red-50 text-red-700'
      : severity.toLowerCase() === 'high'
        ? 'bg-orange-50 text-orange-700'
        : severity.toLowerCase() === 'medium'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-green-50 text-green-700';

  const dot =
    severity.toLowerCase() === 'critical'
      ? 'bg-red-600'
      : severity.toLowerCase() === 'high'
        ? 'bg-orange-500'
        : severity.toLowerCase() === 'medium'
          ? 'bg-amber-500'
          : 'bg-green-500';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${tone} ${className}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {severity}
    </span>
  );
};

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  accent = 'text-blue-600',
  trend,
  trendValue,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <div className={`mt-3 text-3xl font-bold tracking-tight ${accent}`}>{value}</div>
      </div>
      {trend && trendValue ? (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            trend === 'up'
              ? 'bg-green-50 text-green-700'
              : trend === 'down'
                ? 'bg-red-50 text-red-700'
                : 'bg-slate-100 text-slate-600'
          }`}
        >
          {trend === 'up' ? 'Up' : trend === 'down' ? 'Down' : 'Flat'} {trendValue}
        </span>
      ) : null}
    </div>
    {sub ? <p className="mt-2 text-sm text-slate-500">{sub}</p> : null}
  </div>
);

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dimension = size === 'sm' ? 'h-4 w-4 border-2' : size === 'lg' ? 'h-9 w-9 border-[3px]' : 'h-6 w-6 border-2';
  return <div className={`${dimension} animate-spin rounded-full border-slate-200 border-t-blue-600`} />;
};

export const EmptyState: React.FC<{ message: string; icon?: string }> = ({ message, icon = '•' }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-semibold text-slate-400 shadow-sm">
      {icon}
    </div>
    <p className="mt-4 max-w-md text-sm text-slate-500">{message}</p>
  </div>
);

export const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {message}
  </div>
);

export const LiveIndicator: React.FC<{ updatedAt: Date | null }> = ({ updatedAt }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
    <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
    Live
    {updatedAt ? <span className="text-green-600/80">{updatedAt.toLocaleTimeString()}</span> : null}
  </div>
);

export const ScoreBar: React.FC<{ value: number; color?: string; showLabel?: boolean; height?: number }> = ({
  value,
  color = '#3b82f6',
  showLabel = true,
  height = 8,
}) => (
  <div className="flex items-center gap-3">
    <div className="flex-1 overflow-hidden rounded-full bg-slate-100" style={{ height }}>
      <div
        className="rounded-full transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, height, backgroundColor: color }}
      />
    </div>
    {showLabel ? <span className="min-w-10 text-right text-xs font-medium text-slate-600">{value}%</span> : null}
  </div>
);

export const ConfidenceRing: React.FC<{ pct: number; size?: number }> = ({ pct, size = 64 }) => {
  const normalized = Math.max(0, Math.min(100, pct));
  const radius = size / 2 - 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;
  const stroke = normalized >= 75 ? '#dc2626' : normalized >= 50 ? '#f59e0b' : '#2563eb';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-700">
        {normalized}%
      </div>
    </div>
  );
};

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
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={String(row[rowKey])} className="hover:bg-slate-50">
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-4 py-3 text-slate-700 ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
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

interface PanelProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
  noPadding?: boolean;
}

export const Panel: React.FC<PanelProps> = ({ title, action, children, style, noPadding = false }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" style={style}>
    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
      <span className="text-sm font-semibold text-slate-800">{title}</span>
      {action}
    </div>
    <div className={noPadding ? '' : 'p-5'}>{children}</div>
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'cyan' | 'green' | 'red' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...rest
}) => {
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-5 py-3 text-sm' : 'px-4 py-2 text-sm';
  const variantClass =
    variant === 'green'
      ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
      : variant === 'red'
        ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
        : variant === 'ghost'
          ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100';

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass} ${variantClass} ${className}`}
    >
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({
  label,
  className = '',
  ...rest
}) => (
  <div className="space-y-1.5">
    {label ? <label className="text-xs font-medium text-slate-600">{label}</label> : null}
    <input
      {...rest}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 ${className}`}
    />
  </div>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({
  label,
  className = '',
  ...rest
}) => (
  <div className="space-y-1.5">
    {label ? <label className="text-xs font-medium text-slate-600">{label}</label> : null}
    <textarea
      {...rest}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 ${className}`}
    />
  </div>
);
