import React, { useState } from 'react';
import { DollarSign, Landmark, Scale, ShieldAlert } from 'lucide-react';
import { quickImpact } from '../../services/api';
import type { ImpactQuickResponse } from '../../types/api';
import { Button, Card, SectionHeader } from '../common';

const severityClass: Record<string, string> = {
  critical: 'bg-red-50 text-red-700',
  high: 'bg-orange-50 text-orange-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-green-50 text-green-700',
};

const progressClass: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-green-500',
};

const scoreBar = (score: number, tone: string) => (
  <div className="flex gap-1">
    {Array.from({ length: 10 }, (_, index) => (
      <span key={index} className={`h-2.5 w-full rounded-sm ${index < Math.round(score) ? tone : 'bg-slate-200'}`} />
    ))}
  </div>
);

const ImpactPanel: React.FC = () => {
  const [text, setText] = useState('');
  const [orgName, setOrgName] = useState('');
  const [result, setResult] = useState<ImpactQuickResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEstimate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await quickImpact(text.trim(), orgName.trim());
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impact estimation failed');
    } finally {
      setLoading(false);
    }
  };

  const tone = result?.overall_severity?.toLowerCase() ?? 'medium';

  return (
    <Card className="h-full">
      <SectionHeader
        title="Leak Impact Estimator"
        subtitle="Estimate business and regulatory impact from live API inference."
        accent="Impact"
      />

      <div className="space-y-4">
        <input
          value={orgName}
          onChange={(event) => setOrgName(event.target.value)}
          placeholder="Organization name (optional)"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste a breach or leak description..."
          className="min-h-36 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />

        <Button variant="ghost" onClick={() => void handleEstimate()} loading={loading} disabled={!text.trim()} className="w-full">
          <ShieldAlert className="h-4 w-4" />
          Estimate Impact
        </Button>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        {result ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Business Risk Score</p>
                  <div className="mt-2 text-3xl font-semibold text-slate-900">{result.business_risk_score.toFixed(1)}</div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityClass[tone] ?? severityClass.medium}`}>
                  {result.scale_category.toUpperCase()}
                </span>
              </div>
              <div className="mt-4">{scoreBar(result.business_risk_score, progressClass[tone] ?? progressClass.medium)}</div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Landmark className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Records</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{result.estimated_records.formatted}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Scale className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Scale</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{result.primary_data_type}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Est. Cost</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{result.estimated_cost_range.formatted}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Risk Breakdown</p>
              <div className="mt-4 space-y-4">
                {Object.entries(result.risk_breakdown).map(([key, value]) => (
                  <div key={key}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="capitalize text-slate-600">{key}</span>
                      <span className="font-semibold text-slate-900">{value.toFixed(1)}/10</span>
                    </div>
                    {scoreBar(value, progressClass[tone] ?? progressClass.medium)}
                  </div>
                ))}
              </div>
            </div>

            {result.applicable_regulations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.applicable_regulations.filter((regulation) => regulation.applies).map((regulation) => (
                  <span key={regulation.regulation} title={regulation.max_fine} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                    {regulation.regulation}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {result.impact_summary}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Recommended Actions</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {result.recommended_actions.map((action, index) => (
                  <div key={`${action}-${index}`} className="rounded-xl bg-slate-50 px-3 py-2">
                    <span className={action.startsWith('IMMEDIATE:') ? 'text-red-700' : action.startsWith('REGULATORY:') ? 'text-orange-700' : 'text-amber-700'}>
                      {action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export default ImpactPanel;
