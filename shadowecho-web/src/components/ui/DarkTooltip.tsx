import React from 'react';

interface TooltipPayloadItem {
  color?: string;
  name?: string;
  value?: string | number;
}

interface DarkTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const DarkTooltip: React.FC<DarkTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/70">
      {label ? <p className="mb-2 text-xs font-medium text-slate-500">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((item, index) => (
          <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color ?? '#2563eb' }} />
              {item.name}
            </span>
            <span className="font-semibold text-slate-900">{String(item.value ?? '-')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DarkTooltip;
