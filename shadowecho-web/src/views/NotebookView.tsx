// src/views/NotebookView.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The Notebook — intelligence brief generator.
// Calls POST /api/notebook and renders every field the backend returns:
//
//   brief.narrative          → threat story, timeline, targets, actions
//   brief.detection_summary  → org mentions, creds, IOCs, tags
//   brief.signal_assessment  → score, is_signal, key_flags
//   brief.related_actor      → actor fingerprint (writing style, experience…)
//   brief.escalation         → psychological stage, level, indicators
//   brief.sources            → unique source list
//   context_posts            → similar posts used for RAG context
//   sources_used             → how many context posts fed the brief
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { fetchNotebook } from '../services/api';
import type { NotebookResponse } from '../types/api';
import { Card, SectionHeader, Spinner, ErrorBanner } from '../components/common';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NarrativeBrief {
  summary?: string;
  threat_type?: string;
  timeline?: string[];
  targets?: string[];
  recommended_actions?: string[];
  uncertainty_note?: string;
}

interface DetectionSummary {
  org_mentions?: string[];
  credentials_found?: number;
  iocs_found?: number;
  tags?: string[];
}

interface SignalAssessment {
  score?: number;
  is_signal?: boolean;
  key_flags?: string[];
}

interface ActorFingerprint {
  actor_id?: string;
  traits?: string[];
  writing_style?: string;
  experience_level?: string;
  confidence?: number;
  uncertainty_note?: string;
  is_experienced?: boolean;
}

interface EscalationData {
  stage?: string;
  level?: number;
  indicators?: string[];
  is_high_risk?: boolean;
  is_actionable?: boolean;
}

// ─── Design constants ────────────────────────────────────────────────────────

const ESCALATION_STAGES = [
  'curiosity', 'research', 'planning', 'preparation', 'action', 'post-action',
];

const STAGE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  curiosity:    { color: '#16a34a', bg: 'rgba(22,163,74,0.07)',   border: 'rgba(22,163,74,0.25)' },
  research:     { color: '#2563eb', bg: 'rgba(37,99,235,0.07)',   border: 'rgba(37,99,235,0.25)' },
  planning:     { color: '#ca8a04', bg: 'rgba(202,138,4,0.07)',   border: 'rgba(202,138,4,0.25)' },
  preparation:  { color: '#ea580c', bg: 'rgba(234,88,12,0.07)',   border: 'rgba(234,88,12,0.25)' },
  action:       { color: '#dc2626', bg: 'rgba(220,38,38,0.07)',   border: 'rgba(220,38,38,0.25)' },
  'post-action':{ color: '#7c3aed', bg: 'rgba(124,58,237,0.07)',  border: 'rgba(124,58,237,0.25)' },
};

const THREAT_TYPE_LABELS: Record<string, string> = {
  data_leak:        '🔓 Data Leak',
  ransomware:       '🔒 Ransomware',
  exploit_sale:     '⚡ Exploit Sale',
  access_sale:      '🔑 Access Sale',
  credential_dump:  '👤 Credential Dump',
  reconnaissance:   '🔭 Reconnaissance',
  other:            '⬡ Other',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const Tag: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = '#2563eb',
}) => (
  <span
    className="inline-block rounded px-2 py-0.5 font-mono text-xs"
    style={{
      background: `${color}12`,
      border: `1px solid ${color}33`,
      color,
    }}
  >
    {children}
  </span>
);

const ScoreBar: React.FC<{ score: number; color?: string }> = ({
  score,
  color = '#2563eb',
}) => {
  const pct = Math.min(100, Math.max(0, score * 100));
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-xs font-bold" style={{ color }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
};

// Stage ladder visualisation
const EscalationLadder: React.FC<{ escalation: EscalationData }> = ({ escalation }) => {
  const currentIdx = ESCALATION_STAGES.indexOf(escalation.stage ?? 'curiosity');
  return (
    <div className="space-y-3">
      {/* Stage pill row */}
      <div className="flex flex-wrap gap-1.5">
        {ESCALATION_STAGES.map((s, i) => {
          const isActive = i === currentIdx;
          const isPast   = i < currentIdx;
          const sc = STAGE_COLORS[s];
          return (
            <span
              key={s}
              className="rounded px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wide transition-all"
              style={
                isActive
                  ? { background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }
                  : isPast
                  ? { background: 'rgba(0,0,0,0.03)', color: '#9ca3af', border: '1px solid #e5e7eb' }
                  : { background: 'transparent', color: '#d1d5db', border: '1px solid #f3f4f6' }
              }
            >
              {isActive && '▶ '}{s}
            </span>
          );
        })}
      </div>

      {/* Level progress bar */}
      <div>
        <div className="mb-1 flex justify-between font-mono text-xs text-slate-500">
          <span>Escalation level</span>
          <span className="font-bold">{escalation.level ?? 0} / 6</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${((escalation.level ?? 0) / 6) * 100}%`,
              background: STAGE_COLORS[escalation.stage ?? 'curiosity']?.color ?? '#2563eb',
            }}
          />
        </div>
      </div>

      {/* Risk flags */}
      <div className="flex flex-wrap gap-2">
        {escalation.is_high_risk && (
          <Tag color="#dc2626">⚠ High Risk — Preparation or beyond</Tag>
        )}
        {escalation.is_actionable && (
          <Tag color="#7c3aed">⚡ Actionable — Attack or post-attack</Tag>
        )}
      </div>

      {/* Indicators */}
      {escalation.indicators && escalation.indicators.length > 0 && (
        <div>
          <p className="mb-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-slate-500">
            Stage Indicators
          </p>
          <ul className="space-y-1">
            {escalation.indicators.map((ind, i) => (
              <li key={i} className="flex gap-2 font-mono text-xs text-slate-600">
                <span className="text-blue-400">·</span>
                {ind}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Context post card (RAG sources)
const ContextPostCard: React.FC<{
  post: { text: string; source: string; similarity: number };
  index: number;
}> = ({ post, index }) => {
  const simPct = Math.round(post.similarity * 100);
  const simColor =
    simPct >= 90 ? '#dc2626' :
    simPct >= 75 ? '#ea580c' :
    simPct >= 60 ? '#2563eb' : '#6b7280';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="font-mono text-xs text-slate-400">#{index + 1}</span>
        <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-xs text-blue-700">
          {post.source}
        </span>
        <span className="ml-auto font-mono text-xs font-bold" style={{ color: simColor }}>
          {simPct}% similar
        </span>
      </div>
      <p className="font-mono text-xs leading-relaxed text-slate-600 line-clamp-3">{post.text}</p>
    </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────

const NotebookView: React.FC = () => {
  const [query, setQuery]   = useState('');
  const [postId, setPostId] = useState('');
  const [topK, setTopK]     = useState(5);
  const [result, setResult] = useState<NotebookResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!query.trim() && !postId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchNotebook({
        query:   query.trim() || undefined,
        post_id: postId.trim() || undefined,
        top_k:   topK,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate brief');
    } finally {
      setLoading(false);
    }
  };

  // Destructure the brief for cleaner rendering
  const brief      = result?.brief;
  const narrative  = brief?.narrative   as NarrativeBrief   | undefined;
  const detection  = brief?.detection_summary as DetectionSummary | undefined;
  const signal     = brief?.signal_assessment as SignalAssessment  | undefined;
  const actor      = brief?.related_actor as ActorFingerprint | undefined;
  const escalation = brief?.escalation   as EscalationData   | undefined;

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
          The Notebook
        </h1>
        <p className="mt-2 font-mono text-sm text-slate-500">
          Scattered intelligence reconstructed into one coherent brief · sourced · transparent · no black boxes
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* ── Input card ──────────────────────────────────────────── */}
      <Card>
        <SectionHeader title="Intelligence Brief Generator" subtitle="query or post ID" accent="12" />

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wide text-slate-500">
              Query / Topic
            </label>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Describe the threat you want a brief on… e.g. 'RaaS group targeting financial sector' or paste a dark web post"
              className="h-24 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wide text-slate-500">
                Post ID (optional)
              </label>
              <input
                value={postId}
                onChange={e => setPostId(e.target.value)}
                placeholder="e.g. a3f9c2d8…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wide text-slate-500">
                Context depth (top_k)
              </label>
              <select
                value={topK}
                onChange={e => setTopK(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {[3, 5, 8, 10, 15, 20].map(n => (
                  <option key={n} value={n}>{n} context posts</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || (!query.trim() && !postId.trim())}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-600 py-2.5 font-mono text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <><Spinner size="sm" /> Running pipeline + LLM…</>
            ) : (
              '◈ Generate Intelligence Brief'
            )}
          </button>
        </div>
      </Card>

      {/* ── Results ─────────────────────────────────────────────── */}
      {result && !loading && (
        <div className="space-y-4">

          {/* ── Meta banner ───────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <span className="font-mono text-xs text-slate-500">
              Brief generated ·
            </span>
            <span className="font-mono text-xs font-bold text-blue-700">
              {result.sources_used} context source{result.sources_used !== 1 ? 's' : ''} used
            </span>
            {brief?.sources && (brief.sources as string[]).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {(brief.sources as string[]).map((s: string) => (
                  <Tag key={s} color="#2563eb">{s}</Tag>
                ))}
              </div>
            )}
          </div>

          {/* ── 1. Narrative ──────────────────────────────────────── */}
          {narrative && (
            <Card>
              <SectionHeader title="Narrative Reconstruction" subtitle="coherent attack story from scattered signals" accent="01" />

              <div className="space-y-4">
                {/* Threat type + summary */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  {narrative.threat_type && (
                    <div className="shrink-0">
                      <p className="mb-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Threat Type
                      </p>
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-sm font-bold text-slate-800">
                        {THREAT_TYPE_LABELS[narrative.threat_type] ?? narrative.threat_type}
                      </span>
                    </div>
                  )}
                  {narrative.summary && (
                    <div className="min-w-0 flex-1">
                      <p className="mb-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Summary
                      </p>
                      <div className="rounded-lg border-l-[3px] border-blue-400 bg-slate-50 p-3">
                        <p className="font-sans text-sm leading-relaxed text-slate-700">
                          {narrative.summary}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                {narrative.timeline && narrative.timeline.length > 0 && (
                  <div>
                    <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Attack Timeline
                    </p>
                    <ol className="relative ml-2 space-y-2 border-l-2 border-blue-100 pl-4">
                      {narrative.timeline.map((step, i) => (
                        <li key={i} className="relative">
                          <div className="absolute -left-[21px] top-0.5 h-3 w-3 rounded-full border-2 border-blue-400 bg-white" />
                          <p className="font-mono text-xs text-slate-600 leading-relaxed">{step}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Targets */}
                {narrative.targets && narrative.targets.length > 0 && (
                  <div>
                    <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Identified Targets
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {narrative.targets.map((t, i) => (
                        <Tag key={i} color="#dc2626">{t}</Tag>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended actions */}
                {narrative.recommended_actions && narrative.recommended_actions.length > 0 && (
                  <div>
                    <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Recommended Actions
                    </p>
                    <ol className="space-y-1.5">
                      {narrative.recommended_actions.map((action, i) => (
                        <li
                          key={i}
                          className="flex gap-3 rounded-lg border border-green-100 bg-green-50 px-3 py-2"
                        >
                          <span className="shrink-0 font-mono text-xs font-bold text-green-700">{i + 1}.</span>
                          <span className="font-mono text-xs text-slate-700 leading-relaxed">{action}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Uncertainty note */}
                {narrative.uncertainty_note && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="font-mono text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1">
                      ◬ Uncertainty Note
                    </p>
                    <p className="font-mono text-xs text-amber-900 leading-relaxed">
                      {narrative.uncertainty_note}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── 2. Detection + Signal (side by side) ──────────────── */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

            {/* Detection summary */}
            {detection && (
              <Card>
                <SectionHeader title="Detection Summary" subtitle="layer 1 scan results" accent="02" />
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="font-mono text-xs uppercase tracking-wide text-amber-700 mb-1">Credentials Found</p>
                      <p className="font-mono text-2xl font-bold text-amber-800">
                        {detection.credentials_found ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="font-mono text-xs uppercase tracking-wide text-red-700 mb-1">IOCs Found</p>
                      <p className="font-mono text-2xl font-bold text-red-800">
                        {detection.iocs_found ?? 0}
                      </p>
                    </div>
                  </div>

                  {detection.org_mentions && detection.org_mentions.length > 0 && (
                    <div>
                      <p className="mb-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Org Mentions
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {detection.org_mentions.map((org, i) => (
                          <Tag key={i} color="#dc2626">{org}</Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {detection.tags && detection.tags.length > 0 && (
                    <div>
                      <p className="mb-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Detection Tags
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {detection.tags.map((tag, i) => (
                          <Tag key={i} color="#2563eb">{tag}</Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Signal assessment */}
            {signal && (
              <Card>
                <SectionHeader title="Signal Assessment" subtitle="layer 2 filter output" accent="03" />
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-center">
                      <p className="font-mono text-3xl font-bold text-blue-700">
                        {((signal.score ?? 0) * 100).toFixed(0)}%
                      </p>
                      <p className="font-mono text-xs uppercase tracking-wide text-slate-500">signal score</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <ScoreBar score={signal.score ?? 0} color="#2563eb" />
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded px-2 py-0.5 font-mono text-xs font-bold uppercase"
                          style={
                            signal.is_signal
                              ? { background: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.3)' }
                              : { background: 'rgba(107,114,128,0.1)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.3)' }
                          }
                        >
                          {signal.is_signal ? '✓ Signal' : '✗ Noise'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {signal.key_flags && signal.key_flags.length > 0 && (
                    <div>
                      <p className="mb-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Key Flags
                      </p>
                      <ul className="space-y-1">
                        {signal.key_flags.map((flag, i) => (
                          <li key={i} className="flex gap-2 font-mono text-xs text-slate-600">
                            <span className="text-blue-400">▸</span>{flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* ── 3. Actor Fingerprint + Escalation (side by side) ──── */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

            {/* Actor fingerprint */}
            {actor && Object.keys(actor).length > 0 && (
              <Card>
                <SectionHeader title="Actor Fingerprint" subtitle="behavioral identity — no usernames used" accent="04" />
                <div className="space-y-3">
                  {actor.actor_id && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="font-mono text-xs text-slate-500 mb-0.5">Behavioral ID</p>
                      <p className="font-mono text-sm font-bold text-slate-800">{actor.actor_id}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {actor.writing_style && (
                      <div className="rounded-lg border border-slate-200 p-2.5">
                        <p className="font-mono text-xs uppercase tracking-wide text-slate-500 mb-1">Writing Style</p>
                        <Tag color="#9d4edd">{actor.writing_style}</Tag>
                      </div>
                    )}
                    {actor.experience_level && (
                      <div className="rounded-lg border border-slate-200 p-2.5">
                        <p className="font-mono text-xs uppercase tracking-wide text-slate-500 mb-1">Experience</p>
                        <Tag color={actor.is_experienced ? '#dc2626' : '#16a34a'}>
                          {actor.experience_level}
                          {actor.is_experienced && ' ⚠'}
                        </Tag>
                      </div>
                    )}
                  </div>

                  {actor.confidence !== undefined && (
                    <div>
                      <p className="mb-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Fingerprint Confidence
                      </p>
                      <ScoreBar score={actor.confidence / 100} color="#9d4edd" />
                    </div>
                  )}

                  {actor.traits && actor.traits.length > 0 && (
                    <div>
                      <p className="mb-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Behavioral Traits
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {actor.traits.map((t, i) => (
                          <Tag key={i} color="#9d4edd">{t}</Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {actor.uncertainty_note && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1">
                        ◬ Uncertainty Note
                      </p>
                      <p className="font-mono text-xs text-amber-900 leading-relaxed">
                        {actor.uncertainty_note}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Escalation */}
            {escalation && Object.keys(escalation).length > 0 && (
              <Card>
                <SectionHeader title="Emotional Escalation" subtitle="psychological stage of actor" accent="05" />
                <EscalationLadder escalation={escalation} />
              </Card>
            )}
          </div>

          {/* ── 4. Context Posts ──────────────────────────────────── */}
          {result.context_posts && result.context_posts.length > 0 && (
            <Card>
              <SectionHeader
                title="Context Sources"
                subtitle={`${result.context_posts.length} similar posts used for RAG context`}
                accent="06"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {result.context_posts.map((post, i) => (
                  <ContextPostCard key={i} post={post} index={i} />
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default NotebookView;