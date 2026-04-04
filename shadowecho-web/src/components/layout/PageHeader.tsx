import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => (
  <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
    <div className="min-w-0">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
        ShadowEcho Module
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
      {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p> : null}
    </div>
    {action ? <div className="flex items-center gap-3">{action}</div> : null}
  </div>
);

export default PageHeader;
