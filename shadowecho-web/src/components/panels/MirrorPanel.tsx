import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { mirrorLookup } from '../../services/api';
import type { MirrorResponse } from '../../types/api';
import { FALLBACK_MIRROR_POSTS } from '../../data/fallbackData';
import { Button, Card, SectionHeader } from '../common';

type MirrorPost = MirrorResponse['posts'][number];

const matchTone: Record<'exact' | 'semantic', string> = {
  exact: 'border-red-200 bg-red-50 text-red-700',
  semantic: 'border-cyan-200 bg-cyan-50 text-cyan-700',
};

const formatRelativeTime = (value?: string) => {
  if (!value) return 'Unknown time';
  const delta = Date.now() - new Date(value).getTime();
  if (Number.isNaN(delta)) return 'Unknown time';
  const minutes = Math.round(delta / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

const renderSegmentedBar = (value = 0, segments = 8, tone = 'bg-cyan-400') => {
  const filled = Math.round(Math.max(0, Math.min(1, value)) * segments);
  return (
    <div className="flex gap-1">
      {Array.from({ length: segments }, (_, index) => (
        <span
          key={index}
          className={`h-2.5 w-4 rounded-sm ${index < filled ? tone : 'bg-slate-200'}`}
        />
      ))}
    </div>
  );
};

const truncateOnion = (url?: string) => {
  if (!url) return '';
  return url.length > 45 ? `${url.slice(0, 45)}...` : url;
};

const OnionLink: React.FC<{ url?: string; fallback: string }> = ({ url, fallback }) => {
  if (!url) {
    return <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{fallback}</span>;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        background: 'rgba(155,109,255,0.1)',
        border: '1px solid rgba(155,109,255,0.28)',
        borderRadius: 4,
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <span style={{ fontSize: 11, flexShrink: 0 }}>🧅</span>
      <span
        style={{
          fontFamily: "'Fira Code', monospace",
          fontSize: 9,
          color: '#9B6DFF',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}
      >
        {truncateOnion(url)}
      </span>
      <button
        onClick={() => navigator.clipboard.writeText(url)}
        title="Copy onion link"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#9B6DFF',
          padding: 0,
          flexShrink: 0,
          fontSize: 11,
          opacity: 0.7,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
      >
        ⧉
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title="Open in Tor Browser"
        style={{
          color: '#9B6DFF',
          textDecoration: 'none',
          fontSize: 10,
          flexShrink: 0,
          opacity: 0.7,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
      >
        ↗
      </a>
    </div>
  );
};

const MirrorPanel: React.FC = () => {
  const [orgName, setOrgName] = useState('');
  const [result, setResult] = useState<MirrorResponse | null>(null);
  const [selectedPost, setSelectedPost] = useState<MirrorPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const displayPosts = useMemo(() => {
    if (!result) return [];
    if (result.posts.length > 0) return result.posts;
    return FALLBACK_MIRROR_POSTS;
  }, [result]);

  const summary = useMemo(() => {
    if (!displayPosts.length) return null;
    return {
      total: result?.total_mentions ?? displayPosts.length,
      exact: displayPosts.filter(post => post.match_type === 'exact').length,
      semantic: displayPosts.filter(post => post.match_type === 'semantic').length,
      credentials: displayPosts.filter(post => post.credentials_found > 0).length,
      iocs: displayPosts.filter(post => post.iocs_found > 0).length,
    };
  }, [displayPosts, result]);

  const handleSearch = async () => {
    if (!orgName.trim()) return;
    setLoading(true);
    setError(null);
    setSelectedPost(null);

    try {
      const response = await mirrorLookup(orgName.trim());
      const fallback = response.posts.length === 0;
      setResult(fallback ? { ...response, total_mentions: FALLBACK_MIRROR_POSTS.length, posts: FALLBACK_MIRROR_POSTS } : response);
      setIsFallback(fallback);
    } catch (err) {
      setResult({
        org_name: orgName.trim(),
        total_mentions: FALLBACK_MIRROR_POSTS.length,
        posts: FALLBACK_MIRROR_POSTS,
      });
      setIsFallback(true);
      setError(err instanceof Error ? err.message : 'Mirror search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <SectionHeader
          title="Mirror Search"
          subtitle="Search the indexed corpus for organization mentions and drill into full context."
          accent="Mirror"
        />

        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            value={orgName}
            onChange={(event) => setOrgName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && void handleSearch()}
            placeholder="Search organization, brand, or alias..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
          <Button onClick={() => void handleSearch()} loading={loading} disabled={!orgName.trim()}>
            <Search className="h-4 w-4" />
            Run Mirror
          </Button>
        </div>

        {isFallback ? (
          <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-violet-700">
            Demo mode - showing representative mention matches while live mirror results are sparse.
          </div>
        ) : null}

        {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        {summary ? (
          <div className="mb-5 grid gap-3 md:grid-cols-4">
            {[
              { label: 'Total Mentions', value: summary.total },
              { label: 'Exact Matches', value: summary.exact },
              { label: 'Semantic Hits', value: summary.semantic },
              { label: 'Cred / IOC Flags', value: `${summary.credentials}/${summary.iocs}` },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        {!result ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            Search an organization to inspect exact and semantic mention matches from the backend.
          </div>
        ) : (
          <div className="space-y-3">
            {displayPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setSelectedPost(post)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{post.source}</span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${matchTone[post.match_type]}`}>{post.match_type}</span>
                  {post.has_credentials ? <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">🔑 Credentials</span> : null}
                  {post.has_ioc ? <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">⚠ IOC</span> : null}
                  <span className="text-xs text-slate-500">{formatRelativeTime(post.timestamp)}</span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-slate-500">👤 {post.author || 'unknown'}</span>
                  <div className="min-w-[150px]">
                    <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">Similarity</p>
                    {renderSegmentedBar(post.match_type === 'exact' ? 1 : post.similarity ?? 0)}
                  </div>
                  <OnionLink url={post.url} fallback={post.source} />
                </div>

                <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">{post.body}</p>
              </button>
            ))}
          </div>
        )}
      </Card>

      {selectedPost ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm" onClick={() => setSelectedPost(null)}>
          <div className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Mirror Detail</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">Full mention context</h3>
              </div>
              <Button variant="ghost" onClick={() => setSelectedPost(null)}>Close</Button>
            </div>

            <div className="max-h-[calc(85vh-92px)] overflow-y-auto p-6">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{selectedPost.source}</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${matchTone[selectedPost.match_type]}`}>{selectedPost.match_type}</span>
                {selectedPost.credentials_found > 0 ? <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">{selectedPost.credentials_found} credentials</span> : null}
                {selectedPost.iocs_found > 0 ? <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">{selectedPost.iocs_found} IOCs</span> : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Captured text</p>
                  <pre className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{selectedPost.body}</pre>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Metadata</p>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Author</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">👤 {selectedPost.author || 'Unknown'}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Observed</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{formatRelativeTime(selectedPost.timestamp)}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Similarity</p>
                        <div className="mt-2">{renderSegmentedBar(selectedPost.match_type === 'exact' ? 1 : selectedPost.similarity ?? 0)}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Onion Link</p>
                        <div className="mt-2">
                          <OnionLink url={selectedPost.url} fallback={selectedPost.source} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                    <p className="text-xs uppercase tracking-wide text-violet-700">Analyst Note</p>
                    <p className="mt-3 text-sm leading-6 text-violet-900">
                      Use the onion link pill to copy or open the original Tor source when deeper validation is needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default MirrorPanel;
