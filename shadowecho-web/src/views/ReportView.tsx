// src/views/ReportView.tsx
import React, { useState, useRef } from 'react';
import { generateReport } from '../services/api';
import type { ReportRequest, ReportResponse } from '../types/api';

const SEV_STYLE: Record<string, { text: string; bg: string; border: string }> = {
  critical: { text: '#dc2626', bg: 'rgba(220,38,38,0.07)',  border: 'rgba(220,38,38,0.22)' },
  high:     { text: '#ea580c', bg: 'rgba(234,88,12,0.07)',  border: 'rgba(234,88,12,0.22)' },
  medium:   { text: '#d97706', bg: 'rgba(217,119,6,0.07)',  border: 'rgba(217,119,6,0.22)' },
  low:      { text: '#16a34a', bg: 'rgba(22,163,74,0.07)',  border: 'rgba(22,163,74,0.22)' },
};

interface ReportTemplate {
  id: string; label: string; description: string; icon: string;
  timeframe: string; focus: string; include_recommendations: boolean;
  accentColor: string; accentBg: string; accentBorder: string; badge: string;
}

const TEMPLATES: ReportTemplate[] = [
  { id: 'executive',   label: 'Executive Brief',       description: 'CISO-ready summary — risk posture, active threats, unacknowledged alerts.',                              icon: '◈', timeframe: '24h', focus: 'executive risk posture, top threats, unacknowledged alerts and immediate action items for CISO',                                    include_recommendations: true,  accentColor: '#1d4ed8', accentBg: 'rgba(29,78,216,0.05)',   accentBorder: 'rgba(29,78,216,0.18)',  badge: '24h' },
  { id: 'critical',    label: 'Critical Incidents',     description: 'All critical and high severity alerts — active threats requiring immediate response.',                   icon: '■', timeframe: '7d',  focus: 'critical and high severity alerts, active attack indicators, immediate threat response',                                                include_recommendations: true,  accentColor: '#dc2626', accentBg: 'rgba(220,38,38,0.05)',   accentBorder: 'rgba(220,38,38,0.18)', badge: '7d'  },
  { id: 'credentials', label: 'Credential Breach',      description: 'Credential leaks, password dumps, and stolen access intelligence across all sources.',                  icon: '⬡', timeframe: '7d',  focus: 'credential theft, leaked passwords, credential dumps, stolen sessions and API keys',                                                       include_recommendations: true,  accentColor: '#ea580c', accentBg: 'rgba(234,88,12,0.05)',   accentBorder: 'rgba(234,88,12,0.18)', badge: '7d'  },
  { id: 'actor',       label: 'Threat Actor Intel',     description: 'Behavioral fingerprints, actor clusters, writing patterns and escalation stages.',                       icon: '◉', timeframe: '30d', focus: 'threat actor fingerprinting, behavioral patterns, actor clusters, escalation stages and identity signals',                                  include_recommendations: false, accentColor: '#7c3aed', accentBg: 'rgba(124,58,237,0.05)',  accentBorder: 'rgba(124,58,237,0.18)',badge: '30d' },
  { id: 'ioc',         label: 'IOC Intelligence',       description: 'All indicators of compromise — IPs, domains, hashes, malware signatures across dark web.',               icon: '△', timeframe: '7d',  focus: 'indicators of compromise, malicious IPs, domains, file hashes, malware signatures and exploit kits',                                       include_recommendations: false, accentColor: '#d97706', accentBg: 'rgba(217,119,6,0.05)',   accentBorder: 'rgba(217,119,6,0.18)', badge: '7d'  },
  { id: 'full',        label: 'Full Incident Report',   description: 'Complete threat landscape — all sources, all actors, all signals with full recommendations.',            icon: '◬', timeframe: '30d', focus: 'complete threat landscape, all active campaigns, source quality, signal trends and strategic recommendations',                             include_recommendations: true,  accentColor: '#16a34a', accentBg: 'rgba(22,163,74,0.05)',   accentBorder: 'rgba(22,163,74,0.18)', badge: '30d' },
];

// ── Shared micro-components ───────────────────────────────────────────────────

const Spin: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin .7s linear infinite', flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const SevPill: React.FC<{ sev?: string }> = ({ sev = 'low' }) => {
  const s = SEV_STYLE[sev] ?? SEV_STYLE.low;
  return (
    <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:4, fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', background:s.bg, color:s.text, border:`1px solid ${s.border}`, whiteSpace:'nowrap' }}>
      {sev}
    </span>
  );
};

const SecHead: React.FC<{ title: string; sub?: string; accent?: string; right?: React.ReactNode }> = ({ title, sub, accent = '#1d4ed8', right }) => (
  <div style={{ padding:'13px 18px', borderBottom:'1px solid var(--border-soft)', background:'var(--bg-sunken)', display:'flex', alignItems:'center', gap:10 }}>
    <div style={{ width:3, height:16, background:accent, borderRadius:99, flexShrink:0 }} />
    <span style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:700, color:'var(--text-1)' }}>{title}</span>
    {sub && <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-4)', letterSpacing:'0.06em' }}>{sub}</span>}
    {right && <div style={{ marginLeft:'auto' }}>{right}</div>}
  </div>
);

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', boxShadow:'var(--shadow-card)', overflow:'hidden', ...style }}>
    {children}
  </div>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding:'16px 18px' }}>{children}</div>
);

// ── Template card ─────────────────────────────────────────────────────────────

const TplCard: React.FC<{ tpl: ReportTemplate; loading: boolean; active: boolean; onGen: (t: ReportTemplate) => void }> = ({ tpl, loading, active, onGen }) => (
  <div style={{
    background: active ? tpl.accentBg : '#fff',
    border: `1px solid ${active ? tpl.accentBorder : 'var(--border)'}`,
    borderRadius: 'var(--r-lg)',
    padding: '18px 18px 14px',
    display: 'flex', flexDirection: 'column', gap: 10,
    boxShadow: active ? `0 0 0 2px ${tpl.accentBorder}, var(--shadow-card)` : 'var(--shadow-card)',
    transition: 'all .2s', position: 'relative', overflow: 'hidden',
    cursor: loading ? 'not-allowed' : 'default',
  }}>
    <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background: active ? tpl.accentColor : 'transparent', transition:'background .2s' }} />

    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <span style={{ fontSize:20, lineHeight:1 }}>{tpl.icon}</span>
        <p style={{ fontFamily:'var(--font-sans)', fontSize:13.5, fontWeight:700, color: active ? tpl.accentColor : 'var(--text-1)', transition:'color .2s', lineHeight:1.2 }}>
          {tpl.label}
        </p>
      </div>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:700, letterSpacing:'0.1em', padding:'2px 7px', borderRadius:4, background: active ? tpl.accentBg : 'var(--bg-sunken)', color: active ? tpl.accentColor : 'var(--text-3)', border:`1px solid ${active ? tpl.accentBorder : 'var(--border)'}`, whiteSpace:'nowrap', transition:'all .2s' }}>
        {tpl.badge}
      </span>
    </div>

    <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--text-3)', lineHeight:1.55, flex:1 }}>
      {tpl.description}
    </p>

    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
      {tpl.include_recommendations && (
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-4)' }}>✓ Recs</span>
      )}
      <button
        onClick={() => onGen(tpl)}
        disabled={loading}
        style={{
          marginLeft:'auto',
          background: loading && active ? 'var(--bg-elevated)' : tpl.accentColor,
          border:'none', borderRadius:'var(--r)', color:'#fff',
          fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600,
          padding:'6px 13px', cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading && !active ? 0.35 : 1,
          display:'flex', alignItems:'center', gap:5,
          transition:'opacity .15s',
          whiteSpace: 'nowrap',
        }}
      >
        {loading && active ? <><Spin size={13} /> Generating…</> : '↗ Generate'}
      </button>
    </div>
  </div>
);

// ── Skeleton loader ───────────────────────────────────────────────────────────

const Skeleton: React.FC<{ tpl: ReportTemplate }> = ({ tpl }) => (
  <Card style={{ animation:'fadeIn .3s ease' }}>
    <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border-soft)', background:'var(--bg-sunken)', display:'flex', alignItems:'center', gap:12 }}>
      <Spin size={16} />
      <div>
        <p style={{ fontFamily:'var(--font-sans)', fontSize:13.5, fontWeight:700, color:'var(--text-1)' }}>Generating {tpl.label}</p>
        <p style={{ fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--text-4)', marginTop:2 }}>Calling LLM + gathering intelligence data…</p>
      </div>
      <div style={{ marginLeft:'auto', width:8, height:8, borderRadius:'50%', background:tpl.accentColor, boxShadow:`0 0 10px ${tpl.accentColor}`, animation:'pulse 1.4s ease-in-out infinite' }} />
    </div>
    <P>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {[80, 55, 90, 40, 68, 75].map((w, i) => (
          <div key={i} style={{
            height:13, width:`${w}%`, borderRadius:4,
            background:'linear-gradient(90deg,var(--bg-elevated) 0%,var(--bg-card) 50%,var(--bg-elevated) 100%)',
            backgroundSize:'400px 100%',
            animation:`shimmer 1.6s linear ${i * 0.1}s infinite`,
          }} />
        ))}
      </div>
    </P>
  </Card>
);

// ── Overview grid ─────────────────────────────────────────────────────────────

const OvGrid: React.FC<{ ov: NonNullable<ReportResponse['overview']> }> = ({ ov }) => {
  const items = [
    { label:'Total Posts',   value: ov.total_posts?.toLocaleString()  ?? '—', color:'#1d4ed8' },
    { label:'Signal Posts',  value: ov.signal_posts?.toLocaleString() ?? '—', color:'#16a34a' },
    { label:'Signal Rate',   value: `${ov.signal_rate_pct ?? 0}%`,            color:'#16a34a' },
    { label:'Noise Filtered',value: ov.noise_filtered?.toLocaleString() ?? '—',color:'#6b7280' },
    { label:'Total Alerts',  value: ov.total_alerts?.toLocaleString()  ?? '—', color:'#d97706' },
    { label:'Unacked',       value: ov.unacknowledged_alerts?.toLocaleString() ?? '—', color:'#dc2626' },
    { label:'Cred Posts',    value: ov.credential_posts?.toLocaleString() ?? '—', color:'#ea580c' },
    { label:'IOC Posts',     value: ov.ioc_posts?.toLocaleString() ?? '—',    color:'#7c3aed' },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
      {items.map(it => (
        <div key={it.label} style={{ background:'var(--bg-sunken)', border:'1px solid var(--border)', borderRadius:'var(--r)', borderTop:`3px solid ${it.color}`, padding:'11px 13px' }}>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-4)', marginBottom:5 }}>{it.label}</p>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:20, fontWeight:800, color:it.color, lineHeight:1 }}>{it.value}</p>
        </div>
      ))}
    </div>
  );
};

const SevBar: React.FC<{ counts: Record<string,number>; total: number }> = ({ counts, total }) => {
  const sevs = ['critical','high','medium','low'] as const;
  return (
    <div>
      <p style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-4)', marginBottom:7 }}>Alert Distribution</p>
      <div style={{ height:7, borderRadius:99, overflow:'hidden', display:'flex', background:'var(--bg-elevated)', marginBottom:8 }}>
        {sevs.map(sev => {
          const pct = total > 0 ? (counts[sev] ?? 0) / total * 100 : 0;
          return pct > 0 ? <div key={sev} style={{ width:`${pct}%`, background:SEV_STYLE[sev].text }} /> : null;
        })}
      </div>
      <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
        {sevs.map(sev => (
          <span key={sev} style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-3)', display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:8, height:8, borderRadius:2, background:SEV_STYLE[sev].text, display:'inline-block' }} />
            {sev} <strong style={{ color:SEV_STYLE[sev].text }}>{counts[sev] ?? 0}</strong>
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Source table ──────────────────────────────────────────────────────────────

const SrcTable: React.FC<{ sources: NonNullable<ReportResponse['source_breakdown']> }> = ({ sources }) => (
  <div style={{ overflow:'hidden', borderRadius:'var(--r)', border:'1px solid var(--border)' }}>
    <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-mono)', fontSize:12 }}>
      <thead>
        <tr style={{ background:'var(--bg-sunken)', borderBottom:'1px solid var(--border)' }}>
          {['Source','Posts','Signals','Signal %','Credentials','IOCs'].map(h => (
            <th key={h} style={{ padding:'9px 13px', textAlign:'left', fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-4)', fontWeight:600 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sources.map((s, i) => {
          const pct = s.total_posts > 0 ? ((s.signal_posts / s.total_posts) * 100).toFixed(0) : '0';
          return (
            <tr key={i} style={{ borderBottom:'1px solid var(--border-soft)' }}>
              <td style={{ padding:'9px 13px', fontWeight:700, color:'#1d4ed8' }}>{s.source}</td>
              <td style={{ padding:'9px 13px', color:'var(--text-1)' }}>{s.total_posts}</td>
              <td style={{ padding:'9px 13px', color:'#16a34a', fontWeight:600 }}>{s.signal_posts}</td>
              <td style={{ padding:'9px 13px', color:'var(--text-3)' }}>{pct}%</td>
              <td style={{ padding:'9px 13px', color:'#ea580c' }}>{s.cred_posts}</td>
              <td style={{ padding:'9px 13px', color:'#dc2626' }}>{s.ioc_posts}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// ── Alert row ─────────────────────────────────────────────────────────────────

type AlertItem = { id?: number; severity?: string; title?: string; summary?: string; confidence?: number; alert_type?: string; acknowledged?: boolean; created_at?: string };

const ARow: React.FC<{ a: AlertItem }> = ({ a }) => {
  const s = SEV_STYLE[a.severity ?? 'low'] ?? SEV_STYLE.low;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 13px', borderBottom:'1px solid var(--border-soft)', borderLeft:`3px solid ${s.text}`, background: a.acknowledged ? 'transparent' : s.bg, opacity: a.acknowledged ? 0.5 : 1 }}>
      <SevPill sev={a.severity} />
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, color:'var(--text-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.title || 'Untitled'}</p>
        {a.summary && <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-4)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.summary.slice(0,100)}</p>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        {a.alert_type && <span style={{ fontFamily:'var(--font-mono)', fontSize:10, padding:'1px 6px', border:'1px solid var(--border)', borderRadius:4, color:'var(--text-4)', background:'var(--bg-sunken)' }}>{a.alert_type}</span>}
        <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:s.text }}>{Math.round((a.confidence ?? 0) * 100)}%</span>
        {a.created_at && <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-4)' }}>{a.created_at.slice(0,16).replace('T',' ')}</span>}
        {a.acknowledged && <span style={{ color:'#16a34a', fontSize:11 }}>✓</span>}
      </div>
    </div>
  );
};

// ── Signal card ───────────────────────────────────────────────────────────────

type SigItem = { id?: string; source?: string; author?: string; snippet?: string; signal_score?: number; has_credentials?: boolean; has_ioc?: boolean };

const SigCard: React.FC<{ p: SigItem }> = ({ p }) => (
  <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'11px 13px', background:'#fff' }}>
    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:7, flexWrap:'wrap' }}>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:11, padding:'2px 7px', background:'rgba(29,78,216,0.07)', color:'#1d4ed8', border:'1px solid rgba(29,78,216,0.18)', borderRadius:4 }}>{p.source}</span>
      {p.author && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-4)' }}>@{p.author}</span>}
      <span style={{ marginLeft:'auto', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'#16a34a' }}>{p.signal_score}</span>
      {p.has_credentials && <span style={{ fontFamily:'var(--font-mono)', fontSize:10, padding:'1px 6px', background:'rgba(234,88,12,0.08)', color:'#ea580c', border:'1px solid rgba(234,88,12,0.18)', borderRadius:4 }}>CREDS</span>}
      {p.has_ioc && <span style={{ fontFamily:'var(--font-mono)', fontSize:10, padding:'1px 6px', background:'rgba(220,38,38,0.08)', color:'#dc2626', border:'1px solid rgba(220,38,38,0.18)', borderRadius:4 }}>IOC</span>}
    </div>
    <p style={{ fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--text-3)', lineHeight:1.6, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.snippet}</p>
  </div>
);

// ── Export button ─────────────────────────────────────────────────────────────

// ─── PDF generator ────────────────────────────────────────────────────────────

function buildPDFHTML(report: ReportResponse, tplLabel: string): string {
  const ov = report.overview;
  const fmt = (n?: number) => n?.toLocaleString() ?? '—';
  const sevColor: Record<string, string> = { critical:'#dc2626', high:'#ea580c', medium:'#d97706', low:'#16a34a' };

  const critRows = (report.critical_alerts ?? []).map(a =>
    `<tr><td style="color:${sevColor[a.severity??'low']};font-weight:700">${(a.severity??'').toUpperCase()}</td><td>${a.title ?? ''}</td><td>${Math.round((a.confidence??0)*100)}%</td><td>${(a.created_at??'').slice(0,16).replace('T',' ')}</td></tr>`
  ).join('');

  const sigRows = (report.top_signals ?? []).map(p =>
    `<tr><td>${p.source??''}</td><td>@${p.author??''}</td><td style="color:#16a34a;font-weight:700">${p.signal_score}</td><td>${p.has_credentials?'<span class="tag cred">CREDS</span>':''}${p.has_ioc?'<span class="tag ioc">IOC</span>':''}</td></tr>`
  ).join('');

  const srcRows = (report.source_breakdown ?? []).map(s =>
    `<tr><td style="font-weight:700;color:#1d4ed8">${s.source}</td><td>${s.total_posts}</td><td style="color:#16a34a">${s.signal_posts}</td><td style="color:#ea580c">${s.cred_posts}</td><td style="color:#dc2626">${s.ioc_posts}</td></tr>`
  ).join('');

  const recRows = (report.recommendations ?? []).map((r: string, i: number) =>
    `<div class="rec"><span class="rec-num">${i+1}.</span><span>${r}</span></div>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${report.title ?? 'ShadowEcho Report'}</title>
<style>
  @page { size: A4; margin: 20mm 18mm; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 11pt; color: #111827; background: #fff; }
  h1  { font-size: 20pt; font-weight: 800; color: #1d4ed8; letter-spacing: -0.02em; margin-bottom: 4px; }
  h2  { font-size: 12pt; font-weight: 700; color: #111827; margin: 20px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #e5e7eb; }
  h3  { font-size: 10pt; font-weight: 700; color: #374151; margin-bottom: 4px; }
  p   { font-size: 10.5pt; line-height: 1.65; color: #374151; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 3px solid #1d4ed8; margin-bottom: 20px; }
  .header-meta { font-size: 9pt; color: #6b7280; font-family: monospace; line-height: 1.7; }
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
  .stat { background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; border-top: 3px solid #1d4ed8; }
  .stat-val { font-size: 18pt; font-weight: 800; color: #1d4ed8; line-height: 1; }
  .stat-lbl { font-size: 8pt; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; font-family: monospace; }
  .sev-bar { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
  .sev-pill { font-size: 8pt; font-weight: 700; padding: 3px 8px; border-radius: 3px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.08em; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 8px; }
  th { background: #f8f9fa; padding: 7px 10px; text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; border-bottom: 1px solid #e5e7eb; font-family: monospace; }
  td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; font-family: monospace; }
  tr:last-child td { border-bottom: none; }
  .exec { background: #f0f4ff; border-left: 4px solid #1d4ed8; padding: 12px 16px; border-radius: 0 6px 6px 0; font-size: 10.5pt; line-height: 1.7; color: #374151; white-space: pre-wrap; }
  .rec { display: flex; gap: 10px; padding: 9px 12px; background: #f0fdf4; border: 1px solid rgba(22,163,74,0.2); border-radius: 5px; margin-bottom: 6px; font-size: 10pt; }
  .rec-num { font-weight: 800; color: #16a34a; flex-shrink: 0; width: 18px; font-family: monospace; }
  .tag { font-size: 8pt; font-weight: 700; padding: 1px 5px; border-radius: 3px; margin-right: 3px; font-family: monospace; text-transform: uppercase; }
  .tag.cred { background: rgba(234,88,12,0.1); color: #ea580c; }
  .tag.ioc  { background: rgba(220,38,38,0.1); color: #dc2626; }
  .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 8pt; color: #9ca3af; font-family: monospace; display: flex; justify-content: space-between; }
  .page-break { page-break-before: always; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>ShadowEcho</h1>
      <div style="font-size:13pt;font-weight:700;color:#374151;margin-top:2px">${tplLabel}</div>
    </div>
    <div class="header-meta">
      <div><strong>Generated:</strong> ${new Date(report.generated_at ?? '').toLocaleString()}</div>
      ${report.org_name ? `<div><strong>Organization:</strong> ${report.org_name}</div>` : ''}
      <div><strong>Timeframe:</strong> ${report.timeframe ?? '—'}</div>
      ${report.duration_ms ? `<div><strong>Analysis time:</strong> ${report.duration_ms}ms</div>` : ''}
    </div>
  </div>

  ${ov ? `
  <h2>Threat Posture Overview</h2>
  <div class="stat-grid">
    <div class="stat" style="border-top-color:#1d4ed8"><div class="stat-val">${fmt(ov.total_posts)}</div><div class="stat-lbl">Total Posts</div></div>
    <div class="stat" style="border-top-color:#16a34a"><div class="stat-val">${fmt(ov.signal_posts)}</div><div class="stat-lbl">Signal Posts (${ov.signal_rate_pct??0}%)</div></div>
    <div class="stat" style="border-top-color:#d97706"><div class="stat-val">${fmt(ov.total_alerts)}</div><div class="stat-lbl">Total Alerts</div></div>
    <div class="stat" style="border-top-color:#dc2626"><div class="stat-val">${fmt(ov.unacknowledged_alerts)}</div><div class="stat-lbl">Unacknowledged</div></div>
    <div class="stat" style="border-top-color:#ea580c"><div class="stat-val">${fmt(ov.credential_posts)}</div><div class="stat-lbl">Cred Posts</div></div>
    <div class="stat" style="border-top-color:#7c3aed"><div class="stat-val">${fmt(ov.ioc_posts)}</div><div class="stat-lbl">IOC Posts</div></div>
    <div class="stat" style="border-top-color:#6b7280"><div class="stat-val">${fmt(ov.noise_filtered)}</div><div class="stat-lbl">Noise Filtered</div></div>
    <div class="stat" style="border-top-color:#1d4ed8"><div class="stat-val">${ov.signal_rate_pct??0}%</div><div class="stat-lbl">Signal Rate</div></div>
  </div>
  ${ov.alerts_by_severity ? `<div class="sev-bar">
    ${['critical','high','medium','low'].map(s => `<span class="sev-pill" style="background:${sevColor[s]}22;color:${sevColor[s]};border:1px solid ${sevColor[s]}44">${s.toUpperCase()} ${ov.alerts_by_severity![s]??0}</span>`).join('')}
  </div>` : ''}
  ` : ''}

  ${report.executive_summary ? `<h2>Executive Summary</h2><div class="exec">${report.executive_summary}</div>` : ''}

  ${critRows ? `<h2>Critical Alerts</h2>
  <table><thead><tr><th>Severity</th><th>Title</th><th>Confidence</th><th>Timestamp</th></tr></thead><tbody>${critRows}</tbody></table>` : ''}

  ${sigRows ? `<div class="page-break"></div><h2>Top Signals</h2>
  <table><thead><tr><th>Source</th><th>Author</th><th>Score</th><th>Flags</th></tr></thead><tbody>${sigRows}</tbody></table>` : ''}

  ${srcRows ? `<h2>Source Intelligence</h2>
  <table><thead><tr><th>Source</th><th>Posts</th><th>Signals</th><th>Credentials</th><th>IOCs</th></tr></thead><tbody>${srcRows}</tbody></table>` : ''}

  ${recRows ? `<h2>Analyst Recommendations</h2><div>${recRows}</div>` : ''}

  <div class="footer">
    <span>ShadowEcho — Dark Web Threat Intelligence Platform v1.2.0</span>
    <span>Confidential · For internal use only</span>
  </div>
</body>
</html>`;
}

function exportToPDF(report: ReportResponse, tplLabel: string): void {
  const html = buildPDFHTML(report, tplLabel);
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { alert('Pop-up blocked — please allow pop-ups for this site.'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 600);
}

const ExportBtn: React.FC<{ report: ReportResponse; tplLabel: string }> = ({ report, tplLabel }) => (
  <button
    onClick={() => exportToPDF(report, tplLabel)}
    style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:'var(--r)', color:'var(--text-2)', fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, padding:'6px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:5, transition:'all .15s' }}
    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='var(--border-med)'; (e.currentTarget as HTMLButtonElement).style.background='var(--bg-elevated)'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='var(--border)'; (e.currentTarget as HTMLButtonElement).style.background='transparent'; }}
  >
    ↓ Export PDF
  </button>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const ReportView: React.FC = () => {
  const [activeId,    setActiveId]    = useState<string | null>(null);
  const [loadingId,   setLoadingId]   = useState<string | null>(null);
  const [report,      setReport]      = useState<ReportResponse | null>(null);
  const [activePayload, setActivePayload] = useState<ReportRequest | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [orgName,     setOrgName]     = useState('');
  const outputRef = useRef<HTMLDivElement>(null);

  const generate = async (tpl: ReportTemplate) => {
    setLoadingId(tpl.id); setActiveId(tpl.id);
    setError(null); setReport(null);
    const payload: ReportRequest = {
      org_name: orgName.trim() || undefined,
      timeframe: tpl.timeframe,
      focus: tpl.focus,
      include_recommendations: tpl.include_recommendations,
    };
    setActivePayload(payload);
    try {
      const data = await generateReport(payload);
      setReport(data);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally { setLoadingId(null); }
  };

  const isLoading = loadingId !== null;
  const activeTpl = TEMPLATES.find(t => t.id === activeId);
  const ov = report?.overview;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, animation:'fadeUp .3s ease' }}>

      {/* Header */}
      <div style={{ borderBottom:'1px solid var(--border)', paddingBottom:20 }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-sans)', fontSize:26, fontWeight:800, color:'var(--text-1)', letterSpacing:'-0.02em', lineHeight:1.1 }}>Report Generator</h1>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-4)', marginTop:6, letterSpacing:'0.06em' }}>
              One-click intelligence reports · powered by live ShadowEcho data
            </p>
          </div>
          <input
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            placeholder="Filter by org name (optional)"
            style={{ fontFamily:'var(--font-mono)', fontSize:12, padding:'8px 12px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--bg-sunken)', color:'var(--text-1)', outline:'none', width:220, transition:'border-color .15s' }}
            onFocus={e => { e.currentTarget.style.borderColor='#1d4ed8'; }}
            onBlur={e => { e.currentTarget.style.borderColor='var(--border)'; }}
          />
        </div>
      </div>

      {/* Template cards */}
      <div>
        <p style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-4)', marginBottom:12 }}>
          ◈ Select a report type to generate instantly
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {TEMPLATES.map(tpl => (
            <TplCard key={tpl.id} tpl={tpl} loading={isLoading} active={activeId === tpl.id} onGen={generate} />
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding:'11px 15px', background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.18)', borderRadius:'var(--r)', fontFamily:'var(--font-mono)', fontSize:12.5, color:'#dc2626', display:'flex', gap:8, alignItems:'center' }}>
          ⚠ {error}
        </div>
      )}

      {/* Skeleton */}
      {isLoading && activeTpl && <Skeleton tpl={activeTpl} />}

      {/* Report output */}
      {report && !isLoading && (
        <div ref={outputRef} style={{ display:'flex', flexDirection:'column', gap:14, animation:'slideUp .35s ease forwards' }}>

          {/* Banner */}
          <div style={{ padding:'15px 18px', background: activeTpl ? activeTpl.accentBg : 'rgba(29,78,216,0.05)', border:`1px solid ${activeTpl ? activeTpl.accentBorder : 'rgba(29,78,216,0.15)'}`, borderRadius:'var(--r-lg)', display:'flex', alignItems:'center', gap:13, flexWrap:'wrap' }}>
            {activeTpl && <span style={{ fontSize:22 }}>{activeTpl.icon}</span>}
            <div style={{ flex:1 }}>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:15, fontWeight:800, color:'var(--text-1)', letterSpacing:'-0.01em' }}>{report.title ?? 'Intelligence Report'}</p>
              <div style={{ display:'flex', gap:14, marginTop:3, flexWrap:'wrap' }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--text-4)' }}>{new Date(report.generated_at ?? '').toLocaleString()}</span>
                {report.org_name && <span style={{ fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--text-3)' }}>· Org: <strong>{report.org_name}</strong></span>}
                {report.duration_ms && <span style={{ fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--text-4)' }}>· {report.duration_ms}ms</span>}
              </div>
            </div>
            {activePayload && activeTpl && <ExportBtn report={report} tplLabel={activeTpl.label} />}
          </div>

          {/* 1. Overview */}
          {ov && (
            <Card>
              <SecHead title="Threat Posture Overview" sub="live from db" accent={activeTpl?.accentColor}
                right={<span style={{ fontFamily:'var(--font-mono)', fontSize:10, padding:'2px 8px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:4, color:'var(--text-4)' }}>{report.timeframe}</span>}
              />
              <P>
                <OvGrid ov={ov} />
                {ov.alerts_by_severity && <SevBar counts={ov.alerts_by_severity} total={ov.total_alerts ?? 0} />}
                {ov.posts_by_source && Object.keys(ov.posts_by_source).length > 0 && (
                  <div style={{ marginTop:16 }}>
                    <p style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-4)', marginBottom:7 }}>Posts by Source</p>
                    <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                      {Object.entries(ov.posts_by_source).map(([src, cnt]) => (
                        <span key={src} style={{ fontFamily:'var(--font-mono)', fontSize:11.5, padding:'4px 10px', background:'var(--bg-sunken)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', color:'var(--text-2)' }}>
                          {src} <strong style={{ color:'#1d4ed8' }}>{String(cnt)}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </P>
            </Card>
          )}

          {/* 2. Executive Summary */}
          {report.executive_summary && (
            <Card>
              <SecHead title="Executive Summary" sub="LLM-generated" accent={activeTpl?.accentColor} />
              <P>
                <div style={{ borderLeft:`4px solid ${activeTpl?.accentColor ?? '#1d4ed8'}`, paddingLeft:16 }}>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:13.5, lineHeight:1.75, color:'var(--text-2)', whiteSpace:'pre-wrap' }}>
                    {report.executive_summary}
                  </p>
                </div>
              </P>
            </Card>
          )}

          {/* 3. Critical Alerts */}
          {report.critical_alerts && report.critical_alerts.length > 0 && (
            <Card>
              <SecHead title="Critical Alerts" sub={`${report.critical_alerts.length} incidents`} accent="#dc2626" />
              <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r)', margin:'14px 16px', overflow:'hidden' }}>
                {report.critical_alerts.map((a, i) => <ARow key={a.id ?? i} a={a} />)}
              </div>
            </Card>
          )}

          {/* 4. Signals + IOCs */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {report.top_signals && report.top_signals.length > 0 && (
              <Card>
                <SecHead title="Top Signals" sub={`${report.top_signals.length} highest`} accent="#16a34a" />
                <P><div style={{ display:'flex', flexDirection:'column', gap:8 }}>{report.top_signals.map((p, i) => <SigCard key={p.id ?? i} p={p} />)}</div></P>
              </Card>
            )}
            {report.ioc_highlights && report.ioc_highlights.length > 0 && (
              <Card>
                <SecHead title="IOC Highlights" sub="credentials & indicators" accent="#7c3aed" />
                <P><div style={{ display:'flex', flexDirection:'column', gap:8 }}>{report.ioc_highlights.map((p, i) => <SigCard key={p.id ?? i} p={p} />)}</div></P>
              </Card>
            )}
          </div>

          {/* 5. Source breakdown */}
          {report.source_breakdown && report.source_breakdown.length > 0 && (
            <Card>
              <SecHead title="Source Intelligence" sub="per-source breakdown" accent={activeTpl?.accentColor} />
              <P><SrcTable sources={report.source_breakdown} /></P>
            </Card>
          )}

          {/* 6. Recommendations */}
          {Array.isArray(report.recommendations) && report.recommendations.length > 0 && (
            <Card>
              <SecHead title="Analyst Recommendations" sub="actionable next steps" accent="#16a34a" />
              <P>
                <ol style={{ display:'flex', flexDirection:'column', gap:8, listStyle:'none' }}>
                  {report.recommendations.map((rec: string, i: number) => (
                    <li key={i} style={{ display:'flex', gap:12, padding:'10px 13px', background:'rgba(22,163,74,0.04)', border:'1px solid rgba(22,163,74,0.14)', borderRadius:'var(--r)' }}>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'#16a34a', flexShrink:0, width:18 }}>{i+1}.</span>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:13, lineHeight:1.6, color:'var(--text-2)' }}>{rec}</span>
                    </li>
                  ))}
                </ol>
              </P>
            </Card>
          )}

          {/* 7. Recent alerts */}
          {report.recent_alerts && report.recent_alerts.length > 0 && (
            <Card>
              <SecHead title="Recent Alerts" sub={`${report.recent_alerts.length} latest`} accent={activeTpl?.accentColor} />
              <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r)', margin:'14px 16px', overflow:'hidden', maxHeight:300, overflowY:'auto' }}>
                {report.recent_alerts.map((a, i) => <ARow key={a.id ?? i} a={a} />)}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportView;