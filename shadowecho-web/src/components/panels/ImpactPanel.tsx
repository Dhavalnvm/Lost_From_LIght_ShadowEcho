import React, { useState } from 'react';
import { quickImpact } from '../../services/api';
import type { ImpactQuickResponse } from '../../types/api';
import { Card, SectionHeader, Spinner } from '../common';

const SEVERITY_COLORS: Record<string, { bar: string; text: string }> = {
  critical: { bar: 'bg-accent-red', text: 'text-accent-red' },
  high: { bar: 'bg-accent-amber', text: 'text-accent-amber' },
  medium: { bar: 'bg-blue-400', text: 'text-blue-400' },
  low: { bar: 'bg-accent-green', text: 'text-accent-green' },
};

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
      const res = await quickImpact(text.trim(), orgName.trim());
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Estimation failed');
    } finally {
      setLoading(false);
    }
  };

  const colors = result ? (SEVERITY_COLORS[result.severity.toLowerCase()] ?? SEVERITY_COLORS.medium) : null;

  return (
    <Card className="animate-slide-up">
      <SectionHeader title="Leak Impact Estimator" accent="08" subtitle="financial & regulatory risk assessment" />

      <div className="space-y-2 mb-3">
        <input
          value={orgName}
          onChange={e => setOrgName(e.target.value)}
          placeholder="Organization name (optional)"
          className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-text-primary font-mono text-xs focus:outline-none focus:border-accent-cyan/40 placeholder:text-text-muted transition-colors"
        />
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste breach post text… e.g. 'Selling 2.5M customer records from Acme Corp. Includes SSN, credit cards, medical records.'"
          className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2.5 text-text-primary font-mono text-xs resize-none h-20 focus:outline-none focus:border-accent-cyan/40 placeholder:text-text-muted transition-colors"
        />
        <button
          onClick={handleEstimate}
          disabled={loading || !text.trim()}
          className="w-full flex items-center justify-center gap-2 bg-accent-amber/10 border border-accent-amber/30 hover:bg-accent-amber/20 text-accent-amber font-mono text-xs py-2 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <><Spinner size="sm" /> Estimating…</> : '◬ Estimate Impact'}
        </button>
      </div>

      {error && <p className="text-accent-red font-mono text-xs">{error}</p>}

      {result && colors && (
        <div className="animate-fade-in space-y-3">
          {/* Risk score */}
          <div className="flex items-center gap-4 p-3 bg-bg-elevated rounded-lg border border-bg-border">
            <div className="text-center">
              <div className={`font-display font-bold text-3xl ${colors.text}`}>
                {result.risk_score.toFixed(1)}
              </div>
              <div className="text-text-muted font-mono text-[9px] uppercase">risk score</div>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-text-muted">Severity</span>
                <span className={`font-semibold uppercase ${colors.text}`}>{result.severity}</span>
              </div>
              <div className="h-1.5 bg-bg-base rounded-full overflow-hidden">
                <div className={`h-full ${colors.bar} rounded-full transition-all duration-700`} style={{ width: `${result.risk_score * 10}%` }} />
              </div>
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-text-muted">Scale</span>
                <span className="text-text-secondary">{result.scale}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-bg-elevated rounded-lg border border-bg-border">
              <div className="text-text-muted font-mono text-[9px] uppercase mb-1">Records</div>
              <div className="text-text-primary font-mono text-xs font-semibold">{result.records}</div>
            </div>
            <div className="p-2.5 bg-bg-elevated rounded-lg border border-bg-border">
              <div className="text-text-muted font-mono text-[9px] uppercase mb-1">Est. Cost</div>
              <div className="text-accent-amber font-mono text-xs font-semibold">{result.cost_range}</div>
            </div>
          </div>

          {result.regulations.length > 0 && (
            <div>
              <div className="text-text-muted font-mono text-[9px] uppercase mb-1.5">Applicable Regulations</div>
              <div className="flex flex-wrap gap-1">
                {result.regulations.map(r => (
                  <span key={r} className="px-2 py-0.5 bg-accent-red/10 border border-accent-red/20 rounded font-mono text-[9px] text-accent-red">{r}</span>
                ))}
              </div>
            </div>
          )}

          <p className="text-text-secondary font-mono text-[11px] leading-relaxed p-2.5 bg-bg-elevated rounded-lg border border-bg-border">
            {result.summary}
          </p>
        </div>
      )}
    </Card>
  );
};

export default ImpactPanel;
