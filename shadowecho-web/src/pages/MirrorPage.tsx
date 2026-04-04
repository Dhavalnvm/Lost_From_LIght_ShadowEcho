import React, { useEffect, useState } from 'react';
import { Card, SectionHeader } from '../components/common';
import PageHeader from '../components/layout/PageHeader';
import MirrorPanel from '../components/panels/MirrorPanel';
import { fetchDashboard } from '../services/api';
import type { DashboardResponse } from '../types/api';
import { FALLBACK_DASHBOARD } from '../data/fallbackData';

const MirrorPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    fetchDashboard()
      .then((response) => setDashboard((response.stats.total_posts ?? 0) > 0 ? response : FALLBACK_DASHBOARD))
      .catch(() => setDashboard(FALLBACK_DASHBOARD));
  }, []);

  const totalPosts = dashboard?.stats.total_posts ?? 0;
  const sources = Object.keys(dashboard?.stats.posts_by_source ?? {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="The Mirror"
        subtitle="Organization mention search with a light analyst workflow and live source coverage from the backend."
        action={
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-right">
            <div className="text-2xl font-semibold text-blue-700">{totalPosts.toLocaleString()}</div>
            <div className="text-xs uppercase tracking-wide text-blue-600">Posts in index</div>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <MirrorPanel />

        <div className="space-y-6">
          <Card>
            <SectionHeader title="How It Works" subtitle="The backend path behind the mirror search" accent="Flow" />
            <div className="space-y-3">
              {[
                'Exact match search checks the SQLite-backed corpus for direct organization mentions.',
                'Semantic search augments exact hits with vector similarity results from the embedding store.',
                'Credential and IOC enrichment is reapplied per result before returning the final panel response.',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Coverage Snapshot" subtitle="Live source distribution from `/api/dashboard`" accent="Live" />
            <div className="space-y-3">
              {sources.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Source coverage will appear when dashboard stats are available.
                </div>
              ) : (
                sources.map((source) => (
                  <div key={source} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize text-slate-700">{source}</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {dashboard?.stats.posts_by_source[source] ?? 0}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MirrorPage;
