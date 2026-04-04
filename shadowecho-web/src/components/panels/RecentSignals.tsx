import React from 'react';
import type { SignalPost } from '../../types/api';
import { FALLBACK_SIGNALS } from '../../data/fallbackData';
import { Card, SectionHeader } from '../common';

interface Props {
  signals: SignalPost[];
}

const truncateUrl = (url: string) => (url.length > 45 ? `${url.slice(0, 45)}...` : url);

const scoreBar = (score = 0) => {
  const filled = Math.round(Math.max(0, Math.min(1, score)) * 8);
  return (
    <div className="flex gap-1">
      {Array.from({ length: 8 }, (_, index) => (
        <span key={index} className={`h-2 w-4 rounded-sm ${index < filled ? 'bg-cyan-400' : 'bg-slate-200'}`} />
      ))}
    </div>
  );
};

const RecentSignalsPanel: React.FC<Props> = ({ signals }) => {
  const displaySignals = signals.length > 0 ? signals : FALLBACK_SIGNALS;
  const isFallback = signals.length === 0;

  return (
    <Card>
      <SectionHeader title="Recent Signals" subtitle="High-confidence detections from the current response." accent="Signals" />
      {isFallback ? (
        <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-violet-700">
          Demo mode - showing representative signal posts until live results arrive.
        </div>
      ) : null}
      <div className="space-y-3">
        {displaySignals.map((post) => (
          <div key={post.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{post.source}</span>
                {post.author ? <span className="text-xs text-slate-500">@{post.author}</span> : null}
                {post.has_credentials ? <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">🔑 Creds</span> : null}
                {post.has_ioc ? <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">⚠ IOC</span> : null}
              </div>
              <span className="text-xs text-slate-500">{new Date(post.timestamp).toLocaleString()}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">Signal score</p>
                {scoreBar(post.signal_score)}
              </div>
              {post.url ? (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-2 rounded-md border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] text-violet-700"
                >
                  <span>🧅</span>
                  <span className="truncate font-mono">{truncateUrl(post.url)}</span>
                </a>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {(post.body ?? '').slice(0, 150)}
              {(post.body ?? '').length > 150 ? '...' : ''}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RecentSignalsPanel;
