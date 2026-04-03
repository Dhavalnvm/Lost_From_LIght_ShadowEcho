import React, { useMemo, useState } from 'react';
import { mirrorLookup } from '../../services/api';
import type { MirrorResponse } from '../../types/api';
import { Card, SectionHeader, Spinner } from '../common';

type MirrorPost = MirrorResponse['posts'][number];

const matchTone: Record<string, { border: string; text: string; bg: string }> = {
  exact: {
    border: 'rgba(91, 228, 183, 0.24)',
    text: '#5be4b7',
    bg: 'rgba(91, 228, 183, 0.1)',
  },
  semantic: {
    border: 'rgba(135, 191, 255, 0.22)',
    text: '#87bfff',
    bg: 'rgba(135, 191, 255, 0.1)',
  },
  fuzzy: {
    border: 'rgba(255, 182, 94, 0.24)',
    text: '#ffb65e',
    bg: 'rgba(255, 182, 94, 0.1)',
  },
};

const MirrorPanel: React.FC = () => {
  const [orgName, setOrgName] = useState('');
  const [result, setResult] = useState<MirrorResponse | null>(null);
  const [selectedPost, setSelectedPost] = useState<MirrorPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => {
    if (!result) return null;
    return {
      exact: result.posts.filter((post) => post.match_type === 'exact').length,
      semantic: result.posts.filter((post) => post.match_type === 'semantic').length,
      credentials: result.posts.reduce((count, post) => count + Number(post.credentials_found > 0), 0),
      iocs: result.posts.reduce((count, post) => count + Number(post.iocs_found > 0), 0),
    };
  }, [result]);

  const handleSearch = async () => {
    if (!orgName.trim()) return;
    setLoading(true);
    setError(null);
    setSelectedPost(null);
    try {
      const res = await mirrorLookup(orgName.trim());
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="animate-slide-up">
        <SectionHeader title="The Mirror" accent="07" subtitle="organization mention intelligence with drill-down review" />

        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search organization, brand, or alias..."
            className="se-input"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !orgName.trim()}
            className="flex items-center justify-center gap-2 rounded-full border px-5 py-3 font-mono text-[10px] uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              borderColor: 'rgba(91, 228, 183, 0.24)',
              background: 'rgba(91, 228, 183, 0.1)',
              color: '#5be4b7',
              letterSpacing: '0.16em',
            }}
          >
            {loading ? <Spinner size="sm" /> : 'Run Mirror'}
          </button>
        </div>

        {error ? (
          <p className="mb-4 font-mono text-xs" style={{ color: '#ff6767' }}>
            {error}
          </p>
        ) : null}

        {summary ? (
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            {[
              { label: 'Total Mentions', value: result?.total_mentions ?? 0, color: '#edf5f1' },
              { label: 'Exact Matches', value: summary.exact, color: '#5be4b7' },
              { label: 'Semantic Hits', value: summary.semantic, color: '#87bfff' },
              { label: 'Cred / IOC Flags', value: `${summary.credentials}/${summary.iocs}`, color: '#ffb65e' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[20px] border p-4"
                style={{
                  borderColor: 'rgba(128, 152, 168, 0.12)',
                  background: 'linear-gradient(180deg, rgba(17,29,43,0.82), rgba(13,23,35,0.88))',
                }}
              >
                <div
                  className="font-mono text-[10px] uppercase"
                  style={{ color: 'rgba(157, 176, 188, 0.6)', letterSpacing: '0.16em' }}
                >
                  {item.label}
                </div>
                <div className="mt-3 font-['Sora'] text-3xl font-semibold" style={{ color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {result ? (
          <div className="space-y-3">
            {result.posts.length === 0 ? (
              <div
                className="rounded-[24px] border px-6 py-10 text-center"
                style={{
                  borderColor: 'rgba(128, 152, 168, 0.12)',
                  background: 'rgba(17, 29, 43, 0.54)',
                }}
              >
                <p className="font-mono text-[11px] uppercase" style={{ color: 'rgba(157, 176, 188, 0.62)', letterSpacing: '0.16em' }}>
                  No matching threat chatter found
                </p>
              </div>
            ) : (
              result.posts.map((post) => {
                const tone = matchTone[post.match_type] ?? matchTone.semantic;

                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => setSelectedPost(post)}
                    className="w-full rounded-[24px] border p-4 text-left transition-all duration-200 hover:-translate-y-[1px]"
                    style={{
                      borderColor: 'rgba(128, 152, 168, 0.14)',
                      background: 'linear-gradient(180deg, rgba(17,29,43,0.82), rgba(13,23,35,0.88))',
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full border px-3 py-1 font-mono text-[9px] uppercase"
                        style={{
                          borderColor: 'rgba(128, 152, 168, 0.16)',
                          color: 'rgba(175, 201, 216, 0.82)',
                          letterSpacing: '0.14em',
                        }}
                      >
                        {post.source}
                      </span>
                      <span
                        className="rounded-full border px-3 py-1 font-mono text-[9px] uppercase"
                        style={{
                          borderColor: tone.border,
                          color: tone.text,
                          background: tone.bg,
                          letterSpacing: '0.14em',
                        }}
                      >
                        {post.match_type}
                      </span>
                      {post.credentials_found > 0 ? (
                        <span
                          className="rounded-full border px-3 py-1 font-mono text-[9px] uppercase"
                          style={{
                            borderColor: 'rgba(255, 182, 94, 0.22)',
                            color: '#ffb65e',
                            background: 'rgba(255, 182, 94, 0.08)',
                            letterSpacing: '0.14em',
                          }}
                        >
                          {post.credentials_found} creds
                        </span>
                      ) : null}
                      {post.iocs_found > 0 ? (
                        <span
                          className="rounded-full border px-3 py-1 font-mono text-[9px] uppercase"
                          style={{
                            borderColor: 'rgba(255, 103, 103, 0.2)',
                            color: '#ff6767',
                            background: 'rgba(255, 103, 103, 0.08)',
                            letterSpacing: '0.14em',
                          }}
                        >
                          {post.iocs_found} IOCs
                        </span>
                      ) : null}
                      <span className="ml-auto font-mono text-[10px]" style={{ color: 'rgba(157, 176, 188, 0.56)' }}>
                        Click for full context
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                      <div>
                        <div className="font-['Sora'] text-lg font-semibold" style={{ color: '#edf5f1' }}>
                          {post.author ? `@${post.author}` : 'Unknown actor'} mention
                        </div>
                        <p className="mt-2 line-clamp-4 font-mono text-[11px]" style={{ color: 'rgba(175, 201, 216, 0.8)', lineHeight: 1.8 }}>
                          {post.body}
                        </p>
                      </div>

                      <div className="rounded-[18px] border px-4 py-3" style={{ borderColor: 'rgba(128, 152, 168, 0.12)', background: 'rgba(255,255,255,0.02)' }}>
                        <div className="font-mono text-[9px] uppercase" style={{ color: 'rgba(157, 176, 188, 0.54)', letterSpacing: '0.14em' }}>
                          Match source
                        </div>
                        <div className="mt-2 font-['Sora'] text-base font-semibold" style={{ color: tone.text }}>
                          {post.match_type}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div
            className="rounded-[24px] border px-6 py-10 text-center"
            style={{
              borderColor: 'rgba(128, 152, 168, 0.12)',
              background: 'rgba(17, 29, 43, 0.54)',
            }}
          >
            <p className="font-mono text-[11px] uppercase" style={{ color: 'rgba(157, 176, 188, 0.62)', letterSpacing: '0.16em' }}>
              Search an organization to inspect full-source mentions and open a detailed record view.
            </p>
          </div>
        )}
      </Card>

      {selectedPost ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(4, 8, 14, 0.74)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-[30px] border"
            style={{
              borderColor: 'rgba(128, 152, 168, 0.16)',
              background: 'linear-gradient(180deg, rgba(11,19,29,0.98), rgba(14,24,36,0.98))',
              boxShadow: '0 30px 60px rgba(0, 0, 0, 0.42)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-start justify-between gap-4 border-b px-6 py-5"
              style={{ borderColor: 'rgba(128, 152, 168, 0.12)' }}
            >
              <div>
                <div className="font-mono text-[10px] uppercase" style={{ color: 'rgba(157, 176, 188, 0.62)', letterSpacing: '0.18em' }}>
                  Mirror detail view
                </div>
                <div className="mt-2 font-['Sora'] text-2xl font-semibold" style={{ color: '#edf5f1' }}>
                  Full mention context
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="rounded-full border px-4 py-2 font-mono text-[10px] uppercase"
                style={{
                  borderColor: 'rgba(128, 152, 168, 0.16)',
                  color: 'rgba(175, 201, 216, 0.78)',
                  letterSpacing: '0.14em',
                }}
              >
                Close
              </button>
            </div>

            <div className="max-h-[calc(85vh-94px)] overflow-y-auto p-6">
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="rounded-full border px-3 py-1 font-mono text-[9px] uppercase" style={{ borderColor: 'rgba(128, 152, 168, 0.16)', color: '#d8e2e9', letterSpacing: '0.14em' }}>
                  {selectedPost.source}
                </span>
                <span className="rounded-full border px-3 py-1 font-mono text-[9px] uppercase" style={{ borderColor: (matchTone[selectedPost.match_type] ?? matchTone.semantic).border, color: (matchTone[selectedPost.match_type] ?? matchTone.semantic).text, background: (matchTone[selectedPost.match_type] ?? matchTone.semantic).bg, letterSpacing: '0.14em' }}>
                  {selectedPost.match_type}
                </span>
                {selectedPost.credentials_found > 0 ? (
                  <span className="rounded-full border px-3 py-1 font-mono text-[9px] uppercase" style={{ borderColor: 'rgba(255, 182, 94, 0.22)', color: '#ffb65e', background: 'rgba(255, 182, 94, 0.08)', letterSpacing: '0.14em' }}>
                    {selectedPost.credentials_found} credentials
                  </span>
                ) : null}
                {selectedPost.iocs_found > 0 ? (
                  <span className="rounded-full border px-3 py-1 font-mono text-[9px] uppercase" style={{ borderColor: 'rgba(255, 103, 103, 0.2)', color: '#ff6767', background: 'rgba(255, 103, 103, 0.08)', letterSpacing: '0.14em' }}>
                    {selectedPost.iocs_found} IOCs
                  </span>
                ) : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
                <div
                  className="rounded-[24px] border p-5"
                  style={{
                    borderColor: 'rgba(128, 152, 168, 0.12)',
                    background: 'rgba(17, 29, 43, 0.6)',
                  }}
                >
                  <div className="font-mono text-[10px] uppercase" style={{ color: 'rgba(157, 176, 188, 0.58)', letterSpacing: '0.16em' }}>
                    Full captured text
                  </div>
                  <pre
                    className="mt-4 whitespace-pre-wrap break-words font-mono text-[12px]"
                    style={{ color: 'rgba(224, 235, 241, 0.88)', lineHeight: 1.9 }}
                  >
                    {selectedPost.body}
                  </pre>
                </div>

                <div className="space-y-4">
                  <div
                    className="rounded-[24px] border p-5"
                    style={{
                      borderColor: 'rgba(128, 152, 168, 0.12)',
                      background: 'rgba(17, 29, 43, 0.6)',
                    }}
                  >
                    <div className="font-mono text-[10px] uppercase" style={{ color: 'rgba(157, 176, 188, 0.58)', letterSpacing: '0.16em' }}>
                      Metadata
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        ['Author', selectedPost.author || 'Unknown'],
                        ['Source', selectedPost.source],
                        ['Match Type', selectedPost.match_type],
                        ['Credentials Found', String(selectedPost.credentials_found)],
                        ['IOCs Found', String(selectedPost.iocs_found)],
                        ['Scraped At', selectedPost.scraped_at || 'Unavailable'],
                      ].map(([label, value]) => (
                        <div key={label} className="border-b pb-3 last:border-b-0 last:pb-0" style={{ borderColor: 'rgba(128, 152, 168, 0.08)' }}>
                          <div className="font-mono text-[9px] uppercase" style={{ color: 'rgba(157, 176, 188, 0.5)', letterSpacing: '0.14em' }}>
                            {label}
                          </div>
                          <div className="mt-1 font-['Manrope'] text-sm font-semibold" style={{ color: '#edf5f1' }}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="rounded-[24px] border p-5"
                    style={{
                      borderColor: 'rgba(128, 152, 168, 0.12)',
                      background: 'rgba(17, 29, 43, 0.6)',
                    }}
                  >
                    <div className="font-mono text-[10px] uppercase" style={{ color: 'rgba(157, 176, 188, 0.58)', letterSpacing: '0.16em' }}>
                      Analyst note
                    </div>
                    <p className="mt-4 font-['Manrope'] text-sm" style={{ color: 'rgba(175, 201, 216, 0.76)', lineHeight: 1.8 }}>
                      This detail view is designed for full-message review, so mirror results no longer cut off
                      operational context. Analysts can inspect the full body before deciding whether to escalate.
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
