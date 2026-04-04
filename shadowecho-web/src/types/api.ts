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
  // Core (always present)
  id:                string;
  body:              string;
  source:            string;
  author:            string;
  match_type:        string;          // 'exact' | 'semantic'
  credentials_found: number;          // from detector scan count
  iocs_found:        number;          // from detector scan count
 
  // Extended fields returned by /api/mirror
  title?:            string | null;   // post title from scrape
  url?:              string | null;   // original .onion / paste URL
  forum_type?:       string | null;   // 'ransomware_blog' | 'data_leak_forum' | 'exploit_forum' | 'hacking_forum' | 'carding_forum' | 'general_darknet'
  timestamp?:        string | null;   // ISO datetime — when the post was created
  scraped_at?:       string | null;   // ISO datetime — when ShadowEcho ingested it
  processed_at?:     string | null;   // ISO datetime — when pipeline ran
  signal_score?:     number | null;   // float 0-1, null if pipeline not run yet
  is_signal?:        number | boolean;// 0/1 or boolean
  char_count?:       number | null;   // body length in characters
  has_credentials?:  number | boolean;// 0/1 — body contains credential patterns
  has_ioc?:          number | boolean;// 0/1 — body contains IOC patterns
 
  // From semantic search results
  similarity?:       number | null;   // cosine similarity 0-1
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
  timeframe?: string;        // '24h' | '7d' | '30d'
  focus?: string;
  include_recommendations?: boolean;
}

export interface ReportResponse {
  title?: string;
  generated_at?: string;
  org_name?: string | null;
  timeframe?: string;
  focus?: string | null;
  duration_ms?: number;
  include_llm?: boolean;
  overview?: {
    total_posts: number;
    signal_posts: number;
    noise_filtered: number;
    signal_rate_pct: number;
    total_alerts: number;
    unacknowledged_alerts: number;
    credential_posts: number;
    ioc_posts: number;
    alerts_by_severity: Record<string, number>;
    posts_by_source: Record<string, number>;
    feedback?: Record<string, unknown>;
  };
  executive_summary?: string;
  recommendations?: string[];     // list[str] from backend
  critical_alerts?: Array<{
    id?: number; title?: string; summary?: string;
    confidence?: number; alert_type?: string; created_at?: string;
  }>;
  recent_alerts?: Array<{
    id?: number; severity?: string; title?: string; summary?: string;
    confidence?: number; alert_type?: string; acknowledged?: boolean; created_at?: string;
  }>;
  top_signals?: Array<{
    id?: string; source?: string; author?: string; snippet?: string;
    signal_score?: number; has_credentials?: boolean; has_ioc?: boolean;
  }>;
  ioc_highlights?: Array<{
    id?: string; source?: string; snippet?: string;
    has_credentials?: boolean; has_ioc?: boolean; signal_score?: number;
  }>;
  source_breakdown?: Array<{
    source: string; total_posts: number; signal_posts: number;
    cred_posts: number; ioc_posts: number;
  }>;
}

export interface ReportExportResponse {
  url?: string;
  file_path?: string;
  filename?: string;
  content?: string;
  [key: string]: unknown;
}

export interface NotebookRequest {
  post_id?: string;
  query?: string;
  top_k?: number;
}
 
export interface NotebookResponse {
  brief: {
    narrative?: {
      summary?: string;
      threat_type?: string;
      timeline?: string[];
      targets?: string[];
      recommended_actions?: string[];
      uncertainty_note?: string;
    };
    detection_summary?: {
      org_mentions?: string[];
      credentials_found?: number;
      iocs_found?: number;
      tags?: string[];
    };
    signal_assessment?: {
      score?: number;
      is_signal?: boolean;
      key_flags?: string[];
    };
    related_actor?: {
      actor_id?: string;
      traits?: string[];
      writing_style?: string;
      experience_level?: string;
      confidence?: number;
      uncertainty_note?: string;
      is_experienced?: boolean;
    };
    escalation?: {
      stage?: string;
      level?: number;
      indicators?: string[];
      is_high_risk?: boolean;
      is_actionable?: boolean;
    };
    source_count?: number;
    sources?: string[];
  };
  sources_used: number;
  context_posts: Array<{
    text: string;
    source: string;
    similarity: number;
  }>;
}