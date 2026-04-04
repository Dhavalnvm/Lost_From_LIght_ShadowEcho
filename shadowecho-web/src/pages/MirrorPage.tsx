// src/pages/MirrorPage.tsx
import React from 'react';
import MirrorPanel from '../components/panels/MirrorPanel';

const F = { sans: 'var(--font-sans)', mono: 'var(--font-mono)' };

const HOW_IT_WORKS = [
  { icon: '◈', color: '#1d4ed8', title: 'Exact Match',       tag: 'SQLite',   desc: 'Searches all ingested posts for direct mentions of the organization name.' },
  { icon: '⬡', color: '#16a34a', title: 'Semantic Search',   tag: 'ChromaDB', desc: 'BGE-M3 vector similarity finds contextually related posts without explicit name.' },
  { icon: '◉', color: '#ea580c', title: 'Threat Enrichment', tag: 'Detector', desc: 'Each result is scanned for credentials and IOCs to surface highest-risk mentions.' },
];

const TIPS = [
  'Try partial names — "HDFC" finds more than "HDFC Bank Ltd."',
  'Semantic search catches aliases and abbreviations',
  'Posts with credentials or IOCs are flagged automatically',
  'Use the inline Lineup / Impact / Decode buttons per post',
];

const MirrorPage: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp .3s ease' }}>

    {/* ── Page header ──────────────────────────────────────────── */}
    <div style={{ paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: F.sans, fontSize: 26, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            The Mirror
          </h1>
          <p style={{ fontFamily: F.mono, fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6 }}>
            What threat actors say about any organization
          </p>
        </div>

        {/* Coverage badge */}
        <div style={{ padding: '10px 18px', border: '1px solid rgba(29,78,216,0.15)', background: 'rgba(29,78,216,0.04)', borderRadius: 8, textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: F.sans, fontSize: 24, fontWeight: 800, color: '#1d4ed8', lineHeight: 1 }}>30,586</div>
          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: '0.16em', color: 'var(--text-4)', marginTop: 4, textTransform: 'uppercase' }}>Posts in Index</div>
        </div>
      </div>
    </div>

    {/* ── Two-column grid ──────────────────────────────────────── */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 276px', gap: 20, alignItems: 'start' }}>

      {/* Main search panel */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 20px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 3, height: 16, background: '#1d4ed8', borderRadius: 99 }} />
          <span style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Organization Search</span>
          <span style={{ fontFamily: F.mono, fontSize: 10, color: 'var(--text-4)', letterSpacing: '0.06em', marginLeft: 4 }}>exact + semantic</span>
        </div>
        <MirrorPanel />
      </div>

      {/* Right sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 24 }}>

        {/* How it works */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-soft)', background: 'var(--bg-sunken)' }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.14em', color: 'var(--text-4)', textTransform: 'uppercase' }}>◈ How It Works</span>
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {HOW_IT_WORKS.map(item => (
              <div
                key={item.title}
                style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderLeft: `3px solid ${item.color}`, borderRadius: 6, transition: 'background .15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-sunken)'; }}
              >
                <span style={{ color: item.color, fontSize: 15, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{item.title}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 8, color: item.color, padding: '1px 5px', border: `1px solid ${item.color}33`, background: `${item.color}0d`, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 3 }}>{item.tag}</span>
                  </div>
                  <p style={{ fontFamily: F.mono, fontSize: 10.5, color: 'var(--text-4)', lineHeight: 1.55 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search tips */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-soft)', background: 'var(--bg-sunken)' }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.14em', color: 'var(--text-4)', textTransform: 'uppercase' }}>◈ Search Tips</span>
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TIPS.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: '#1d4ed8', flexShrink: 0, marginTop: 1, minWidth: 18 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontFamily: F.mono, fontSize: 10.5, color: 'var(--text-4)', lineHeight: 1.55 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Match types legend */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.14em', color: 'var(--text-4)', textTransform: 'uppercase', marginBottom: 10 }}>◈ Match Types</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { type: 'EXACT',    color: '#dc2626', bg: 'rgba(220,38,38,0.07)', border: 'rgba(220,38,38,0.22)', desc: 'Direct name found in post body' },
              { type: 'SEMANTIC', color: '#1d4ed8', bg: 'rgba(29,78,216,0.07)', border: 'rgba(29,78,216,0.22)', desc: 'Contextually related via embeddings' },
            ].map(m => (
              <div key={m.type} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: m.color, padding: '2px 7px', border: `1px solid ${m.border}`, background: m.bg, borderRadius: 3, textTransform: 'uppercase', flexShrink: 0 }}>
                  {m.type}
                </span>
                <span style={{ fontFamily: F.mono, fontSize: 10.5, color: 'var(--text-4)' }}>{m.desc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  </div>
);

export default MirrorPage;