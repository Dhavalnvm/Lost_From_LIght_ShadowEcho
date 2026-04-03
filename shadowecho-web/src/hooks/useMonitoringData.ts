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

const MAX_HISTORY = 30; // rolling window of time-series points

interface MonitoringState {
  dashboard: DashboardResponse | null;
  alertSummary: AlertSummary | null;
  recentAlerts: Alert[];
  timeSeries: TimeSeriesPoint[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const INITIAL_STATE: MonitoringState = {
  dashboard: null,
  alertSummary: null,
  recentAlerts: [],
  timeSeries: [],
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

      const alertSummary = normaliseSummary(rawSummary);
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
        signals: dashboard.stats.signal_posts ?? 0,
        total_posts: dashboard.stats.total_posts ?? 0,
      };

      timeSeriesRef.current = [
        ...timeSeriesRef.current,
        point,
      ].slice(-MAX_HISTORY);

      setState(prev => ({
        ...prev,
        dashboard,
        alertSummary,
        recentAlerts: alertsResp.alerts ?? [],
        timeSeries: [...timeSeriesRef.current],
        loading: false,
        error: null,
        lastUpdated: now,
      }));
    } catch (err) {
      // Keep existing good data visible; just update error + loading state
      setState(prev => ({
        ...prev,
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