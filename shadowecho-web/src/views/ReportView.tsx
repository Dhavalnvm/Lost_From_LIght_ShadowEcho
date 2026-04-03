import React, { useState } from 'react';
import { Card, SectionHeader, Spinner, ErrorBanner } from '../components/common';
import { exportReport, generateReport } from '../services/api';
import type { ReportRequest, ReportResponse, ReportExportResponse } from '../types/api';
import PageHeader from '../components/layout/PageHeader';

const ReportView: React.FC = () => {
  const [payload, setPayload] = useState<ReportRequest>({
    org_name: '',
    timeframe: '7d',
    focus: '',
    include_recommendations: true,
  });
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [exportMeta, setExportMeta] = useState<ReportExportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateReport(payload);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const onExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const data = await exportReport(payload);
      setExportMeta(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Report Generator" subtitle="Generate executive reports from live ShadowEcho data." />
      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Card className="xl:col-span-1">
          <SectionHeader title="Configuration" subtitle="Report input settings" />
          <div className="space-y-3">
            <div>
              <label className="font-mono text-[10px] text-text-muted block mb-1">Organization</label>
              <input
                className="se-input"
                value={payload.org_name ?? ''}
                onChange={e => setPayload(p => ({ ...p, org_name: e.target.value }))}
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] text-text-muted block mb-1">Timeframe</label>
              <select
                className="se-sel"
                value={payload.timeframe ?? '7d'}
                onChange={e => setPayload(p => ({ ...p, timeframe: e.target.value }))}
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
            <div>
              <label className="font-mono text-[10px] text-text-muted block mb-1">Focus</label>
              <textarea
                className="se-ta"
                value={payload.focus ?? ''}
                onChange={e => setPayload(p => ({ ...p, focus: e.target.value }))}
                placeholder="Credential theft, extortion mentions, actor clusters..."
              />
            </div>
            <label className="flex items-center gap-2 font-mono text-[10px] text-text-secondary">
              <input
                type="checkbox"
                checked={Boolean(payload.include_recommendations)}
                onChange={e => setPayload(p => ({ ...p, include_recommendations: e.target.checked }))}
              />
              Include recommendations
            </label>
            <div className="flex gap-2">
              <button className="btn-c" onClick={onGenerate} disabled={loading}>
                {loading ? 'Generating...' : 'Generate'}
              </button>
              <button className="btn-g" onClick={onExport} disabled={exporting}>
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <SectionHeader title="Report Output" subtitle="Live backend response" />
          {loading ? (
            <div className="py-8 flex justify-center"><Spinner /></div>
          ) : report ? (
            <div className="space-y-3">
              <div className="border-l-[3px] border-accent-cyan pl-3">
                <p className="font-display text-lg text-text-primary">{String(report.title ?? 'Executive Threat Report')}</p>
                <p className="font-mono text-[10px] text-text-muted">{String(report.generated_at ?? new Date().toISOString())}</p>
              </div>
              {report.executive_summary ? (
                <div className="border-l-[3px] border-accent-amber pl-3">
                  <p className="font-sans text-[11px] text-text-secondary leading-relaxed">{String(report.executive_summary)}</p>
                </div>
              ) : null}
              {Array.isArray(report.key_findings) ? (
                <div>
                  <p className="font-mono text-[10px] text-text-muted mb-1">KEY FINDINGS</p>
                  <ul className="space-y-1">
                    {report.key_findings.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="font-sans text-[11px] text-text-secondary">- {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {Array.isArray(report.recommendations) ? (
                <div className="border-l-[3px] border-accent-green pl-3">
                  <p className="font-mono text-[10px] text-text-muted mb-1">RECOMMENDATIONS</p>
                  <ul className="space-y-1">
                    {report.recommendations.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="font-sans text-[11px] text-text-secondary">- {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <pre className="bg-bg-elevated border border-bg-border p-3 overflow-auto text-[10px] font-mono text-text-secondary max-h-[220px]">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="font-mono text-xs text-text-muted">Run generation to view report output.</p>
          )}
        </Card>
      </div>

      {exportMeta ? (
        <Card>
          <SectionHeader title="Export Result" subtitle="Response from /api/report/export" />
          <pre className="bg-bg-elevated border border-bg-border p-3 overflow-auto text-[10px] font-mono text-text-secondary max-h-[180px]">
            {JSON.stringify(exportMeta, null, 2)}
          </pre>
        </Card>
      ) : null}
    </div>
  );
};

export default ReportView;
