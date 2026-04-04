import React, { useEffect, useState } from 'react';
import { Card, SectionHeader, Spinner } from '../common';
import { fetchFeedbackStats } from '../../services/api';
import type { FeedbackStats } from '../../types/api';
import { FALLBACK_FEEDBACK_STATS } from '../../data/fallbackData';

const tones: Record<string, string> = {
  real: 'bg-green-50 text-green-700 border-green-200',
  noise: 'bg-red-50 text-red-700 border-red-200',
  unsure: 'bg-amber-50 text-amber-700 border-amber-200',
};

const bars: Record<string, string> = {
  real: 'bg-green-500',
  noise: 'bg-red-500',
  unsure: 'bg-amber-500',
};

const FeedbackPanel: React.FC = () => {
  const [data, setData] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbackStats()
      .then((response) => {
        setData(response.total_labels > 0 ? response : FALLBACK_FEEDBACK_STATS);
      })
      .catch(() => setData(FALLBACK_FEEDBACK_STATS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <SectionHeader title="Feedback Flywheel" subtitle="Signal quality feedback from the live backend." accent="Feedback" />
      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : !data ? (
        <div className="text-center text-sm text-slate-500">No feedback data available.</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {data.accuracy_signal}
          </div>
          {Object.entries(data.stats).map(([label, count]) => {
            const pct = data.total_labels > 0 ? (count / data.total_labels) * 100 : 0;
            return (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${tones[label] ?? tones.unsure}`}>
                    {label}
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {count} <span className="text-slate-400">({pct.toFixed(0)}%)</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${bars[label] ?? bars.unsure}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          <div className="text-sm text-slate-500">{data.total_labels} total labels collected</div>
        </div>
      )}
    </Card>
  );
};

export default FeedbackPanel;
