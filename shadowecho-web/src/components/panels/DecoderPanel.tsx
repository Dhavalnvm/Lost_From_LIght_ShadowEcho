import React, { useState } from 'react';
import { decodeText } from '../../services/api';
import type { DecodeResponse } from '../../types/api';
import { Card, SectionHeader, SeverityBadge, Spinner } from '../common';

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'text-accent-red',
  high: 'text-accent-amber',
  medium: 'text-blue-400',
  low: 'text-text-muted',
};

const DecoderPanel: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<DecodeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await decodeText(input.trim());
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decode failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="animate-slide-up">
      <SectionHeader title="Slang Decoder" accent="06" subtitle="dark web coded language analysis" />

      <div className="space-y-3">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste dark web text here… e.g. 'selling fresh logs from redline stealer, fullz available'"
          className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2.5 text-text-primary font-mono text-xs resize-none h-20 focus:outline-none focus:border-accent-cyan/40 placeholder:text-text-muted transition-colors"
        />
        <button
          onClick={handleDecode}
          disabled={loading || !input.trim()}
          className="w-full flex items-center justify-center gap-2 bg-accent-cyan/10 border border-accent-cyan/30 hover:bg-accent-cyan/20 hover:border-accent-cyan/50 text-accent-cyan font-mono text-xs py-2 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <><Spinner size="sm" /> Decoding…</> : '◈ Decode Text'}
        </button>
      </div>

      {error && <p className="text-accent-red font-mono text-xs mt-3">{error}</p>}

      {result && (
        <div className="mt-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-3 flex-wrap">
            <SeverityBadge severity={result.highest_severity} />
            <span className="font-mono text-[10px] text-text-muted">{result.term_count} terms decoded</span>
            <div className="flex gap-1 flex-wrap">
              {result.language_mix.map(l => (
                <span key={l} className="px-2 py-0.5 bg-bg-elevated border border-bg-border rounded font-mono text-[9px] text-text-secondary">{l}</span>
              ))}
            </div>
          </div>

          {result.decoded_summary && (
            <div className="bg-bg-elevated border border-bg-border rounded-lg p-3">
              <p className="text-text-secondary font-mono text-[11px] leading-relaxed">{result.decoded_summary}</p>
            </div>
          )}

          {result.decoded_terms.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {result.decoded_terms.map((term, i) => (
                <div key={i} className="flex items-start gap-3 p-2 bg-bg-elevated rounded border border-bg-border">
                  <span className={`font-mono text-[10px] font-semibold min-w-0 ${SEVERITY_COLOR[term.severity] ?? 'text-text-muted'}`}>
                    {term.term}
                  </span>
                  <span className="text-text-muted font-mono text-[10px]">→</span>
                  <span className="text-text-secondary font-mono text-[10px] flex-1">{term.decoded}</span>
                  <span className="text-text-muted font-mono text-[9px] shrink-0 uppercase">{term.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default DecoderPanel;
