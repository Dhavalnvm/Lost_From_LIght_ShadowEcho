import React, { useEffect, useState } from 'react';
import { fetchFeedbackStats } from '../../services/api';
import type { FeedbackStats } from '../../types/api';
import { Card, SectionHeader, Spinner } from '../common';

const LABEL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  real:   { bg: 'bg-accent-green/10',  text: 'text-accent-green',  border: 'border-accent-green/20' },
  noise:  { bg: 'bg-accent-red/10',    text: 'text-accent-red',    border: 'border-accent-red/20' },
  unsure: { bg: 'bg-accent-amber/10',  text: 'text-accent-amber',  border: 'border-accent-amber/20' },
};

const FeedbackPanel: React.FC = () => {
  const [data, setData] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbackStats()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="animate-fade-in">
      <SectionHeader title="Feedback Flywheel" accent="09" subtitle="signal quality health" />

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : !data ? (
        <p className="text-text-muted font-mono text-sm text-center py-6">No feedback data</p>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-bg-elevated rounded-lg border border-bg-border">
            <p className="font-mono text-xs text-text-secondary leading-relaxed">{data.accuracy_signal}</p>
          </div>

          <div className="space-y-2">
            {Object.entries(data.stats).map(([label, count]) => {
              const styles = LABEL_STYLES[label] ?? LABEL_STYLES.unsure;
              const pct = data.total_labels > 0 ? (count / data.total_labels) * 100 : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`px-2 py-0.5 rounded border font-mono text-[10px] font-semibold uppercase ${styles.bg} ${styles.text} ${styles.border}`}>
                      {label}
                    </span>
                    <span className="font-mono text-[10px] text-text-primary">{count} <span className="text-text-muted">({pct.toFixed(0)}%)</span></span>
                  </div>
                  <div className="h-1 bg-bg-base rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${styles.bg.replace('/10', '')}`}
                      style={{ width: `${pct}%`, opacity: 0.7 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-1">
            <span className="font-mono text-[10px] text-text-muted">
              {data.total_labels} total labels collected
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default FeedbackPanel;
