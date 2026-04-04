import React from 'react';
import { Card, SectionHeader } from '../components/common';
import PageHeader from '../components/layout/PageHeader';
import LineupPanel from '../components/panels/LineupPanel';

const ranges = [
  {
    label: '90-100%',
    title: 'Very High',
    note: 'Likely shared authorship or copied content. Verify independently before action.',
    tone: 'bg-red-50 text-red-700',
  },
  {
    label: '75-89%',
    title: 'High',
    note: 'Possible campaign overlap or operator similarity with meaningful analyst value.',
    tone: 'bg-orange-50 text-orange-700',
  },
  {
    label: '60-74%',
    title: 'Moderate',
    note: 'Shared themes or style, but correlation may still be coincidental.',
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    label: '<60%',
    title: 'Low',
    note: 'Weak relationship retained for completeness and deeper review if needed.',
    tone: 'bg-green-50 text-green-700',
  },
];

const LineupPage: React.FC = () => (
  <div className="space-y-6">
    <PageHeader
      title="The Lineup"
      subtitle="Behavioral and linguistic similarity analysis presented in the same light analyst UI as the rest of the platform."
    />

    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <LineupPanel />

      <div className="space-y-6">
        <Card>
          <SectionHeader title="Similarity Scale" subtitle="How to read model confidence ranges" accent="Guide" />
          <div className="space-y-3">
            {ranges.map((range) => (
              <div key={range.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${range.tone}`}>{range.label}</span>
                  <span className="text-sm font-semibold text-slate-900">{range.title}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{range.note}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Method" subtitle="What the lineup module is designed to do" accent="Model" />
          <div className="space-y-3">
            {[
              'Embeddings capture semantic and behavioral patterns instead of relying on exact wording only.',
              'Results are grouped by source cluster to help analysts spot cross-source patterns quickly.',
              'Scores are advisory and intentionally stop short of claiming actor identity.',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </div>
);

export default LineupPage;
