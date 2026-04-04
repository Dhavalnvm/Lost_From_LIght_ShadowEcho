import React, { useEffect, useState } from 'react';
import { Card, SectionHeader } from '../components/common';
import PageHeader from '../components/layout/PageHeader';
import ChatPanel from '../components/panels/ChatPanel';
import { apiFetch, fetchDashboard } from '../services/api';
import type { DashboardResponse } from '../types/api';

interface ChatHealth {
  ollama_connected: boolean;
  chatbot_model?: { name: string; ready: boolean };
}

const ChatPage: React.FC = () => {
  const [health, setHealth] = useState<ChatHealth | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    apiFetch<ChatHealth>('/api/chat/health').then(setHealth).catch(() => {});
    fetchDashboard().then(setDashboard).catch(() => {});
  }, []);

  const sourceCount = Object.keys(dashboard?.stats.posts_by_source ?? {}).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analyst Assistant"
        subtitle="RAG-backed Q&A grounded in live ShadowEcho intelligence sources, alerts, and dashboard stats."
        action={
          <div className={`rounded-2xl border px-4 py-3 text-right ${health?.ollama_connected ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
            <div className="text-sm font-semibold">{health?.chatbot_model?.name ?? 'Assistant'}</div>
            <div className="text-xs uppercase tracking-wide">{health?.ollama_connected ? 'Online' : 'Offline'}</div>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ChatPanel />

        <div className="space-y-6">
          <Card>
            <SectionHeader title="RAG Data Sources" subtitle="What the assistant can ground against right now" accent="Live" />
            <div className="space-y-3">
              {[
                `Dashboard stats are available for ${dashboard?.stats.total_posts ?? 0} ingested posts.`,
                `Recent alert context includes ${dashboard?.stats.total_alerts ?? 0} total alerts and ${dashboard?.stats.unacknowledged_alerts ?? 0} unacknowledged alerts.`,
                `Organization and vector search context spans ${sourceCount} source buckets in the current snapshot.`,
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Suggested Questions" subtitle="Good prompts for grounded answers" accent="Guide" />
            <div className="space-y-2">
              {[
                'Summarize the latest critical alerts',
                'Which organizations are being targeted?',
                'Are there any credential leak spikes today?',
                'Describe the current threat landscape',
              ].map((question) => (
                <div key={question} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                  {question}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
