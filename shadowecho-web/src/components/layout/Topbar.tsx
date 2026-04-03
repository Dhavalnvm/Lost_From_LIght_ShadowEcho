import React, { useEffect, useState } from 'react';

const Topbar: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between border-b px-6 py-4 backdrop-blur-xl"
      style={{
        background: 'linear-gradient(180deg, rgba(7,16,24,0.92), rgba(7,16,24,0.78))',
        borderColor: 'rgba(128, 152, 168, 0.12)',
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="grid h-12 w-12 place-items-center rounded-2xl border"
          style={{
            borderColor: 'rgba(91, 228, 183, 0.22)',
            background: 'linear-gradient(135deg, rgba(91,228,183,0.14), rgba(135,191,255,0.1))',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <img
            src="/shadowecho-logo.png"
            alt="ShadowEcho"
            className="h-8 w-8 object-contain select-none"
            draggable={false}
          />
        </div>

        <div className="min-w-0">
          <div
            className="font-mono text-[10px] uppercase"
            style={{ color: 'rgba(157, 176, 188, 0.72)', letterSpacing: '0.26em' }}
          >
            SecOps Command Surface
          </div>
          <div className="mt-1 flex items-center gap-3">
            <span
              className="font-['Sora'] text-[20px] font-semibold"
              style={{ color: '#edf5f1' }}
            >
              ShadowEcho
            </span>
            <span
              className="rounded-full border px-3 py-1 font-mono text-[9px] uppercase"
              style={{
                borderColor: 'rgba(135, 191, 255, 0.2)',
                color: 'rgba(175, 212, 234, 0.84)',
                letterSpacing: '0.18em',
                background: 'rgba(135, 191, 255, 0.08)',
              }}
            >
              Threat Monitoring
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="hidden items-center gap-2 rounded-full border px-4 py-2 md:flex"
          style={{
            borderColor: 'rgba(128, 152, 168, 0.16)',
            background: 'rgba(17, 29, 43, 0.72)',
          }}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#5be4b7] shadow-[0_0_12px_rgba(91,228,183,0.85)]" />
          <span
            className="font-mono text-[10px] uppercase"
            style={{ color: '#d8efe8', letterSpacing: '0.2em' }}
          >
            Detection Pipeline Live
          </span>
        </div>

        <div
          className="rounded-[18px] border px-4 py-2"
          style={{
            borderColor: 'rgba(128, 152, 168, 0.14)',
            background: 'linear-gradient(180deg, rgba(17,29,43,0.82), rgba(13,23,35,0.86))',
          }}
        >
          <div
            className="font-mono text-[9px] uppercase"
            style={{ color: 'rgba(157, 176, 188, 0.56)', letterSpacing: '0.16em' }}
          >
            Local Time
          </div>
          <div
            className="mt-1 font-['Sora'] text-base font-semibold tabular-nums"
            style={{ color: '#edf5f1' }}
          >
            {time.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
