import React, { useState } from 'react';
import { acknowledgeAlert } from '../../services/api';
import type { Alert } from '../../types/api';
import { Card, EmptyState, SectionHeader, SeverityBadge } from '../common';

interface Props {
  alerts: Alert[];
  onRefresh?: () => Promise<unknown> | void;
}

const AlertFeedPanel: React.FC<Props> = ({ alerts, onRefresh }) => {
  const [acking, setAcking] = useState<Set<number | string>>(new Set());

  const handleAcknowledge = async (id: number | string) => {
    setAcking((current) => new Set(current).add(id));
    try {
      await acknowledgeAlert(id);
      await onRefresh?.();
    } finally {
      setAcking((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <Card>
      <SectionHeader title="Alert Feed" subtitle={`${alerts.length} recent alerts`} accent="Feed" />
      {alerts.length === 0 ? (
        <EmptyState message="No recent alerts available." />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={String(alert.id)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <SeverityBadge severity={alert.severity} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{alert.title || 'Untitled alert'}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{alert.summary || 'No alert summary provided.'}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>Confidence {((alert.confidence ?? 0) * 100).toFixed(0)}%</span>
                    {alert.post_id ? <span>Post {String(alert.post_id).slice(0, 8)}…</span> : null}
                  </div>
                </div>
                {!alert.acknowledged ? (
                  <button
                    type="button"
                    onClick={() => void handleAcknowledge(alert.id)}
                    disabled={acking.has(alert.id)}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {acking.has(alert.id) ? 'Acknowledging…' : 'Acknowledge'}
                  </button>
                ) : (
                  <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">Acknowledged</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default AlertFeedPanel;
