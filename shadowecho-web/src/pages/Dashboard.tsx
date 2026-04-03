// src/pages/Dashboard.tsx
import React from 'react';
import { useMonitoringData } from '../hooks/useMonitoringData';
import MetricCardsPanel from '../components/panels/MetricCards';
import { AlertTrendChart, SignalTrendChart } from '../components/charts/TrendCharts';
import AlertDistributionChart from '../components/charts/AlertDistribution';
import AlertFeedPanel from '../components/panels/AlertFeed';
import RecentSignalsPanel from '../components/panels/RecentSignals';
import FeedbackPanel from '../components/panels/FeedbackPanel';
import { ErrorBanner, LiveIndicator, Spinner } from '../components/common';

/* ── Mini stat pill ──────────────────────────────────────────────── */
const StatPill: React.FC<{ label: string; value: number | string; color: string; trend?: string }> = ({
  label, value, color, trend,
}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '14px 18px',
    border: '1px solid rgba(14,32,53,1)',
    background: 'rgba(7,16,28,0.9)',
    position: 'relative',
    overflow: 'hidden',
    minWidth: 110,
  }}>
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
      background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
    }} />
    <div style={{
      fontFamily: "'Share Tech Mono',monospace",
      fontSize: 8,
      letterSpacing: '0.25em',
      color: 'rgba(90,138,176,0.5)',
      textTransform: 'uppercase',
      marginBottom: 8,
    }}>
      {label}
    </div>
    <div style={{
      fontFamily: "'Orbitron',monospace",
      fontSize: 34,
      fontWeight: 900,
      color,
      lineHeight: 1,
      letterSpacing: '-1px',
    }}>
      {value}
    </div>
    {trend && (
      <div style={{
        fontFamily: "'Share Tech Mono',monospace",
        fontSize: 9,
        color: trend.startsWith('+') ? '#00ff88' : '#ff2244',
        marginTop: 4,
      }}>
        {trend}
      </div>
    )}
  </div>
);

/* ── Section label ───────────────────────────────────────────────── */
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontFamily: "'Share Tech Mono',monospace",
    fontSize: 9,
    letterSpacing: '0.3em',
    color: 'rgba(90,138,176,0.45)',
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 2,
  }}>
    {children}
  </div>
);

/* ── Page ────────────────────────────────────────────────────────── */
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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        gap: 20,
      }}>
        <Spinner />
        <span style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: 12,
          color: 'rgba(90,138,176,0.5)',
          letterSpacing: '0.2em',
        }}>
          CONNECTING TO SHADOWECHO BACKEND…
        </span>
      </div>
    );
  }

  const stats = dashboard?.stats;
  const snr = stats
    ? Math.round((stats.signal_posts / Math.max(stats.total_posts, 1)) * 100)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.3s ease' }}>

      {/* ── Top header bar ─────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 14,
        borderBottom: '1px solid rgba(14,32,53,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <h1 style={{
              fontFamily: "'Orbitron',monospace",
              fontSize: 22,
              fontWeight: 700,
              color: '#c8dff0',
              letterSpacing: '0.1em',
              lineHeight: 1,
            }}>
              OVERVIEW
            </h1>
            <p style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 10,
              color: 'rgba(90,138,176,0.6)',
              letterSpacing: '0.15em',
              marginTop: 4,
              textTransform: 'uppercase',
            }}>
              Real-time threat intelligence dashboard
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={refresh}
            style={{
              padding: '7px 14px',
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 9,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              background: 'transparent',
              border: '1px solid rgba(0,212,255,0.2)',
              color: '#00d4ff',
              cursor: 'pointer',
            }}
          >
            ↺ REFRESH
          </button>
          <LiveIndicator updatedAt={lastUpdated} />
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* ── KEY INDICATORS (Splunk style) ─────────────────────── */}
      <div>
        <SectionLabel>◈ Key Indicators</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          <StatPill label="Total Posts"      value={stats?.total_posts?.toLocaleString() ?? '—'}   color="#00d4ff" />
          <StatPill label="Signal Posts"     value={stats?.signal_posts?.toLocaleString() ?? '—'}  color="#00ff88" />
          <StatPill label="Noise Filtered"   value={((stats?.total_posts ?? 0) - (stats?.signal_posts ?? 0)).toLocaleString()} color="rgba(90,138,176,0.5)" />
          <StatPill label="Signal Rate"      value={`${snr}%`}                                     color={snr > 25 ? '#ff2244' : '#ffcc00'} />
          <StatPill label="Total Alerts"     value={stats?.total_alerts?.toLocaleString() ?? '—'}  color="#ff6600" />
          <StatPill label="Unacknowledged"   value={stats?.unacknowledged_alerts?.toLocaleString() ?? '—'} color="#ff2244" />
          <StatPill label="Cred Leaks"       value={stats?.credential_posts?.toLocaleString() ?? '—'} color="#ff2244" />
        </div>
      </div>

      {/* ── Metric cards (existing component) ────────────────── */}
      {dashboard && alertSummary && (
        <MetricCardsPanel stats={dashboard.stats} summary={alertSummary} />
      )}

      {/* ── Time-series charts ────────────────────────────────── */}
      <div>
        <SectionLabel>◈ Temporal Analysis</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <AlertTrendChart data={timeSeries} />
          <SignalTrendChart data={timeSeries} />
        </div>
      </div>

      {/* ── Distribution + Alert feed ─────────────────────────── */}
      <div>
        <SectionLabel>◈ Distribution + Live Feed</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 10 }}>
          {alertSummary && <AlertDistributionChart summary={alertSummary} />}
          <AlertFeedPanel alerts={recentAlerts ?? []} onRefresh={refresh} />
        </div>
      </div>

      {/* ── Signals + Feedback ───────────────────────────────── */}
      <div>
        <SectionLabel>◈ Recent Signals + Analyst Feedback</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {dashboard && <RecentSignalsPanel signals={dashboard.recent_signals ?? []} />}
          <FeedbackPanel />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;