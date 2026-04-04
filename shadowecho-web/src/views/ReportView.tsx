import React, { useState } from 'react';
import { Button, Card, ErrorBanner, SectionHeader, Spinner } from '../components/common';
import PageHeader from '../components/layout/PageHeader';
import { exportReport, generateReport } from '../services/api';
import type { ReportExportResponse, ReportRequest, ReportResponse } from '../types/api';

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
    <div className="space-y-6">
      <PageHeader
        title="Report Generator"
        subtitle="Generate executive-ready threat reports from the live ShadowEcho backend."
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <SectionHeader title="Configuration" subtitle="Set the report inputs and export options." accent="Input" />
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Organization</label>
              <input
                value={payload.org_name ?? ''}
                onChange={(event) => setPayload((current) => ({ ...current, org_name: event.target.value }))}
                placeholder="Acme Corp"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Timeframe</label>
              <select
                value={payload.timeframe ?? '7d'}
                onChange={(event) => setPayload((current) => ({ ...current, timeframe: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Focus</label>
              <textarea
                value={payload.focus ?? ''}
                onChange={(event) => setPayload((current) => ({ ...current, focus: event.target.value }))}
                placeholder="Credential theft, extortion mentions, actor clusters..."
                className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={Boolean(payload.include_recommendations)}
                onChange={(event) => setPayload((current) => ({ ...current, include_recommendations: event.target.checked }))}
              />
              Include recommendations
            </label>

            <div className="flex gap-3">
              <Button onClick={() => void onGenerate()} loading={loading}>Generate</Button>
              <Button variant="ghost" onClick={() => void onExport()} loading={exporting}>Export</Button>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Report Output" subtitle="Rendered directly from the report API response." accent="Live" />
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : report ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-lg font-semibold text-slate-900">{String(report.org_focus ?? 'Executive Threat Report')}</p>
                <p className="mt-1 text-sm text-slate-500">{String(report.generated_at ?? new Date().toISOString())}</p>
              </div>

              {report.executive_summary ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                  {String(report.executive_summary)}
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Signal Posts</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{report.overview.signal_posts}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Total Alerts</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{report.overview.total_alerts}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Credential Posts</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{report.overview.credential_posts}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">IOC Posts</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{report.overview.ioc_posts}</p>
                </div>
              </div>

              {report.recommendations ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Recommendations</p>
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm whitespace-pre-wrap text-green-900">
                    {report.recommendations}
                  </div>
                </div>
              ) : null}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Critical Alerts</p>
                <div className="space-y-2">
                  {report.critical_alerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">{alert.title}</p>
                      <p className="mt-1">{alert.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              <pre className="max-h-[240px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Run generation to view report output.</p>
          )}
        </Card>
      </div>

      {exportMeta ? (
        <Card>
          <SectionHeader title="Export Result" subtitle="Response from `/api/report/export`" accent="File" />
          <pre className="max-h-[220px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            {JSON.stringify(exportMeta, null, 2)}
          </pre>
        </Card>
      ) : null}
    </div>
  );
};

export default ReportView;
