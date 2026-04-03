import React from 'react';
import { useMonitoringData } from '../hooks/useMonitoringData';
import MetricCardsPanel from '../components/panels/MetricCards';
import { AlertTrendChart, SignalTrendChart } from '../components/charts/TrendCharts';
import AlertDistributionChart from '../components/charts/AlertDistribution';
import AlertFeedPanel from '../components/panels/AlertFeed';
import RecentSignalsPanel from '../components/panels/RecentSignals';
import FeedbackPanel from '../components/panels/FeedbackPanel';
import { ErrorBanner, LiveIndicator, Spinner } from '../components/common';

const kpiTone = {
  neutral: { accent: '#afc9d8', glow: 'rgba(175, 201, 216, 0.18)' },
  signal: { accent: '#5be4b7', glow: 'rgba(91, 228, 183, 0.18)' },
  danger: { accent: '#ff6767', glow: 'rgba(255, 103, 103, 0.18)' },
  warning: { accent: '#ffb65e', glow: 'rgba(255, 182, 94, 0.18)' },
  info: { accent: '#87bfff', glow: 'rgba(135, 191, 255, 0.18)' },
} as const;

const KpiCard: React.FC<{
  label: string;
  value: string;
  tone: keyof typeof kpiTone;
  note: string;
}> = ({ label, value, tone, note }) => {
  const palette = kpiTone[tone];

  return (
    <div
      className="relative overflow-hidden rounded-[24px] border p-5"
      style={{
        background: 'linear-gradient(180deg, rgba(11,19,29,0.92), rgba(14,24,36,0.96))',
        borderColor: 'rgba(128, 152, 168, 0.14)',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 30px ${palette.glow}`,
      }}
    >
      <div
        className="absolute inset-x-6 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${palette.accent}, transparent)` }}
      />
      <div
        className="font-mono text-[10px] uppercase"
        style={{ color: 'rgba(157, 176, 188, 0.64)', letterSpacing: '0.18em' }}
      >
        {label}
      </div>
      <div
        className="mt-3 font-['Sora'] text-[36px] font-semibold leading-none"
        style={{ color: palette.accent }}
      >
        {value}
      </div>
      <div
        className="mt-3 font-mono text-[11px]"
        style={{ color: 'rgba(175, 201, 216, 0.72)', lineHeight: 1.6 }}
      >
        {note}
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const {
    dashboard,
    alertSummary,
    recentAlerts,
    timeSeries,
    loading,
    error,
    lastUpdated,
    refresh,
  } = useMonitoringData(7000);

  if (loading && !dashboard) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-5">
        <Spinner />
        <span
          className="font-mono text-[12px] uppercase"
          style={{ color: 'rgba(157, 176, 188, 0.58)', letterSpacing: '0.22em' }}
        >
          Connecting to ShadowEcho backend...
        </span>
      </div>
    );
  }

  const stats = dashboard?.stats;
  const signalRate = stats ? Math.round((stats.signal_posts / Math.max(stats.total_posts, 1)) * 100) : 0;
  const alertsBySeverity = stats?.alerts_by_severity ?? {};
  const hottestSource = Object.entries(stats?.posts_by_source ?? {}).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6 pb-6">
      <section
        className="rounded-[30px] border p-6"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(91,228,183,0.14), transparent 28%), linear-gradient(180deg, rgba(11,19,29,0.92), rgba(14,24,36,0.94))',
          borderColor: 'rgba(128, 152, 168, 0.14)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.26)',
        }}
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div
              className="font-mono text-[10px] uppercase"
              style={{ color: 'rgba(157, 176, 188, 0.74)', letterSpacing: '0.24em' }}
            >
              Security Operations Overview
            </div>
            <h1
              className="mt-3 font-['Sora'] text-4xl font-semibold leading-tight"
              style={{ color: '#edf5f1' }}
            >
              Analyst command dashboard for live dark web signal triage.
            </h1>
            <p
              className="mt-4 max-w-2xl font-['Manrope'] text-sm"
              style={{ color: 'rgba(175, 201, 216, 0.78)', lineHeight: 1.8 }}
            >
              Built around rapid prioritization: active threat posture, signal quality, severity movement,
              and the feeds your team needs before escalation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-full border px-4 py-2 font-mono text-[10px] uppercase transition-all hover:-translate-y-[1px]"
              style={{
                borderColor: 'rgba(91, 228, 183, 0.26)',
                background: 'rgba(91, 228, 183, 0.1)',
                color: '#5be4b7',
                letterSpacing: '0.16em',
              }}
            >
              Refresh Snapshot
            </button>
            <LiveIndicator updatedAt={lastUpdated} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            label="Ingested Posts"
            value={stats?.total_posts?.toLocaleString() ?? '0'}
            tone="info"
            note={`${hottestSource ? `${hottestSource[0]} is the hottest source.` : 'Awaiting source mix.'}`}
          />
          <KpiCard
            label="Confirmed Signals"
            value={stats?.signal_posts?.toLocaleString() ?? '0'}
            tone="signal"
            note={`${signalRate}% of ingested items are clearing the signal threshold.`}
          />
          <KpiCard
            label="Open Alerts"
            value={stats?.unacknowledged_alerts?.toLocaleString() ?? '0'}
            tone="danger"
            note={`${stats?.total_alerts?.toLocaleString() ?? '0'} total alerts generated so far.`}
          />
          <KpiCard
            label="Credentials Exposure"
            value={stats?.credential_posts?.toLocaleString() ?? '0'}
            tone="warning"
            note={`${stats?.ioc_posts?.toLocaleString() ?? '0'} posts also carry IOC evidence.`}
          />
          <KpiCard
            label="Critical / High"
            value={`${alertsBySeverity.critical ?? 0} / ${alertsBySeverity.high ?? 0}`}
            tone="neutral"
            note="Fast read on the incidents most likely to require analyst intervention."
          />
        </div>
      </section>

      {error ? <ErrorBanner message={error} /> : null}

      {dashboard && alertSummary ? <MetricCardsPanel stats={dashboard.stats} summary={alertSummary} /> : null}

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="grid gap-4 lg:grid-cols-2">
          <AlertTrendChart data={timeSeries} />
          <SignalTrendChart data={timeSeries} />
        </div>

        <div
          className="rounded-[28px] border p-5"
          style={{
            background: 'linear-gradient(180deg, rgba(11,19,29,0.92), rgba(14,24,36,0.94))',
            borderColor: 'rgba(128, 152, 168, 0.14)',
          }}
        >
          <div
            className="font-mono text-[10px] uppercase"
            style={{ color: 'rgba(157, 176, 188, 0.62)', letterSpacing: '0.18em' }}
          >
            Incident posture
          </div>
          <div
            className="mt-2 font-['Sora'] text-2xl font-semibold"
            style={{ color: '#edf5f1' }}
          >
            Severity distribution and response pressure.
          </div>
          <p
            className="mt-3 font-['Manrope'] text-sm"
            style={{ color: 'rgba(175, 201, 216, 0.72)', lineHeight: 1.7 }}
          >
            Use this panel to understand whether the backlog is dominated by urgent cases or by low-grade
            monitoring noise.
          </p>
          <div className="mt-5">
            <AlertDistributionChart summary={alertSummary} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <AlertFeedPanel alerts={recentAlerts ?? []} onRefresh={refresh} />
        {dashboard ? <RecentSignalsPanel signals={dashboard.recent_signals ?? []} /> : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <FeedbackPanel />
        <div
          className="rounded-[28px] border p-5"
          style={{
            background: 'linear-gradient(180deg, rgba(11,19,29,0.92), rgba(14,24,36,0.94))',
            borderColor: 'rgba(128, 152, 168, 0.14)',
          }}
        >
          <div
            className="font-mono text-[10px] uppercase"
            style={{ color: 'rgba(157, 176, 188, 0.62)', letterSpacing: '0.18em' }}
          >
            SOC notes
          </div>
          <div
            className="mt-2 font-['Sora'] text-2xl font-semibold"
            style={{ color: '#edf5f1' }}
          >
            What this dashboard is optimized for.
          </div>
          <div className="mt-5 space-y-3">
            {[
              'Dense but readable KPI framing, so analysts can understand state changes without opening every module.',
              'Charts emphasize movement over decoration and stay useful under rapid polling.',
              'Action surfaces stay close to the live feed so acknowledgment and validation are never hidden.',
              'The design system now favors restrained tones with precise accents instead of generic neon cyber styling.',
            ].map((item) => (
              <div
                key={item}
                className="rounded-[20px] border px-4 py-3"
                style={{
                  borderColor: 'rgba(128, 152, 168, 0.12)',
                  background: 'rgba(17, 29, 43, 0.62)',
                }}
              >
                <p
                  className="font-['Manrope'] text-sm"
                  style={{ color: 'rgba(175, 201, 216, 0.76)', lineHeight: 1.7 }}
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
