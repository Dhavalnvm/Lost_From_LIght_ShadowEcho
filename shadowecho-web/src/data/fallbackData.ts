import type {
  Alert,
  AlertSummary,
  DashboardResponse,
  DashboardStats,
  FeedbackStats,
  MirrorPost,
  Post,
  ReportSourceBreakdown,
  TimeSeriesPoint,
} from '../types/api';

export const FALLBACK_STATS: DashboardStats = {
  total_posts: 1847,
  signal_posts: 312,
  noise_filtered: 1535,
  total_alerts: 47,
  unacknowledged_alerts: 13,
  credential_posts: 89,
  ioc_posts: 134,
  alerts_by_severity: { critical: 4, high: 11, medium: 19, low: 13 },
  posts_by_source: {
    dread: 743,
    breachforums: 521,
    telegram: 389,
    paste_site: 194,
  },
  feedback: { real: 67, noise: 23, unsure: 8 },
};

export const FALLBACK_ALERT_SUMMARY: AlertSummary = {
  critical: 4,
  high: 11,
  medium: 19,
  low: 13,
  total: 47,
};

export const FALLBACK_ALERTS: Alert[] = [
  {
    id: 1,
    post_id: 'a3f7e2b1c8d4',
    severity: 'critical',
    alert_type: 'CREDENTIAL_LEAK',
    title: 'Corporate credential dump - 47k accounts',
    summary:
      'A threat actor on Dread forum claims to have obtained login credentials for a major financial institution. The dump allegedly contains 47,000 employee and customer accounts with plaintext passwords and associated email addresses.',
    confidence: 0.91,
    uncertainty_note: 'Sample verification pending. Actor has 2 prior verified dumps.',
    created_at: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: 2,
    post_id: 'b9c1d3e5f7a2',
    severity: 'high',
    alert_type: 'TARGETED_THREAT',
    title: 'RDP access sale - Fortune 500 healthcare org',
    summary:
      'Seller offering persistent RDP access to an unspecified "major US hospital network" with domain admin privileges. Asking price 0.8 BTC. Post includes screenshot evidence of domain controller access.',
    confidence: 0.78,
    uncertainty_note: 'Target org unconfirmed. Screenshot metadata suggests Windows Server 2019.',
    created_at: new Date(Date.now() - 1.7 * 60 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: 3,
    post_id: 'c2e4f6a8b0d1',
    severity: 'high',
    alert_type: 'DATA_BREACH',
    title: 'Database dump - 1.2M PII records',
    summary:
      'Post on BreachForums listing a database dump containing name, email, phone, DOB, and partial card data for 1.2M individuals. Claimed source is an Indian e-commerce platform.',
    confidence: 0.83,
    uncertainty_note: 'Record count unverified. Sample of 1000 records posted as proof.',
    created_at: new Date(Date.now() - 4.2 * 60 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: 4,
    post_id: 'd5f7b1c9e3a4',
    severity: 'medium',
    alert_type: 'IOC_DETECTED',
    title: 'C2 infrastructure indicators published',
    summary:
      'Telegram channel posted a list of 34 IP addresses and 12 domains associated with an ongoing phishing campaign targeting banking customers. Campaign uses fake OTP pages.',
    confidence: 0.67,
    uncertainty_note: 'IPs may be shared hosting. Independent validation recommended.',
    created_at: new Date(Date.now() - 8.5 * 60 * 60 * 1000).toISOString(),
    acknowledged: true,
  },
  {
    id: 5,
    post_id: 'e8a2b4c6d0f5',
    severity: 'critical',
    alert_type: 'RANSOMWARE',
    title: 'Ransomware group claims attack on logistics firm',
    summary:
      'DarkNet ransomware group posted proof-of-breach for a European logistics company, claiming 340GB of data including contracts, employee PII, and financial records. Ransom demand: $2.3M.',
    confidence: 0.94,
    uncertainty_note: 'Group has 23 verified prior attacks. File tree evidence reviewed.',
    created_at: new Date(Date.now() - 11.3 * 60 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: 6,
    post_id: 'f1c3e5a7b9d6',
    severity: 'medium',
    alert_type: 'SOCIAL_ENGINEERING',
    title: 'Vishing script targeting bank customers circulating',
    summary:
      'Script for impersonating bank fraud departments circulating on multiple forums. Includes objection handling and instructions for social engineering OTP codes from victims.',
    confidence: 0.61,
    uncertainty_note: 'Script quality suggests semi-professional operation.',
    created_at: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(),
    acknowledged: true,
  },
  {
    id: 7,
    post_id: 'g4d6f8b2a0e7',
    severity: 'high',
    alert_type: 'MALWARE',
    title: 'New infostealer variant - targets Indian banking apps',
    summary:
      'A new Android infostealer specifically targeting HDFC, SBI, and ICICI mobile banking apps being sold for $350/month subscription. Includes screenshots, keylogging, and OTP interception.',
    confidence: 0.86,
    uncertainty_note: 'Sample binary obtained. Dynamic analysis pending.',
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: 8,
    post_id: 'h7e9c1d3f5b8',
    severity: 'low',
    alert_type: 'RECONNAISSANCE',
    title: 'OSINT compilation targeting tech company employees',
    summary:
      'Compilation of LinkedIn-sourced employee data for a mid-size SaaS company, including names, roles, emails, and phone numbers. 847 records. Likely pre-phishing reconnaissance.',
    confidence: 0.52,
    uncertainty_note: 'Data appears scraped from public sources. Low immediate risk.',
    created_at: new Date(Date.now() - 38 * 60 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
];

export const FALLBACK_SIGNALS: Post[] = [
  {
    id: 'a3f7e2b1c8d4',
    source: 'dread',
    forum_type: 'darknet_forum',
    title: 'Fresh corporate creds - bulk sale',
    body:
      'Selling verified combo list from recent stealer campaign. 47k lines, financial sector mix. Includes plaintext + hash formats. Auto-delivery via escrow. Tested 200 sample - 91% valid as of 6h ago. Price: 0.3 XMR for full list. PM for sample.',
    author: 'x0r_vendor',
    timestamp: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
    url: 'http://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion/post/a3f7e2b1',
    scraped_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    signal_score: 0.91,
    is_signal: true,
    has_credentials: true,
    has_ioc: false,
  },
  {
    id: 'b9c1d3e5f7a2',
    source: 'breachforums',
    forum_type: 'breach_forum',
    title: 'RDP access - Healthcare domain admin',
    body:
      'US hospital network, domain admin via ADFS exploit. Persistent access, AV excluded. Network has 3400 endpoints. Includes AD dump. Serious buyers only. Verification call available via encrypted VOIP. 0.8 BTC starting bid.',
    author: 'ghost_access',
    timestamp: new Date(Date.now() - 1.7 * 60 * 60 * 1000).toISOString(),
    url: 'http://breached65xqh64s7xbkvqgg7bmj4nj7656hfxq7zf7vfkivhkdqyd.onion/thread/b9c1d3e5',
    scraped_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    signal_score: 0.87,
    is_signal: true,
    has_credentials: true,
    has_ioc: true,
  },
  {
    id: 'c2e4f6a8b0d1',
    source: 'telegram',
    forum_type: 'messaging',
    title: '',
    body:
      'слив базы ecommerce India - 1.2M записей. ФИО, email, телефон, ДР, частичный CVV. Гарантия свежести - декабрь 2024. Продаю: $180 за полный дамп. Образец: 1000 строк по запросу.',
    author: 'sliv_baza',
    timestamp: new Date(Date.now() - 4.2 * 60 * 60 * 1000).toISOString(),
    url: '',
    scraped_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    signal_score: 0.83,
    is_signal: true,
    has_credentials: true,
    has_ioc: false,
  },
  {
    id: 'd5f7b1c9e3a4',
    source: 'paste_site',
    forum_type: 'paste',
    title: 'IOC List - Active phishing C2 March 2025',
    body:
      '# Active C2 IPs (banking phishing campaign)\n185.220.101.47\n195.123.241.88\n45.142.212.100\n194.165.16.78\n# Domains\nhdfc-secure-verify[.]xyz\nsbi-otp-confirm[.]net\nicici-alert-portal[.]cc\n# Campaign targets Indian banking customers via fake OTP pages',
    author: 'anonymous',
    timestamp: new Date(Date.now() - 8.5 * 60 * 60 * 1000).toISOString(),
    url: 'http://pastelo3afkpkjsbw3apuodjfmfzf7kxhzpqm5a6oa37v4qf3c7id.onion/raw/d5f7b1c9',
    scraped_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    signal_score: 0.76,
    is_signal: true,
    has_credentials: false,
    has_ioc: true,
  },
  {
    id: 'e8a2b4c6d0f5',
    source: 'dread',
    forum_type: 'darknet_forum',
    title: 'Proof of access - major EU logistics company',
    body:
      'DarkShift group here. We have fully compromised [REDACTED] logistics. 340GB staging. File tree in screenshot. Time sensitive - 7 days to pay before public release. Internal comms, contracts, 12k employee records, financials Q1-Q3 2024.',
    author: 'darkshift_official',
    timestamp: new Date(Date.now() - 11.3 * 60 * 60 * 1000).toISOString(),
    url: 'http://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion/post/e8a2b4c6',
    scraped_at: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
    signal_score: 0.94,
    is_signal: true,
    has_credentials: true,
    has_ioc: false,
  },
];

const now = Date.now();
export const FALLBACK_TIME_SERIES: TimeSeriesPoint[] = Array.from({ length: 24 }, (_, index) => {
  const t = new Date(now - (23 - index) * 7 * 60 * 1000);
  const baseLoad = 60 + Math.sin((index / 24) * Math.PI) * 40;
  const spike = index === 8 || index === 17 ? 45 : 0;
  const noise = Math.floor((index * 11) % 18);
  const total = Math.floor(baseLoad + spike + noise);
  const signals = Math.floor(total * (0.14 + ((index % 5) * 0.018)));
  const critical = index >= 20 ? index % 3 : 0;
  const high = (index * 3) % 5;
  const medium = (index * 5) % 9;
  const low = (index * 7) % 7;
  return {
    time: t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    total_posts: total,
    signals,
    critical,
    high,
    medium,
    low,
  };
});

export const FALLBACK_SOURCE_BREAKDOWN: ReportSourceBreakdown[] = [
  { source: 'dread', total_posts: 743, signal_posts: 127, cred_posts: 38, ioc_posts: 54 },
  { source: 'breachforums', total_posts: 521, signal_posts: 98, cred_posts: 31, ioc_posts: 41 },
  { source: 'telegram', total_posts: 389, signal_posts: 61, cred_posts: 14, ioc_posts: 28 },
  { source: 'paste_site', total_posts: 194, signal_posts: 26, cred_posts: 6, ioc_posts: 11 },
];

export const FALLBACK_MIRROR_POSTS: MirrorPost[] = [
  {
    id: 'mp_001',
    body:
      '[Target org] employee database leaked. 2,300 records including email, department, manager name, and internal phone extension. Verified by cross-referencing with public LinkedIn data. Available for $120.',
    source: 'breachforums',
    author: 'data_xfer_99',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    url: 'http://breached65xqh64s7xbkvqgg7bmj4nj7656hfxq7zf7vfkivhkdqyd.onion/thread/mp001',
    match_type: 'exact',
    has_credentials: false,
    has_ioc: false,
    credentials_found: 0,
    iocs_found: 0,
    similarity: 1,
    forum_type: 'breach_forum',
    title: 'Employee directory leak',
    scraped_at: new Date(Date.now() - 5.8 * 60 * 60 * 1000).toISOString(),
    signal_score: 0.82,
    is_signal: true,
  },
  {
    id: 'mp_002',
    body:
      'Selling access logs from major corporate VPN - includes traffic for [Target org] subsidiary. 14-day log window. SSH tunnel included. Contact via Jabber only.',
    source: 'dread',
    author: 'tunnel_rats',
    timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    url: 'http://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion/post/mp002xx',
    match_type: 'exact',
    has_credentials: true,
    has_ioc: false,
    credentials_found: 3,
    iocs_found: 0,
    similarity: 1,
    forum_type: 'darknet_forum',
    title: 'VPN logs for sale',
    scraped_at: new Date(Date.now() - 13.5 * 60 * 60 * 1000).toISOString(),
    signal_score: 0.88,
    is_signal: true,
  },
  {
    id: 'mp_003',
    body:
      'Anyone have fresh data on [Target org] infra? Looking for AD creds or cloud access. Willing to pay 0.5 XMR for verified admin access. DM me.',
    source: 'dread',
    author: 'xpl0it_buyer',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'http://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion/post/mp003yy',
    match_type: 'semantic',
    has_credentials: false,
    has_ioc: false,
    credentials_found: 0,
    iocs_found: 0,
    similarity: 0.81,
    forum_type: 'darknet_forum',
    title: 'Wanted: target org access',
    scraped_at: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
    signal_score: 0.74,
    is_signal: true,
  },
];

export const FALLBACK_FEEDBACK_STATS: FeedbackStats = {
  stats: { real: 67, noise: 23, unsure: 8 },
  total_labels: 98,
  accuracy_signal: 'Strong signal quality (68% real) - flywheel healthy',
};

export const FALLBACK_DASHBOARD: DashboardResponse = {
  stats: FALLBACK_STATS,
  recent_alerts: FALLBACK_ALERTS,
  recent_signals: FALLBACK_SIGNALS,
};
