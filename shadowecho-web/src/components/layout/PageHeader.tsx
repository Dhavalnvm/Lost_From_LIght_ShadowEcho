import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => (
  <div className="mb-7 flex items-end justify-between gap-4 border-b border-[#16314b] pb-5">
    <div className="min-w-0">
      <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.35em] text-[#5b7691]">
        ShadowEcho Module
      </div>
      <h1 className="font-display text-4xl font-bold tracking-[0.04em] text-[#f3f8ff]">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-2 max-w-3xl font-mono text-sm tracking-[0.2em] text-[#88a3bb]">
          {subtitle}
        </p>
      )}
    </div>

    <div className="flex items-center gap-3 self-center">
      {action}
    </div>
  </div>
);

export default PageHeader;
