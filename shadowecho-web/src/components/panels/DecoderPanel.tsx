import React, { useState } from 'react';
import { Languages, SearchCode } from 'lucide-react';
import { decodeText } from '../../services/api';
import type { DecodeResponse } from '../../types/api';
import { Button, Card, SectionHeader, SeverityBadge } from '../common';

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
      const response = await decodeText(input.trim());
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decode failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <SectionHeader
        title="Slang Decoder"
        subtitle="Submit dark-web text and decode it against the live backend dictionary."
        accent="Decode"
      />

      <div className="space-y-4">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste suspicious text or coded marketplace language..."
          className="min-h-36 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />

        <Button onClick={() => void handleDecode()} loading={loading} disabled={!input.trim()} className="w-full">
          <SearchCode className="h-4 w-4" />
          Decode Text
        </Button>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        {result ? (
          <div className="space-y-4">
            <div className={`rounded-2xl border px-4 py-3 ${result.highest_severity === 'critical' ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={result.highest_severity} />
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {result.term_count} terms decoded
                </span>
                {result.language_mix.map((language) => (
                  <span key={language} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                    <Languages className="h-3.5 w-3.5" />
                    {language}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {result.decoded_terms.map((term, index) => (
                <div key={`${term.original}-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[140px_1fr_auto_auto] md:items-start">
                  <div>
                    <p className="rounded-md bg-violet-50 px-2 py-1 text-sm font-semibold text-violet-700">{term.original}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{term.language}</p>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{term.decoded}</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{term.category}</span>
                  <SeverityBadge severity={term.severity} />
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Decoded Summary</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{result.decoded_summary}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={result.highest_severity} />
              {result.threat_categories.map((category) => (
                <span key={category} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{category}</span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export default DecoderPanel;
