export interface DashboardStats {
  total_posts: number;
  signal_posts: number;
  noise_filtered: number;
  total_alerts: number;
  unacknowledged_alerts: number;
  credential_posts: number;
  ioc_posts: number;
  alerts_by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  posts_by_source: Record<string, number>;
  feedback: {
    real: number;
    noise: number;
    unsure: number;
  };
}

export interface Post {
  id: string;
  source: string;
  forum_type: string;
  title: string;
  body: string;
  author: string;
  timestamp: string;
  url: string;
  scraped_at: string;
  signal_score: number;
  is_signal: boolean;
  has_credentials: boolean;
  has_ioc: boolean;
}

export type SignalPost = Post;

export interface Alert {
  id: number;
  post_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  alert_type: string;
  title: string;
  summary: string;
  confidence: number;
  uncertainty_note: string;
  created_at: string;
  acknowledged: boolean;
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

export interface DashboardResponse {
  stats: DashboardStats;
  recent_alerts: Alert[];
  recent_signals: Post[];
}

export interface MirrorPost extends Post {
  match_type: 'exact' | 'semantic';
  similarity?: number;
  credentials_found: number;
  iocs_found: number;
  confidence?: number;
}

export interface MirrorResponse {
  org_name: string;
  total_mentions: number;
  posts: MirrorPost[];
}

export interface LineupSimilarPost {
  text: string;
  source: string;
  author: string;
  similarity: number;
  timestamp: string;
  has_credentials: boolean;
  has_ioc: boolean;
  confidence_note: string;
}

export interface LineupResponse {
  query_post: Post | null;
  similar_posts: LineupSimilarPost[];
  cluster_count: number;
}

export interface LeakImpact {
  data_types_exposed: Array<{
    type: string;
    label: string;
    severity_weight: number;
    per_record_cost_usd: number;
  }>;
  primary_data_type: string;
  estimated_records: {
    estimated_count: number;
    confidence: number;
    formatted: string;
    method: string;
  };
  scale_category: 'unknown' | 'minor' | 'moderate' | 'major' | 'massive' | 'catastrophic';
  applicable_regulations: Array<{
    regulation: string;
    description: string;
    max_fine: string;
    notification_deadline: string;
    applies: boolean;
  }>;
  regulatory_risk: 'low' | 'medium' | 'high' | 'critical';
  business_risk_score: number;
  risk_breakdown: {
    reputational: number;
    legal: number;
    financial: number;
    operational: number;
  };
  estimated_cost_range: {
    low_usd: number;
    high_usd: number;
    formatted: string;
  };
  overall_severity: 'low' | 'medium' | 'high' | 'critical';
  recommended_actions: string[];
  impact_summary: string;
}

export type ImpactQuickResponse = LeakImpact;

export interface DecodeResponse {
  has_coded_language: boolean;
  decoded_terms: Array<{
    original: string;
    decoded: string;
    category: string;
    severity: string;
    language: string;
  }>;
  threat_categories: string[];
  highest_severity: string;
  language_mix: string[];
  decoded_summary: string;
  term_count: number;
}

export interface FeedbackStats {
  stats: { real: number; noise: number; unsure: number };
  total_labels: number;
  accuracy_signal: string;
}

export interface TimeSeriesPoint {
  time: string;
  total_posts: number;
  signals: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

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

export interface ReportRequest {
  org_name?: string;
  timeframe?: string;
  focus?: string;
  include_recommendations?: boolean;
}

export interface ReportSourceBreakdown {
  source: string;
  total_posts: number;
  signal_posts: number;
  cred_posts: number;
  ioc_posts: number;
}

export interface ReportResponse {
  generated_at: string;
  org_focus: string | null;
  duration_ms: number;
  include_llm: boolean;
  overview: DashboardStats & {
    signal_rate_pct: number;
  };
  executive_summary: string;
  recommendations: string;
  critical_alerts: Alert[];
  recent_alerts: Alert[];
  top_signals: Post[];
  ioc_highlights: Post[];
  source_breakdown: ReportSourceBreakdown[];
}

export interface ReportExportResponse {
  url?: string;
  file_path?: string;
  filename?: string;
  content?: string;
  [key: string]: unknown;
}
