import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  Cpu,
  HardDrive,
  Network,
  Shield,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ErrorBanner, LiveIndicator, Spinner } from '../components/common';
import { useMonitoringData } from '../hooks/useMonitoringData';
import type { Alert, SignalPost } from '../types/api';

type Tone = 'blue' | 'red' | 'amber' | 'green';

const toneMap: Record<Tone, { icon: string; trendUp: string; bar: string }> = {
  blue: { icon: 'bg-blue-50 text-blue-700', trendUp: 'bg-blue-50 text-blue-700', bar: 'bg-blue-500' },
  red: { icon: 'bg-red-50 text-red-700', trendUp: 'bg-red-50 text-red-700', bar: 'bg-red-400' },
  amber: { icon: 'bg-amber-50 text-amber-700', trendUp: 'bg-amber-50 text-amber-700', bar: 'bg-amber-400' },
  green: { icon: 'bg-green-50 text-green-700', trendUp: 'bg-green-50 text-green-700', bar: 'bg-emerald-500' },
};

const severityPill: Record<string, string> = {
  critical: 'bg-red-50 text-red-700',
  high: 'bg-orange-50 text-orange-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-green-50 text-green-700',
};

const severityDot: Record<string, string> = {
  critical: 'bg-red-600',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-green-500',
};

const statusTone: Record<string, string> = {
  investigating: 'border-amber-200 bg-amber-50 text-amber-700',
  resolved: 'border-green-200 bg-green-50 text-green-700',
  new: 'border-blue-200 bg-blue-50 text-blue-700',
};

const chartLegendStyle = { paddingTop: '18px' };

const cardClass = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const heatmapPalette = ['bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-500'];

const formatSeverity = (severity?: string) =>
  severity ? `${severity.charAt(0).toUpperCase()}${severity.slice(1)}` : 'Low';

const inferStatus = (alert: Alert) => {
  if (alert.acknowledged) return 'resolved';
  if ((alert.confidence ?? 0) >= 0.8) return 'investigating';
  return 'new';
};

const initialsFromSource = (value?: string) =>
  (value ?? 'SE')
    .split(/[\s-_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SE';

const ChartTooltip: React.FC<{
  active?: boolean;
  label?: string;
  payload?: Array<{ name: string; value: number; color: string }>;
}> = ({ active, label, payload }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/70">
      <p className="mb-2 text-xs font-semibold text-slate-900">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatsCards: React.FC<{
  totalThreats: number;
  criticalAlerts: number;
  activeIncidents: number;
  systemHealth: number;
}> = ({ totalThreats, criticalAlerts, activeIncidents, systemHealth }) => {
  const cards = [
    {
      label: 'Total Threats',
      value: totalThreats.toLocaleString(),
      sub: 'Signals detected across ingested posts',
      trend: '+Live',
      positive: true,
      tone: 'blue' as Tone,
      icon: Shield,
    },
    {
      label: 'Critical Alerts',
      value: criticalAlerts.toLocaleString(),
      sub: 'Highest-priority analyst queue',
      trend: 'Review',
      positive: false,
      tone: 'red' as Tone,
      icon: AlertTriangle,
    },
    {
      label: 'Active Incidents',
      value: activeIncidents.toLocaleString(),
      sub: 'Unacknowledged events needing action',
      trend: 'Open',
      positive: false,
      tone: 'amber' as Tone,
      icon: BellRing,
    },
    {
      label: 'System Health',
      value: `${systemHealth}%`,
      sub: 'Derived from signal coverage and backlog pressure',
      trend: 'Stable',
      positive: true,
      tone: 'green' as Tone,
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, sub, trend, positive, tone, icon: Icon }) => (
        <div key={label} className={`${cardClass} p-6 transition-all hover:-translate-y-0.5 hover:shadow-md`}>
          <div className="flex items-start justify-between">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneMap[tone].icon}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${positive ? 'bg-green-50 text-green-700' : toneMap[tone].trendUp}`}>
              {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {trend}
            </span>
          </div>
          <div className="mt-6 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
          <p className="mt-2 text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-xs text-slate-400">{sub}</p>
        </div>
      ))}
    </section>
  );
};

const ThreatActivityChart: React.FC<{ data: Array<{ time: string; critical: number; high: number; medium: number }> }> = ({ data }) => (
  <section className={`${cardClass} p-6`}>
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-slate-900">Threat Activity</h2>
      <p className="mt-1 text-sm text-slate-500">Live severity volume captured during frontend polling.</p>
    </div>
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="criticalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.24} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="highFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.24} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="mediumFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.24} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="critical" name="Critical" stroke="#f87171" fill="url(#criticalFill)" strokeWidth={2} />
          <Area type="monotone" dataKey="high" name="High" stroke="#f59e0b" fill="url(#highFill)" strokeWidth={2} />
          <Area type="monotone" dataKey="medium" name="Medium" stroke="#60a5fa" fill="url(#mediumFill)" strokeWidth={2} />
          <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={chartLegendStyle} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </section>
);

const SourceVolumeChart: React.FC<{ data: Array<{ source: string; posts: number }> }> = ({ data }) => (
  <section className={`${cardClass} p-6`}>
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-slate-900">Source Activity</h2>
      <p className="mt-1 text-sm text-slate-500">Top live source volumes from `posts_by_source`.</p>
    </div>
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 32 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="source"
            angle={-28}
            textAnchor="end"
            interval={0}
            height={70}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="posts" name="Posts" radius={[8, 8, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.source} fill="#3b82f6" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </section>
);

const ExposureMixChart: React.FC<{
  data: Array<{ name: string; value: number; color: string }>;
}> = ({ data }) => (
  <section className={`${cardClass} p-6`}>
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-slate-900">Exposure Mix</h2>
      <p className="mt-1 text-sm text-slate-500">Post, credential, IOC, and alert totals from the live snapshot.</p>
    </div>
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" name="Count" radius={[0, 8, 8, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </section>
);

const SourceHeatmap: React.FC<{ data: Array<{ source: string; posts: number; intensity: number }> }> = ({ data }) => (
  <section className={`${cardClass} p-6`}>
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Source Heatmap</h2>
        <p className="mt-1 text-sm text-slate-500">Thermal-style source density from the current backend snapshot.</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Low</span>
        {heatmapPalette.map((tone) => (
          <span key={tone} className={`h-3 w-5 rounded ${tone}`} />
        ))}
        <span>High</span>
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {data.map((item) => (
        <div key={item.source} className={`rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:shadow-md ${heatmapPalette[item.intensity]}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{item.source}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Source volume</p>
            </div>
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {item.posts}
            </span>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const AlertsTable: React.FC<{ alerts: Alert[] }> = ({ alerts }) => {
  const [selectedId, setSelectedId] = useState<number | string | null>(null);

  useEffect(() => {
    if (!selectedId && alerts[0]) {
      setSelectedId(alerts[0].id);
    }
  }, [alerts, selectedId]);

  const selectedAlert = alerts.find((alert) => alert.id === selectedId) ?? alerts[0] ?? null;

  return (
    <section className="grid gap-6 xl:grid-cols-[1.7fr_0.95fr]">
      <div className={`${cardClass} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Alerts Table</h2>
            <p className="mt-1 text-sm text-slate-500">Recent backend alerts with selection and status context.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {alerts.length} alerts
          </span>
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-6 py-3 font-medium">Time</th>
                <th className="px-6 py-3 font-medium">Severity</th>
                <th className="px-6 py-3 font-medium">Source</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => {
                const severity = alert.severity?.toLowerCase() ?? 'low';
                const status = inferStatus(alert);
                return (
                  <tr
                    key={String(alert.id)}
                    onClick={() => setSelectedId(alert.id)}
                    className={`cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 ${
                      selectedId === alert.id ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <td className="px-6 py-4 text-slate-700">
                      {alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${severityPill[severity] ?? severityPill.low}`}>
                        <span className={`h-2 w-2 rounded-full ${severityDot[severity] ?? severityDot.low}`} />
                        {formatSeverity(severity)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium capitalize text-slate-700">{alert.alert_type || 'threat'}</td>
                    <td className="px-6 py-4 text-slate-600">{alert.title || alert.summary || 'Untitled alert'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[status]}`}>
                        {formatSeverity(status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <aside className={`${cardClass} p-6`}>
        <h3 className="text-lg font-semibold text-slate-900">Alert Details</h3>
        <p className="mt-1 text-sm text-slate-500">Focused context for the selected alert row.</p>
        {selectedAlert ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${severityPill[selectedAlert.severity] ?? severityPill.low}`}>
                <span className={`h-2 w-2 rounded-full ${severityDot[selectedAlert.severity] ?? severityDot.low}`} />
                {formatSeverity(selectedAlert.severity)}
              </span>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[inferStatus(selectedAlert)]}`}>
                {formatSeverity(inferStatus(selectedAlert))}
              </span>
            </div>
            <h4 className="mt-4 text-base font-semibold text-slate-900">{selectedAlert.title || 'Untitled alert'}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">{selectedAlert.summary || 'No summary provided.'}</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Confidence</span>
                <span className="font-medium text-slate-900">{((selectedAlert.confidence ?? 0) * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Alert Type</span>
                <span className="font-medium text-slate-900">{selectedAlert.alert_type || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Created</span>
                <span className="font-medium text-slate-900">
                  {selectedAlert.created_at ? new Date(selectedAlert.created_at).toLocaleString() : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No alerts available yet.
          </div>
        )}
      </aside>
    </section>
  );
};

const RecentIncidentsPanel: React.FC<{ alerts: Alert[] }> = ({ alerts }) => (
  <section className={`${cardClass} p-6`}>
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-slate-900">Recent Incidents</h2>
      <p className="mt-1 text-sm text-slate-500">Recent live alerts grouped as analyst-ready incident cards.</p>
    </div>
    <div className="space-y-3">
      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          No incidents available from the backend feed.
        </div>
      ) : (
        alerts.slice(0, 4).map((alert) => {
          const severity = alert.severity?.toLowerCase() ?? 'low';
          const status = inferStatus(alert);
          return (
            <div key={String(alert.id)} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{alert.title || alert.summary || 'Untitled alert'}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {alert.created_at ? new Date(alert.created_at).toLocaleString() : 'No timestamp'}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                  {initialsFromSource(alert.alert_type)}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`inline-flex items-center gap-2 text-sm font-medium ${status === 'investigating' ? 'text-amber-600' : status === 'new' ? 'text-blue-600' : 'text-green-600'}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${status === 'investigating' ? 'animate-pulse bg-amber-500' : status === 'new' ? 'bg-blue-500' : 'bg-green-500'}`} />
                  {formatSeverity(status)}
                </span>
                <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${severityPill[severity] ?? severityPill.low}`}>
                  <span className={`h-2 w-2 rounded-full ${severityDot[severity] ?? severityDot.low}`} />
                  {formatSeverity(severity)}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  </section>
);

const SystemStatusWidget: React.FC<{
  cpu: number;
  memory: number;
  network: number;
}> = ({ cpu, memory, network }) => {
  const [animatedValues, setAnimatedValues] = useState([0, 0, 0]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setAnimatedValues([cpu, memory, network]), 120);
    return () => window.clearTimeout(timeout);
  }, [cpu, memory, network]);

  const metrics = [
    { label: 'CPU Usage', value: animatedValues[0], tone: 'blue' as Tone, icon: Cpu },
    { label: 'Memory', value: animatedValues[1], tone: 'amber' as Tone, icon: HardDrive },
    { label: 'Network I/O', value: animatedValues[2], tone: 'green' as Tone, icon: Network },
  ];

  return (
    <section className={`${cardClass} p-6`}>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">System Status</h2>
        <p className="mt-1 text-sm text-slate-500">Derived operational health from live dashboard stats.</p>
      </div>
      <div className="space-y-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneMap[metric.tone].icon}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{metric.label}</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">{metric.value}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100">
                <div className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${toneMap[metric.tone].bar}`} style={{ width: `${metric.value}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const LiveLogsFeed: React.FC<{ alerts: Alert[]; signals: SignalPost[] }> = ({ alerts, signals }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const logs = useMemo(() => {
    const alertLogs = alerts.map((alert) => ({
      timestamp: alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : '—',
      level: alert.severity === 'critical' ? 'ERROR' : alert.severity === 'high' ? 'WARN' : 'INFO',
      message: alert.title || alert.summary || 'Alert detected',
    }));

    const signalLogs = signals.map((signal) => ({
      timestamp: signal.scraped_at ? new Date(signal.scraped_at).toLocaleTimeString() : signal.timestamp ? new Date(signal.timestamp).toLocaleTimeString() : '—',
      level: signal.has_ioc ? 'WARN' : signal.has_credentials ? 'INFO' : 'DEBUG',
      message: `${signal.source}: ${signal.body.slice(0, 110)}${signal.body.length > 110 ? '…' : ''}`,
    }));

    return [...alertLogs, ...signalLogs].slice(0, 12);
  }, [alerts, signals]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const badgeTone: Record<string, string> = {
    ERROR: 'bg-red-50 text-red-700',
    WARN: 'bg-amber-50 text-amber-700',
    INFO: 'bg-blue-50 text-blue-700',
    DEBUG: 'bg-slate-200 text-slate-700',
  };

  return (
    <section className={`${cardClass} p-6`}>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Live Logs Feed</h2>
        <p className="mt-1 text-sm text-slate-500">Real alert and signal events from the current API response.</p>
      </div>
      <div ref={containerRef} className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800">
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="text-center text-slate-500">No live events yet.</div>
          ) : (
            logs.map((log, index) => (
              <div key={`${log.timestamp}-${index}`} className="flex items-start gap-3">
                <span className="shrink-0 text-slate-400">{log.timestamp}</span>
                <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeTone[log.level]}`}>
                  {log.level}
                </span>
                <span className="leading-5 text-slate-700">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

const Dashboard: React.FC = () => {
  const { dashboard, recentAlerts, timeSeries, loading, error, lastUpdated, isDemoMode } = useMonitoringData(7000);

  if (loading && !dashboard) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500">Connecting to live ShadowEcho telemetry…</p>
      </div>
    );
  }

  const stats = dashboard?.stats;
  const alerts = recentAlerts ?? [];
  const signals = dashboard?.recent_signals ?? [];
  const totalThreats = stats?.signal_posts ?? 0;
  const criticalAlerts = stats?.alerts_by_severity?.critical ?? 0;
  const activeIncidents = stats?.unacknowledged_alerts ?? 0;
  const systemHealth = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          ((stats?.unacknowledged_alerts ?? 0) * 3 +
            Math.max(0, (stats?.alerts_by_severity?.critical ?? 0) * 2 - (stats?.signal_posts ?? 0) * 0.02)),
      ),
    ),
  );

  const cpu = Math.min(100, Math.round(((stats?.signal_posts ?? 0) / Math.max(stats?.total_posts ?? 1, 1)) * 100));
  const memory = Math.min(100, Math.round(((stats?.credential_posts ?? 0) / Math.max(stats?.signal_posts ?? 1, 1)) * 100));
  const network = Math.min(100, Math.round(((stats?.ioc_posts ?? 0) / Math.max(stats?.total_posts ?? 1, 1)) * 100 + 30));

  const chartData = timeSeries.map((point) => ({
    time: point.time.slice(0, 5),
    critical: point.critical,
    high: point.high,
    medium: point.medium,
  }));
  const sourceData = Object.entries(stats?.posts_by_source ?? {})
    .map(([source, posts]) => ({ source, posts }))
    .sort((left, right) => right.posts - left.posts);
  const topSourceData = sourceData.slice(0, 10);
  const maxSourcePosts = topSourceData[0]?.posts ?? 1;
  const heatmapData = sourceData.slice(0, 12).map((item) => ({
    ...item,
    intensity: Math.min(4, Math.floor((item.posts / maxSourcePosts) * 5)),
  }));
  const exposureMixData = [
    { name: 'Total Posts', value: stats?.total_posts ?? 0, color: '#3b82f6' },
    { name: 'Credentials', value: stats?.credential_posts ?? 0, color: '#f59e0b' },
    { name: 'IOCs', value: stats?.ioc_posts ?? 0, color: '#10b981' },
    { name: 'Alerts', value: stats?.total_alerts ?? 0, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <section className={`${cardClass} p-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">ShadowEcho Dashboard</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Live enterprise monitoring with real backend telemetry.
            </h2>
          </div>
          <LiveIndicator updatedAt={lastUpdated} />
        </div>
      </section>

      {error ? <ErrorBanner message={error} /> : null}

      {isDemoMode ? (
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-violet-700">
          Demo mode - showing representative data. Connect scraper to populate live feed.
        </div>
      ) : null}

      <StatsCards
        totalThreats={totalThreats}
        criticalAlerts={criticalAlerts}
        activeIncidents={activeIncidents}
        systemHealth={systemHealth}
      />

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <ThreatActivityChart data={chartData} />
        <RecentIncidentsPanel alerts={alerts} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SourceVolumeChart data={topSourceData} />
        <ExposureMixChart data={exposureMixData} />
      </div>

      <SourceHeatmap data={heatmapData} />

      <AlertsTable alerts={alerts} />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SystemStatusWidget cpu={cpu} memory={memory} network={network} />
        <LiveLogsFeed alerts={alerts} signals={signals} />
      </div>
    </div>
  );
};

export default Dashboard;
