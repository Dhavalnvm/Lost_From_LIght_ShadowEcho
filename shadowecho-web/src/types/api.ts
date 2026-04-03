// src/types/api.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central type definitions for all ShadowEcho API request/response shapes.
// This file was MISSING — its absence caused TypeScript compilation failure
// and a completely blank frontend.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_posts: number;
  signal_posts: number;
  noise_filtered: number;
  total_alerts: number;
  unacknowledged_alerts: number;
  credential_posts: number;
  ioc_posts: number;
  alerts_by_severity: Record<string, number>;
  posts_by_source: Record<string, number>;
  feedback: Record<string, number>;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recent_alerts: Alert[];
  recent_signals: SignalPost[];
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export interface Alert {
  id: number | string;
  post_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  alert_type: string;
  title: string;
  summary: string;
  confidence: number;
  uncertainty_note: string;
  created_at: string;
  acknowledged: boolean;
  acknowledged_at?: string;
  detection_output?: Record<string, unknown>;
  module_output?: Record<string, unknown>;
  leak_impact_summary?: string;
  regulatory_risk?: string;
}

export interface AlertSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface AlertsResponse {
  total: number;
  alerts: Alert[];
}

// ─── Signal Posts ─────────────────────────────────────────────────────────────

export interface SignalPost {
  id: string;
  source: string;
  forum_type?: string;
  title?: string;
  body: string;
  author?: string;
  timestamp?: string;
  url?: string;
  scraped_at?: string;
  signal_score?: number;
  is_signal?: boolean;
  has_credentials?: boolean;
  has_ioc?: boolean;
}

// ─── Time Series (built client-side for charts) ───────────────────────────────

export interface TimeSeriesPoint {
  time: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  signals: number;
  total_posts: number;
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export interface FeedbackStats {
  stats: Record<string, number>;   // { real: N, noise: N, unsure: N }
  total_labels: number;
  accuracy_signal: string;
}

// ─── Slang Decoder ────────────────────────────────────────────────────────────

export interface DecodedTerm {
  term: string;
  decoded: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface DecodeResponse {
  has_coded_language: boolean;
  highest_severity: 'critical' | 'high' | 'medium' | 'low';
  term_count: number;
  decoded_terms: DecodedTerm[];
  decoded_summary: string;
  threat_categories: string[];
  language_mix: string[];
}

// ─── Lineup (similar posts) ───────────────────────────────────────────────────

export interface SimilarPost {
  id: string;
  source: string;
  text: string;
  similarity: number;
  has_credentials: boolean;
  has_ioc: boolean;
  confidence_note: string;
}

export interface LineupResponse {
  query_post: Record<string, unknown> | null;
  similar_posts: SimilarPost[];
  cluster_count: number;
}

// ─── Mirror (org lookup) ──────────────────────────────────────────────────────

export interface MirrorPost {
  id: string;
  source: string;
  body: string;
  author?: string;
  match_type: 'exact' | 'fuzzy' | 'semantic';
  credentials_found: number;
  iocs_found: number;
  scraped_at?: string;
}

export interface MirrorResponse {
  org_name: string;
  total_mentions: number;
  posts: MirrorPost[];
}

// ─── Impact ───────────────────────────────────────────────────────────────────

export interface ImpactQuickResponse {
  severity: string;
  risk_score: number;
  scale: string;
  records: string;
  cost_range: string;
  regulations: string[];
  summary: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  model: string;
  context_used: boolean;
  duration_ms: number;
}

// ─── Report ───────────────────────────────────────────────────────────────────

export interface ReportRequest {
  org_name?: string;
  timeframe?: string;
  focus?: string;
  include_recommendations?: boolean;
}

export interface ReportResponse {
  title?: string;
  generated_at?: string;
  executive_summary?: string;
  recommendations?: string[];
  key_findings?: string[];
  alerts?: Alert[];
  [key: string]: unknown;
}

export interface ReportExportResponse {
  url?: string;
  file_path?: string;
  filename?: string;
  content?: string;
  [key: string]: unknown;
}