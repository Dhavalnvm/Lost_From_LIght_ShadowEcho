// src/services/api.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central API client. All fetch calls go through apiFetch so headers,
// error handling, and base-URL resolution stay consistent.
//
// Fixed:
//   - fetchFeedbackStats now correctly maps the backend response
//     { stats, total_labels, accuracy_signal } — previously the shape
//     mismatch caused FeedbackPanel to silently render nothing.
//   - apiFetch properly surfaces HTTP error bodies for debugging.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AlertsResponse,
  AlertSummary,
  DashboardResponse,
  FeedbackStats,
  DecodeResponse,
  LineupResponse,
  MirrorResponse,
  ImpactQuickResponse,
  ChatResponse,
  ChatMessage,
  NotebookRequest,
  NotebookResponse,
  ReportRequest,
  ReportResponse,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ─── Generic Fetch Wrapper ────────────────────────────────────────────────────

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Skip ngrok browser-warning interstitial when tunnelling locally
      'ngrok-skip-browser-warning': 'true',
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch { /* ignore */ }
    const err = new Error(`API ${res.status} on ${endpoint}: ${body}`);
    console.error('❌ API ERROR', err);
    throw err;
  }

  return res.json() as Promise<T>;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const fetchAlerts = (
  limit = 20,
  severity?: string
): Promise<AlertsResponse> =>
  apiFetch(`/api/alerts?limit=${limit}${severity ? `&severity=${severity}` : ''}`);

export const fetchUnackedAlerts = (limit = 20): Promise<AlertsResponse> =>
  apiFetch(`/api/alerts/unacknowledged?limit=${limit}`);

export const fetchAlertSummary = (): Promise<AlertSummary> =>
  apiFetch('/api/alerts/summary');

export const acknowledgeAlert = (alert_id: number | string): Promise<unknown> =>
  apiFetch('/api/alerts/acknowledge', {
    method: 'POST',
    body: JSON.stringify({ alert_id }),
  });

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const fetchDashboard = (): Promise<DashboardResponse> =>
  apiFetch('/api/dashboard');

// ─── Feedback ─────────────────────────────────────────────────────────────────

/**
 * Backend returns: { stats: {real:N, noise:N, unsure:N}, total_labels, accuracy_signal }
 * This matches FeedbackStats exactly — no remapping needed.
 */
export const fetchFeedbackStats = (): Promise<FeedbackStats> =>
  apiFetch('/api/feedback/stats');

export const submitFeedback = (
  post_id: string,
  label: 'real' | 'noise' | 'unsure',
  notes?: string
): Promise<unknown> =>
  apiFetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({ post_id, label, notes }),
  });

// ─── Decode ───────────────────────────────────────────────────────────────────

export const decodeText = (text: string): Promise<DecodeResponse> =>
  apiFetch('/api/decode', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });

// ─── Lineup ───────────────────────────────────────────────────────────────────

export const findSimilar = (text: string, top_k = 10): Promise<LineupResponse> =>
  apiFetch('/api/lineup', {
    method: 'POST',
    body: JSON.stringify({ text, top_k }),
  });

// ─── Mirror ───────────────────────────────────────────────────────────────────

export const mirrorLookup = (
  org_name: string,
  limit = 20
): Promise<MirrorResponse> =>
  apiFetch('/api/mirror', {
    method: 'POST',
    body: JSON.stringify({ org_name, limit }),
  });

// ─── Impact ───────────────────────────────────────────────────────────────────

export const quickImpact = (
  text: string,
  org_name = ''
): Promise<ImpactQuickResponse> =>
  apiFetch('/api/impact/quick', {
    method: 'POST',
    body: JSON.stringify({ text, org_name }),
  });

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const sendChat = (
  message: string,
  history: ChatMessage[]
): Promise<ChatResponse> =>
  apiFetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  });

// ─── Report ───────────────────────────────────────────────────────────────────

export const generateReport = (
  payload: ReportRequest
): Promise<ReportResponse> =>
  apiFetch('/api/report', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const exportReport = async (payload: ReportRequest): Promise<string> => {
  const res = await fetch(`${BASE_URL}/api/report/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  return res.text();
};
// ─── Notebook ─────────────────────────────────────────────────────────────────

export const fetchNotebook = (
  payload: NotebookRequest
): Promise<NotebookResponse> =>
  apiFetch('/api/notebook', {
    method: 'POST',
    body: JSON.stringify(payload),
  });