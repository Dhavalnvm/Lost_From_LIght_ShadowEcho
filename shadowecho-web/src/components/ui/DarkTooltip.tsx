import React from 'react';

interface TooltipPayload {
  name?: string;
  value?: string | number;
  color?: string;
}

interface DarkTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const DarkTooltip: React.FC<DarkTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-bg-elevated border border-bg-border p-3" style={{ borderRadius: 0 }}>
      {label ? <p className="font-mono text-[10px] text-text-muted mb-2">{label}</p> : null}
      {payload.map((item, idx) => (
        <div key={`${item.name}-${idx}`} className="flex items-center gap-2">
          <span className="w-2 h-2" style={{ background: item.color ?? '#00c8f0' }} />
          <span className="font-mono text-[10px] text-text-secondary">{item.name}</span>
          <span className="font-mono text-[10px] text-text-primary">{String(item.value ?? '-')}</span>
        </div>
      ))}
    </div>
  );
};

export default DarkTooltip;
