import React, { useState } from 'react';
import { mirrorLookup } from '../../services/api';
import type { MirrorResponse } from '../../types/api';
import { Card, SectionHeader, Spinner } from '../common';

const MirrorPanel: React.FC = () => {
  const [orgName, setOrgName] = useState('');
  const [result, setResult] = useState<MirrorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!orgName.trim()) return;
    setLoading(true);
    setError(null);
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
    <Card className="animate-slide-up">
      <SectionHeader title="The Mirror" accent="07" subtitle="what criminals say about your org" />

      <div className="flex gap-2 mb-4">
        <input
          value={orgName}
          onChange={e => setOrgName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Organization name…"
          className="flex-1 bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-text-primary font-mono text-xs focus:outline-none focus:border-accent-cyan/40 placeholder:text-text-muted transition-colors"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !orgName.trim()}
          className="flex items-center gap-2 bg-accent-cyan/10 border border-accent-cyan/30 hover:bg-accent-cyan/20 text-accent-cyan font-mono text-xs px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <Spinner size="sm" /> : '⬡ Scan'}
        </button>
      </div>

      {error && <p className="text-accent-red font-mono text-xs mb-3">{error}</p>}

      {result && (
        <div className="animate-fade-in space-y-3">
          <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-lg border border-bg-border">
            <span className="font-mono text-xs text-text-secondary">Mentions found</span>
            <span className={`font-display font-bold text-xl ${result.total_mentions > 0 ? 'text-accent-red' : 'text-accent-green'}`}>
              {result.total_mentions}
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {result.posts.map(post => (
              <div key={post.id} className="p-3 bg-bg-elevated rounded-lg border border-bg-border hover:border-accent-cyan/20 transition-all">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 bg-bg-base border border-bg-border rounded font-mono text-[9px] text-text-muted uppercase">
                    {post.source}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-mono text-[9px] ${post.match_type === 'exact' ? 'bg-accent-red/10 text-accent-red border border-accent-red/20' : 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'}`}>
                    {post.match_type}
                  </span>
                  {post.credentials_found > 0 && (
                    <span className="px-2 py-0.5 bg-accent-amber/10 border border-accent-amber/20 rounded font-mono text-[9px] text-accent-amber">
                      {post.credentials_found} creds
                    </span>
                  )}
                  {post.iocs_found > 0 && (
                    <span className="px-2 py-0.5 bg-accent-red/10 border border-accent-red/20 rounded font-mono text-[9px] text-accent-red">
                      {post.iocs_found} IOCs
                    </span>
                  )}
                </div>
                <p className="text-text-secondary font-mono text-[11px] leading-relaxed line-clamp-2">{post.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default MirrorPanel;
