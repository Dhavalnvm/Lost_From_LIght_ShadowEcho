import React, { useState } from 'react';
import {
  BarChart3,
  Bell,
  Bot,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutDashboard,
  Radar,
  ScanSearch,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/alerts', label: 'Alerts', icon: ShieldAlert },
  { path: '/decode', label: 'Decoder', icon: ScanSearch },
  { path: '/mirror', label: 'Mirror', icon: Radar },
  { path: '/impact', label: 'Analytics', icon: BarChart3 },
  { path: '/lineup', label: 'Lineup', icon: Users },
  { path: '/report', label: 'Reports', icon: FileText },
  { path: '/chat', label: 'Assistant', icon: Bot },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const [hovered, setHovered] = useState(false);
  const expanded = hovered || !collapsed;

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out ${
        expanded ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
          <Bell className="h-5 w-5" />
        </div>
        {expanded ? (
          <div className="min-w-0 overflow-hidden">
            <p className="truncate text-sm font-semibold text-slate-900">ShadowEcho</p>
            <p className="truncate text-xs text-slate-500">Threat Monitoring Dashboard</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} end={path === '/'}>
            {({ isActive }) => (
              <div
                className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  expanded ? 'gap-3' : 'justify-center'
                } ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={label}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {expanded ? <span className="truncate">{label}</span> : null}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-2">
        <button
          type="button"
          className={`mb-2 flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 ${
            expanded ? 'gap-3' : 'justify-center'
          }`}
          title="Settings"
        >
          <Settings className="h-5 w-5 shrink-0" />
          {expanded ? <span>Settings</span> : null}
        </button>

        <button
          type="button"
          onClick={onToggle}
          className={`flex w-full items-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 ${
            expanded ? 'gap-3' : 'justify-center'
          }`}
          aria-label={collapsed ? 'Pin sidebar open' : 'Collapse sidebar to hover rail'}
          title={collapsed ? 'Pin open' : 'Return to hover rail'}
        >
          {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
          {expanded ? <span>{collapsed ? 'Pin Open' : 'Hover Rail'}</span> : null}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
