import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BellRing } from 'lucide-react';
import { acknowledgeAlert, fetchAlerts, fetchAlertSummary } from '../services/api';
import type { Alert, AlertSummary } from '../types/api';
import { FALLBACK_ALERTS, FALLBACK_ALERT_SUMMARY } from '../data/fallbackData';
import { ErrorBanner, LiveIndicator, Spinner } from '../components/common';
import PageHeader from '../components/layout/PageHeader';

const severities = ['all', 'critical', 'high', 'medium', 'low'] as const;
type SeverityFilter = (typeof severities)[number];

const pillTone: Record<string, string> = {
  critical: 'bg-red-50 text-red-700',
  high: 'bg-orange-50 text-orange-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-green-50 text-green-700',
};

const statusTone: Record<string, string> = {
  investigating: 'border-amber-200 bg-amber-50 text-amber-700',
  resolved: 'border-green-200 bg-green-50 text-green-700',
  new: 'border-blue-200 bg-blue-50 text-blue-700',
};

const inferStatus = (alert: Alert) => {
  if (alert.acknowledged) return 'resolved';
  if ((alert.confidence ?? 0) >= 0.8) return 'investigating';
  return 'new';
};

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [acking, setAcking] = useState<Set<number | string>>(new Set());
  const [isDemoMode, setIsDemoMode] = useState(false);

  const load = useCallback(async () => {
    try {
      const [alertsResponse, alertSummary] = await Promise.all([
        fetchAlerts(100, filter === 'all' ? undefined : filter),
        fetchAlertSummary(),
      ]);

      const nextAlerts = alertsResponse.alerts.length > 0 ? alertsResponse.alerts : FALLBACK_ALERTS;
      const nextSummary = alertSummary.total > 0 ? alertSummary : FALLBACK_ALERT_SUMMARY;

      setAlerts(nextAlerts);
      setSummary(nextSummary);
      setIsDemoMode(alertsResponse.alerts.length === 0 || alertSummary.total === 0);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setAlerts(FALLBACK_ALERTS);
      setSummary(FALLBACK_ALERT_SUMMARY);
      setIsDemoMode(true);
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const interval = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(interval);
  }, [load]);

  const handleAck = async (id: number | string) => {
    setAcking((current) => new Set(current).add(id));
    try {
      await acknowledgeAlert(id);
      await load();
    } finally {
      setAcking((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const unacknowledgedCount = useMemo(() => alerts.filter((alert) => !alert.acknowledged).length, [alerts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alert Feed"
        subtitle="Live alert operations table with severity filtering, acknowledgements, and current backend counts."
        action={
          <div className="flex items-center gap-3">
            {loading ? <Spinner size="sm" /> : null}
            <LiveIndicator updatedAt={lastUpdated} />
          </div>
        }
      />

      {error ? <ErrorBanner message={error} /> : null}

      {isDemoMode ? (
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-violet-700">
          Demo mode - showing representative alerts while the live database is still sparse.
        </div>
      ) : null}

      {summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(['critical', 'high', 'medium', 'low'] as const).map((severity) => (
            <button
              key={severity}
              type="button"
              onClick={() => setFilter(filter === severity ? 'all' : severity)}
              className={`rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                filter === severity ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{severity}</div>
              <div className="mt-3 text-3xl font-semibold text-slate-900">{summary[severity]}</div>
              <div className="mt-2 text-sm text-slate-500">Click to filter by {severity}</div>
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {severities.map((severity) => (
          <button
            key={severity}
            type="button"
            onClick={() => setFilter(severity)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === severity
                ? 'bg-blue-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {severity}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <BellRing className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[130px_140px_140px_1fr_140px] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          <span>Time</span>
          <span>Severity</span>
          <span>Type</span>
          <span>Title / Details</span>
          <span>Action</span>
        </div>

        {loading && alerts.length === 0 ? (
          <div className="flex justify-center px-6 py-12">
            <Spinner />
          </div>
        ) : alerts.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">No alerts available for this filter.</div>
        ) : (
          alerts.map((alert) => {
            const status = inferStatus(alert);
            return (
              <div key={String(alert.id)} className={`grid grid-cols-[130px_140px_140px_1fr_140px] gap-4 border-b border-slate-100 px-6 py-4 transition last:border-b-0 ${alert.acknowledged ? 'bg-slate-50 opacity-80' : 'hover:bg-slate-50'}`}>
                <div className="text-sm text-slate-600">
                  {alert.created_at ? new Date(alert.created_at).toLocaleString() : 'Unavailable'}
                </div>
                <div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pillTone[alert.severity] ?? pillTone.low}`}>
                    {alert.severity}
                  </span>
                </div>
                <div className="text-sm capitalize text-slate-600">{alert.alert_type || 'threat'}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{alert.title || 'Untitled alert'}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {alert.summary || 'No summary provided.'}
                  </p>
                  <p className="mt-2 text-xs italic text-slate-500">{alert.uncertainty_note}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      Post ID {String(alert.post_id).slice(0, 8)}
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[status]}`}>
                      {status}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      Confidence {((alert.confidence ?? 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-3 flex gap-1">
                    {Array.from({ length: 8 }, (_, index) => (
                      <span key={index} className={`h-2 w-4 rounded-sm ${index < Math.round((alert.confidence ?? 0) * 8) ? 'bg-cyan-400' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                </div>
                <div className="flex items-start justify-end">
                  {alert.acknowledged ? (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">✓ Acknowledged</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleAck(alert.id)}
                      disabled={acking.has(alert.id)}
                      className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {acking.has(alert.id) ? 'Acknowledging…' : 'Acknowledge'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        <span>Total: <span className="font-semibold text-slate-900">{alerts.length}</span></span>
        <span>Unacknowledged: <span className="font-semibold text-slate-900">{unacknowledgedCount}</span></span>
        {summary ? <span>Critical: <span className="font-semibold text-slate-900">{summary.critical}</span></span> : null}
        {summary ? <span>High: <span className="font-semibold text-slate-900">{summary.high}</span></span> : null}
        {summary ? <span>Medium: <span className="font-semibold text-slate-900">{summary.medium}</span></span> : null}
        {summary ? <span>Low: <span className="font-semibold text-slate-900">{summary.low}</span></span> : null}
      </div>
    </div>
  );
};

export default AlertsPage;
