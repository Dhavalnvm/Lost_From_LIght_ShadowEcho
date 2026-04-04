import React, { useEffect, useState } from 'react';
import { Card, SectionHeader } from '../components/common';
import PageHeader from '../components/layout/PageHeader';
import ImpactPanel from '../components/panels/ImpactPanel';
import { apiFetch } from '../services/api';

interface MethodologyEntry {
  description: string;
  methods?: string[];
  types?: string[];
  regulations?: string[];
  method?: string;
  dimensions?: string[];
  note?: string;
}

interface Methodology {
  overview: string;
  methodology: Record<string, MethodologyEntry>;
  limitations: string[];
}

const ImpactPage: React.FC = () => {
  const [methodology, setMethodology] = useState<Methodology | null>(null);

  useEffect(() => {
    apiFetch<Methodology>('/api/impact/methodology')
      .then(setMethodology)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leak Impact Estimator"
        subtitle="Risk estimation workspace backed by the live impact engine and its methodology endpoints."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <ImpactPanel />

        <div className="space-y-6">
          {methodology ? (
            <Card>
              <SectionHeader title="Methodology Overview" subtitle="From `/api/impact/methodology`" accent="Live" />
              <p className="text-sm leading-7 text-slate-600">{methodology.overview}</p>
            </Card>
          ) : null}

          {methodology ? (
            <Card>
              <SectionHeader title="Assessment Dimensions" subtitle="How the backend scores and explains risk" accent="Model" />
              <div className="space-y-3">
                {Object.entries(methodology.methodology).map(([key, entry]) => (
                  <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{key.replace(/_/g, ' ')}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{entry.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {methodology ? (
            <Card>
              <SectionHeader title="Limitations" subtitle="Important analyst context" accent="Review" />
              <div className="space-y-2">
                {methodology.limitations.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                    {item}
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

export default ImpactPage;
