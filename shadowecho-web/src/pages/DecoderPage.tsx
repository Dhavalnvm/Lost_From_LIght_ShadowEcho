import React, { useEffect, useState } from 'react';
import { Card, SectionHeader } from '../components/common';
import PageHeader from '../components/layout/PageHeader';
import DecoderPanel from '../components/panels/DecoderPanel';
import { apiFetch } from '../services/api';

interface DictStats {
  coverage: Record<string, number>;
  threat_categories: string[];
  languages: string[];
  examples: { input: string; decoded: string }[];
}

const DecoderPage: React.FC = () => {
  const [dictionary, setDictionary] = useState<DictStats | null>(null);

  useEffect(() => {
    apiFetch<DictStats>('/api/decode/dictionary')
      .then(setDictionary)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Slang Decoder"
        subtitle="Enterprise-friendly decode workspace with live dictionary coverage, languages, and example mappings from the backend."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DecoderPanel />

        <div className="space-y-6">
          {dictionary ? (
            <Card>
              <SectionHeader title="Dictionary Coverage" subtitle="Backend dictionary statistics" accent="Live" />
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(dictionary.coverage).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-2xl font-semibold text-slate-900">{value}</div>
                    <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                      {key.replace(/_/g, ' ')}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {dictionary.languages.map((language) => (
                  <span key={language} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {language}
                  </span>
                ))}
              </div>
            </Card>
          ) : null}

          {dictionary ? (
            <Card>
              <SectionHeader title="Example Inputs" subtitle="Reference examples from `/api/decode/dictionary`" accent="Guide" />
              <div className="space-y-3">
                {dictionary.examples.map((example, index) => (
                  <div key={`${example.input}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{example.input}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{example.decoded}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DecoderPage;
