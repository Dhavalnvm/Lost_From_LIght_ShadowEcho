import React, { useState } from 'react';
import { findSimilar } from '../../services/api';
import type { LineupResponse } from '../../types/api';
import { Card, SectionHeader, Spinner } from '../common';

const LineupPanel: React.FC = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<LineupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await findSimilar(text.trim());
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const similarityColor = (s: number) => {
    if (s >= 0.9) return 'text-accent-red';
    if (s >= 0.75) return 'text-accent-amber';
    if (s >= 0.6) return 'text-blue-400';
    return 'text-text-muted';
  };

  return (
    <Card className="animate-slide-up">
      <SectionHeader title="The Lineup" accent="11" subtitle="behavioral & linguistic similarity search" />

      <div className="space-y-2 mb-4">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste post text to find similar content across sources…"
          className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2.5 text-text-primary font-mono text-xs resize-none h-16 focus:outline-none focus:border-accent-cyan/40 placeholder:text-text-muted transition-colors"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !text.trim()}
          className="w-full flex items-center justify-center gap-2 bg-accent-purple/10 border border-accent-purple/30 hover:bg-accent-purple/20 text-purple-300 font-mono text-xs py-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <><Spinner size="sm" /> Searching…</> : '◈ Run Lineup'}
        </button>
      </div>

      {error && <p className="text-accent-red font-mono text-xs mb-3">{error}</p>}

      {result && (
        <div className="animate-fade-in space-y-2">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-[10px] text-text-muted">
              {result.similar_posts.length} matches · {result.cluster_count} source clusters
            </span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {result.similar_posts.length === 0 ? (
              <p className="text-center text-text-muted font-mono text-sm py-6">No similar posts found</p>
            ) : (
              result.similar_posts.map((post, i) => (
                <div key={i} className="p-3 bg-bg-elevated rounded-lg border border-bg-border hover:border-accent-purple/20 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-bg-base border border-bg-border rounded font-mono text-[9px] text-text-muted">{post.source}</span>
                      {post.has_credentials && <span className="px-1.5 py-0.5 bg-accent-amber/10 border border-accent-amber/20 rounded font-mono text-[9px] text-accent-amber">CREDS</span>}
                      {post.has_ioc && <span className="px-1.5 py-0.5 bg-accent-red/10 border border-accent-red/20 rounded font-mono text-[9px] text-accent-red">IOC</span>}
                    </div>
                    <span className={`font-mono text-xs font-bold ${similarityColor(post.similarity)}`}>
                      {(post.similarity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-text-secondary font-mono text-[11px] leading-relaxed line-clamp-2 mb-1.5">{post.text}</p>
                  <p className="text-text-muted font-mono text-[9px] italic">{post.confidence_note}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default LineupPanel;
