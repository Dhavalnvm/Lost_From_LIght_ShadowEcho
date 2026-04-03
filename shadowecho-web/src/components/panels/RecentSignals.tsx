import React from 'react';
import type { SignalPost } from '../../types/api';
import { Card, SectionHeader } from '../common';

interface Props {
  signals: SignalPost[];
}

const RecentSignalsPanel: React.FC<Props> = ({ signals }) => (
  <Card className="animate-slide-up">
    <SectionHeader title="Recent Signals" accent="05" subtitle="high-confidence detections" />
    <div className="space-y-2 max-h-72 overflow-y-auto">
      {signals.length === 0 ? (
        <div className="text-center py-8 text-text-muted font-mono text-sm">No signals detected</div>
      ) : (
        signals.map(post => (
          <div
            key={post.id}
            className="p-3 bg-bg-elevated rounded-lg border border-bg-border hover:border-accent-cyan/20 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-cyan/10 border border-accent-cyan/20 rounded text-[10px] font-mono text-accent-cyan">
                  {post.source}
                </span>
                {post.author && (
                  <span className="text-text-muted font-mono text-[10px]">@{post.author}</span>
                )}
              </div>
              {post.signal_score !== undefined && (
                <span className="font-mono text-[10px] text-accent-green">
                  score: {post.signal_score.toFixed(2)}
                </span>
              )}
            </div>
            <p className="text-text-secondary font-mono text-[11px] leading-relaxed line-clamp-2">
              {post.body}
            </p>
          </div>
        ))
      )}
    </div>
  </Card>
);

export default RecentSignalsPanel;
