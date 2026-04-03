import React, { useEffect, useState } from 'react';
import DecoderPanel from '../components/panels/DecoderPanel';
import { Card, SectionHeader } from '../components/common';
import { apiFetch } from '../services/api';

interface DictStats {
  coverage: Record<string, number>;
  threat_categories: string[];
  languages: string[];
  examples: { input: string; decoded: string }[];
}

const DecoderPage: React.FC = () => {
  const [dict, setDict] = useState<DictStats | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await apiFetch<DictStats>('/api/decode/dictionary');
        setDict(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(err.message);
        }
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Slang Decoder</h1>
        <p className="font-mono text-xs text-text-muted mt-0.5">Dark web coded language · multi-language support</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DecoderPanel />

        <div className="space-y-4">
          {dict && (
            <Card>
              <SectionHeader title="Dictionary Coverage" accent="∑" />
              <div className="grid grid-cols-2 gap-3 mb-4">
                {Object.entries(dict.coverage).map(([key, val]) => (
                  <div key={key} className="p-3 bg-bg-elevated border border-bg-border">
                    <div className="font-display font-bold text-xl text-accent-cyan">{val}</div>
                    <div className="font-mono text-[10px] text-text-muted mt-0.5">{key.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {dict.languages.map(l => (
                  <span key={l} className="px-2 py-0.5 bg-accent-cyan/10 border border-accent-cyan/20 font-mono text-[9px] text-accent-cyan">{l}</span>
                ))}
              </div>
            </Card>
          )}

          {dict && (
            <Card>
              <SectionHeader title="Example Inputs" accent="eg" />
              <div className="space-y-2">
                {dict.examples.map((ex, i) => (
                  <div key={i} className="p-2.5 bg-bg-elevated border border-bg-border">
                    <p className="font-mono text-[10px] text-accent-amber mb-1">"{ex.input}"</p>
                    <p className="font-mono text-[10px] text-text-secondary">→ {ex.decoded}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DecoderPage;