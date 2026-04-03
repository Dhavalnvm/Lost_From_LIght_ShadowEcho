import React from 'react';
import type { DashboardStats, AlertSummary } from '../../types/api';

interface MetricCardsProps {
  stats: DashboardStats;
  summary: AlertSummary;
}

interface MetricItem {
  label: string;
  value: number | string;
  sub?: string;
  accent: string;
  bg: string;
  icon: string;
}

const MetricCard: React.FC<MetricItem> = ({ label, value, sub, accent, bg, icon }) => (
  <div className={`relative bg-[linear-gradient(135deg,#060e1a,#0a1525)] border border-bg-border p-5 overflow-hidden group hover:border-opacity-60 transition-all duration-300`}>
    <div className={`absolute inset-0 ${bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-3">
        <span className="text-text-muted font-mono text-[7px] uppercase tracking-[4px]">{label}</span>
        <span className={`text-sm ${accent}`}>{icon}</span>
      </div>
      <div className={`font-display text-[36px] leading-none font-black ${accent} tabular-nums`}>{value}</div>
      {sub && <div className="text-text-secondary font-sans text-[10px] mt-2">{sub}</div>}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] opacity-60" style={{ background: 'radial-gradient(circle at center, rgba(0,200,240,0.8), transparent 70%)' }} />
    </div>
  </div>
);

const MetricCardsPanel: React.FC<MetricCardsProps> = ({ stats, summary }) => {
  const cards: MetricItem[] = [
    {
      label: 'Total Posts',
      value: stats.total_posts.toLocaleString(),
      sub: 'ingested across all sources',
      accent: 'text-accent-cyan',
      bg: 'bg-accent-cyan/5',
      icon: '◈',
    },
    {
      label: 'Signal Posts',
      value: stats.signal_posts.toLocaleString(),
      sub: `${stats.total_posts > 0 ? ((stats.signal_posts / stats.total_posts) * 100).toFixed(1) : 0}% signal rate`,
      accent: 'text-accent-green',
      bg: 'bg-accent-green/5',
      icon: '◉',
    },
    {
      label: 'Total Alerts',
      value: stats.total_alerts.toLocaleString(),
      sub: `${stats.unacknowledged_alerts} unacknowledged`,
      accent: 'text-accent-amber',
      bg: 'bg-accent-amber/5',
      icon: '◬',
    },
    {
      label: 'Critical Alerts',
      value: summary.critical,
      sub: `+ ${summary.high} high severity`,
      accent: 'text-accent-red',
      bg: 'bg-accent-red/5',
      icon: '⬡',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(card => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
  );
};

export default MetricCardsPanel;
