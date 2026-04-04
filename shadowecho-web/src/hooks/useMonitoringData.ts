// src/hooks/useMonitoringData.ts
// ─────────────────────────────────────────────────────────────────────────────
// Polling hook that feeds the Dashboard with live data.
//
// Fixed:
//   - Defensive guards on alertSummary fields (backend may return 0 counts
//     as missing keys rather than explicit zeros — previously caused NaN
//     in charts and silently broke the PieChart filter).
//   - Error state no longer wipes existing good data (prev spread preserved).
//   - pollInterval change correctly restarts the interval via deps array.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDashboard, fetchAlertSummary, fetchAlerts } from '../services/api';
import type {
  DashboardResponse,
  AlertSummary,
  Alert,
  TimeSeriesPoint,
} from '../types/api';
import {
  FALLBACK_ALERTS,
  FALLBACK_ALERT_SUMMARY,
  FALLBACK_DASHBOARD,
  FALLBACK_STATS,
  FALLBACK_TIME_SERIES,
} from '../data/fallbackData';

const MAX_HISTORY = 30; // rolling window of time-series points

interface MonitoringState {
  dashboard: DashboardResponse | null;
  alertSummary: AlertSummary | null;
  recentAlerts: Alert[];
  timeSeries: TimeSeriesPoint[];
  isDemoMode: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const INITIAL_STATE: MonitoringState = {
  dashboard: null,
  alertSummary: null,
  recentAlerts: [],
  timeSeries: [],
  isDemoMode: false,
  loading: true,
  error: null,
  lastUpdated: null,
};

/** Normalise an AlertSummary so every numeric field is always a real number. */
function normaliseSummary(raw: AlertSummary): AlertSummary {
  return {
    critical: raw.critical ?? 0,
    high: raw.high ?? 0,
    medium: raw.medium ?? 0,
    low: raw.low ?? 0,
    total: raw.total ?? 0,
  };
}

function isZeroStats(stats?: DashboardResponse['stats'] | null) {
  if (!stats) return true;
  return (stats.total_posts ?? 0) === 0;
}

export function useMonitoringData(pollInterval = 7000) {
  const [state, setState] = useState<MonitoringState>(INITIAL_STATE);
  const timeSeriesRef = useRef<TimeSeriesPoint[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const [dashboard, rawSummary, alertsResp] = await Promise.all([
        fetchDashboard(),
        fetchAlertSummary(),
        fetchAlerts(20),
      ]);

      const useFallbackStats = isZeroStats(dashboard?.stats);
      const dashboardData = useFallbackStats
        ? FALLBACK_DASHBOARD
        : {
            ...dashboard,
            stats: {
              ...dashboard.stats,
              noise_filtered:
                dashboard.stats.noise_filtered ??
                Math.max(0, (dashboard.stats.total_posts ?? 0) - (dashboard.stats.signal_posts ?? 0)),
            },
            recent_alerts: dashboard.recent_alerts?.length ? dashboard.recent_alerts : FALLBACK_ALERTS,
            recent_signals: dashboard.recent_signals?.length ? dashboard.recent_signals : FALLBACK_DASHBOARD.recent_signals,
          };
      const alertSummary =
        (rawSummary?.total ?? 0) === 0 ? FALLBACK_ALERT_SUMMARY : normaliseSummary(rawSummary);
      const recentAlerts = alertsResp.alerts?.length ? alertsResp.alerts : FALLBACK_ALERTS;
      const now = new Date();

      const point: TimeSeriesPoint = {
        time: now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        critical: alertSummary.critical,
        high: alertSummary.high,
        medium: alertSummary.medium,
        low: alertSummary.low,
        signals: dashboardData.stats.signal_posts ?? FALLBACK_STATS.signal_posts,
        total_posts: dashboardData.stats.total_posts ?? FALLBACK_STATS.total_posts,
      };

      const nextSeries = [...timeSeriesRef.current, point].slice(-MAX_HISTORY);
      timeSeriesRef.current = nextSeries.length >= 2 ? nextSeries : FALLBACK_TIME_SERIES;

      setState(prev => ({
        ...prev,
        dashboard: dashboardData,
        alertSummary,
        recentAlerts,
        timeSeries: [...timeSeriesRef.current],
        isDemoMode: useFallbackStats || !alertsResp.alerts?.length || (rawSummary?.total ?? 0) === 0,
        loading: false,
        error: null,
        lastUpdated: now,
      }));
    } catch (err) {
      // Keep existing good data visible; just update error + loading state
      setState(prev => ({
        ...prev,
        dashboard: prev.dashboard ?? FALLBACK_DASHBOARD,
        alertSummary: prev.alertSummary ?? FALLBACK_ALERT_SUMMARY,
        recentAlerts: prev.recentAlerts.length ? prev.recentAlerts : FALLBACK_ALERTS,
        timeSeries: prev.timeSeries.length ? prev.timeSeries : FALLBACK_TIME_SERIES,
        isDemoMode: true,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch data',
      }));
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, pollInterval);
    return () => clearInterval(id);
  }, [fetchAll, pollInterval]);

  return { ...state, refresh: fetchAll };
}
