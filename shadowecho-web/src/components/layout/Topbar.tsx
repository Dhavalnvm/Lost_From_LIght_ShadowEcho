import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, LogOut, Search, Settings, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/alerts': 'Alerts',
  '/decode': 'Decoder',
  '/mirror': 'Mirror',
  '/impact': 'Analytics',
  '/lineup': 'Lineup',
  '/report': 'Reports',
  '/chat': 'Assistant',
};

const Topbar: React.FC = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const title = useMemo(
    () => pageTitles[location.pathname] ?? 'ShadowEcho',
    [location.pathname],
  );

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="mx-6 hidden max-w-xl flex-1 lg:block">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search alerts, indicators, or incidents"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1.5 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              SE
            </div>
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-12 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/70">
              {[
                { label: 'Profile', icon: User },
                { label: 'Settings', icon: Settings },
                { label: 'Logout', icon: LogOut },
              ].map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
