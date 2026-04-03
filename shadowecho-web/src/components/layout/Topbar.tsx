import React, { useEffect, useState } from 'react';

const Topbar: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="h-[72px] border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-50"
      style={{
        background: 'rgba(6,14,26,0.9)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* LEFT */}
      <div className="flex items-center gap-5">
        <img
          src="/shadowecho-logo.png"
          alt="ShadowEcho"
          className="h-14 sm:h-16 w-auto object-contain select-none"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(0,255,150,0.25))',
          }}
          draggable={false}
        />

        <div className="hidden lg:flex flex-col leading-tight">
          <span className="text-[13px] tracking-[3px] text-gray-300 font-mono">
            THREAT INTELLIGENCE
          </span>
          <span className="text-[10px] tracking-[2px] text-gray-500 font-mono">
            REAL-TIME DARK WEB MONITORING
          </span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-md border border-green-400/30 bg-green-400/10">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-[11px] tracking-[2px] font-mono text-green-400">
            LIVE
          </span>
        </div>

        <div className="font-mono text-base text-gray-300 tabular-nums">
          {time.toLocaleTimeString()}
        </div>
      </div>
    </header>
  );
};

export default Topbar;