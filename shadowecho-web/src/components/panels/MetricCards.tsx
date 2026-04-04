import React from 'react';
import type { AlertSummary, DashboardStats } from '../../types/api';
import { StatCard } from '../common';

interface MetricCardsProps {
  stats: DashboardStats;
  summary: AlertSummary;
}

const MetricCardsPanel: React.FC<MetricCardsProps> = ({ stats, summary }) => {
  const signalRate = stats.total_posts > 0 ? ((stats.signal_posts / stats.total_posts) * 100).toFixed(1) : '0';

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total Posts" value={stats.total_posts.toLocaleString()} sub="Ingested across all sources" accent="text-blue-600" />
      <StatCard label="Signal Posts" value={stats.signal_posts.toLocaleString()} sub={`${signalRate}% signal rate`} accent="text-green-600" />
      <StatCard label="Total Alerts" value={stats.total_alerts.toLocaleString()} sub={`${stats.unacknowledged_alerts} unacknowledged`} accent="text-amber-600" />
      <StatCard label="Critical Alerts" value={summary.critical} sub={`+ ${summary.high} high severity`} accent="text-red-600" />
    </div>
  );
};

export default MetricCardsPanel;
