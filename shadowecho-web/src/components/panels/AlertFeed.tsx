import React, { useState } from 'react';
import { acknowledgeAlert } from '../../services/api';
import type { Alert } from '../../types/api';
import { Card, EmptyState, SectionHeader, SeverityBadge, Spinner } from '../common';

interface Props {
  alerts: Alert[];
  onRefresh?: () => Promise<unknown> | void;
}

const AlertFeedPanel: React.FC<Props> = ({ alerts, onRefresh }) => {
  const [acking, setAcking] = useState<Set<number | string>>(new Set());

  const handleAcknowledge = async (id: number | string) => {
    setAcking(prev => new Set(prev).add(id));
    try {
      await acknowledgeAlert(id);
      await onRefresh?.();
    } finally {
      setAcking(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <Card className="animate-fade-in">
      <SectionHeader
        title="Alert Feed"
        accent="04"
        subtitle={`${alerts.length} recent alerts`}
      />

      {alerts.length === 0 ? (
        <EmptyState message="No recent alerts available" />
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => {
            const isAcking = acking.has(alert.id);
            const isAcknowledged = alert.acknowledged;

            return (
              <div
                key={alert.id}
                className={`rounded-lg border p-3 transition-all duration-200 ${
                  isAcknowledged
                    ? 'border-bg-border bg-bg-elevated opacity-60'
                    : alert.severity === 'critical'
                      ? 'border-accent-red/20 bg-accent-red/5 hover:border-accent-red/35'
                      : alert.severity === 'high'
                        ? 'border-accent-amber/20 bg-accent-amber/5 hover:border-accent-amber/35'
                        : 'border-bg-border bg-bg-elevated hover:border-accent-cyan/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <SeverityBadge severity={alert.severity} className="shrink-0" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs text-text-primary">
                      {alert.title || 'Untitled alert'}
                    </p>
                    <p className="mt-1 line-clamp-2 font-mono text-[10px] text-text-muted">
                      {alert.summary || 'No alert summary provided.'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-text-secondary">
                      <span>Confidence {(alert.confidence * 100).toFixed(0)}%</span>
                      {alert.post_id && <span>Post {String(alert.post_id).slice(0, 8)}...</span>}
                      {alert.created_at && (
                        <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
                      )}
                    </div>
                  </div>

                  {!isAcknowledged ? (
                    <button
                      type="button"
                      onClick={() => void handleAcknowledge(alert.id)}
                      disabled={isAcking}
                      className="shrink-0 rounded-lg border border-accent-green/25 bg-accent-green/10 px-3 py-1.5 font-mono text-[10px] text-accent-green transition-all hover:bg-accent-green/20 disabled:opacity-40"
                    >
                      {isAcking ? <Spinner size="sm" /> : 'Acknowledge'}
                    </button>
                  ) : (
                    <span className="shrink-0 font-mono text-[10px] text-accent-green/60">
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default AlertFeedPanel;
