import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => (
  <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">ShadowEcho</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>

      {subtitle && <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-600">{subtitle}</p>}
    </div>

    <div className="flex shrink-0 items-center gap-3 self-start sm:self-center">{action}</div>
  </div>
);

export default PageHeader;
