import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, LogOut, User, Settings } from 'lucide-react';
import { getPageTitle } from './Sidebar';

export interface TopbarProps {
  /** Live notification count; badge hidden when zero. */
  notificationCount?: number;
}

const Topbar: React.FC<TopbarProps> = ({ notificationCount = 0 }) => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex min-h-[4rem] shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      <h1 className="min-w-0 shrink-0 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{title}</h1>

      <div className="mx-auto hidden max-w-xl flex-1 md:block">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-base text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            autoComplete="off"
          />
        </label>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="relative rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
          aria-label="Notifications"
        >
          <Bell className="h-6 w-6" strokeWidth={2} />
          {notificationCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold leading-none text-white">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
          >
            SE
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-base text-slate-700 hover:bg-slate-50"
              >
                <User className="h-5 w-5 text-slate-500" strokeWidth={2} />
                Profile
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-base text-slate-700 hover:bg-slate-50"
              >
                <Settings className="h-5 w-5 text-slate-500" strokeWidth={2} />
                Settings
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-base text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" strokeWidth={2} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
