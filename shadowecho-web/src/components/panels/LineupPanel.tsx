import React, { useState } from 'react';
import { SearchCheck } from 'lucide-react';
import { findSimilar } from '../../services/api';
import type { LineupResponse } from '../../types/api';
import { Button, Card, SectionHeader } from '../common';

const similarityTone = (value: number) => {
  if (value >= 0.9) return 'bg-red-50 text-red-700';
  if (value >= 0.75) return 'bg-orange-50 text-orange-700';
  if (value >= 0.6) return 'bg-amber-50 text-amber-700';
  return 'bg-green-50 text-green-700';
};

const segmentedSimilarity = (value: number) => {
  const filled = Math.round(Math.max(0, Math.min(1, value)) * 10);
  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }, (_, index) => (
        <span key={index} className={`h-2 w-4 rounded-sm ${index < filled ? 'bg-cyan-400' : 'bg-slate-200'}`} />
      ))}
    </div>
  );
};

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
      const response = await findSimilar(text.trim());
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Similarity search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <SectionHeader
        title="Behavioral Similarity Search"
        subtitle="Compare text against semantically similar posts from the live vector index."
        accent="Lineup"
      />

      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste a suspicious post or message to search for similar activity..."
          className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />

        <Button variant="ghost" onClick={() => void handleSearch()} loading={loading} disabled={!text.trim()} className="w-full">
          <SearchCheck className="h-4 w-4" />
          Run Lineup
        </Button>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        {result ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {result.similar_posts.length} matches
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {result.cluster_count} clusters across {result.cluster_count} sources
              </span>
            </div>

            {result.similar_posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No similar posts found for this query.
              </div>
            ) : (
              <div className="space-y-3">
                {result.similar_posts.map((post, index) => (
                  <div key={`${post.source}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{post.source}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${similarityTone(post.similarity)}`}>
                        {(post.similarity * 100).toFixed(0)}%
                      </span>
                      {post.has_credentials ? <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">🔑 Credentials</span> : null}
                      {post.has_ioc ? <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">⚠ IOC</span> : null}
                      <span className="text-xs text-slate-500">👤 {post.author || 'unknown'}</span>
                      <span className="text-xs text-slate-500">{new Date(post.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="mt-3">
                      <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">Similarity</p>
                      {segmentedSimilarity(post.similarity)}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{post.text}</p>
                    <p className="mt-3 text-xs italic leading-5 text-slate-500">{post.confidence_note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export default LineupPanel;
