// src/components/layout/Sidebar.tsx
// Light/white theme sidebar — hover-to-expand rail + pin toggle
// 100% compatible with existing App.tsx props

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bot,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Hexagon,
  LayoutDashboard,
  Radar,
  ScanSearch,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────── */
export interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeColor?: string;
}

interface SidebarProps {
  items?: NavItem[];
  activePath?: string;
  onNavigate?: (path: string) => void;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  appName?: string;
  appTagline?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

/* ─── Design tokens — light theme ───────────────────────────────── */
const C = {
  bg:           '#ffffff',
  border:       '#e2e8f0',          // slate-200
  accent:       '#2563eb',          // blue-600
  accentLight:  '#eff6ff',          // blue-50
  accentBorder: 'rgba(37,99,235,0.15)',
  textPrimary:  '#0f172a',          // slate-900
  textSecond:   '#475569',          // slate-600
  textMuted:    '#94a3b8',          // slate-400
  hoverBg:      '#f8fafc',          // slate-50
  activeBg:     '#eff6ff',          // blue-50
  activeText:   '#2563eb',          // blue-600
  shadow:       '2px 0 16px rgba(0,0,0,0.06)',
};

/* ─── NavButton ──────────────────────────────────────────────────── */
const NavButton: React.FC<{
  item: NavItem;
  isActive: boolean;
  showLabel: boolean;
  onNavigate: (path: string) => void;
}> = ({ item, isActive, showLabel, onNavigate }) => {
  const [hov, setHov] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onNavigate(item.path)}
      title={!showLabel ? item.label : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        gap: showLabel ? 10 : 0,
        justifyContent: showLabel ? 'flex-start' : 'center',
        borderRadius: 10,
        padding: '9px 11px',
        fontSize: 13.5,
        fontWeight: isActive ? 600 : 500,
        border: 'none',
        cursor: 'pointer',
        outline: 'none',
        transition: 'background 0.14s, color 0.14s',
        background: isActive
          ? C.activeBg
          : hov
          ? C.hoverBg
          : 'transparent',
        color: isActive
          ? C.activeText
          : hov
          ? C.textPrimary
          : C.textSecond,
      }}
    >
      {/* Icon */}
      <span style={{
        flexShrink: 0,
        width: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isActive ? C.activeText : hov ? C.textPrimary : C.textMuted,
        transition: 'color 0.14s',
      }}>
        {item.icon}
      </span>

      {/* Label */}
      <span style={{
        flex: 1,
        textAlign: 'left',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        opacity: showLabel ? 1 : 0,
        maxWidth: showLabel ? 180 : 0,
        transition: 'opacity 0.18s, max-width 0.2s',
        pointerEvents: 'none',
      }}>
        {item.label}
      </span>

      {/* Badge */}
      {item.badge !== undefined && showLabel && (
        <span style={{
          flexShrink: 0,
          padding: '1px 6px',
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 600,
          background: `${item.badgeColor ?? C.accent}12`,
          color: item.badgeColor ?? C.accent,
          border: `1px solid ${item.badgeColor ?? C.accent}30`,
        }}>
          {item.badge}
        </span>
      )}
    </button>
  );
};

/* ─── FooterButton ───────────────────────────────────────────────── */
const FooterBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  showLabel: boolean;
  onClick?: () => void;
  bordered?: boolean;
  title?: string;
}> = ({ icon, label, showLabel, onClick, bordered, title }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        gap: showLabel ? 10 : 0,
        justifyContent: showLabel ? 'flex-start' : 'center',
        borderRadius: 10,
        padding: '9px 11px',
        fontSize: 13.5,
        fontWeight: 500,
        cursor: 'pointer',
        outline: 'none',
        transition: 'background 0.14s, color 0.14s, border-color 0.14s',
        background: hov ? (bordered ? '#eff6ff' : C.hoverBg) : 'transparent',
        color: hov ? (bordered ? C.accent : C.textPrimary) : C.textSecond,
        border: bordered ? `1px solid ${hov ? C.accentBorder : C.border}` : 'none',
      }}
    >
      <span style={{
        flexShrink: 0,
        width: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'inherit',
      }}>
        {icon}
      </span>
      <span style={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        opacity: showLabel ? 1 : 0,
        maxWidth: showLabel ? 180 : 0,
        transition: 'opacity 0.18s, max-width 0.2s',
        pointerEvents: 'none',
      }}>
        {label}
      </span>
    </button>
  );
};

/* ─── Sidebar ────────────────────────────────────────────────────── */
const Sidebar: React.FC<SidebarProps> = ({
  items,
  activePath,
  onNavigate,
  expanded,
  onToggleExpanded,
  collapsed,
  onToggle,
  appName = 'ShadowEcho',
  appTagline = 'Threat Monitoring',
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const navItems = items ?? DEFAULT_NAV_ITEMS;
  const resolvedActivePath = activePath ?? location.pathname;
  const resolvedOnNavigate = onNavigate ?? ((path: string) => navigate(path));
  const isPinnedOpen = typeof expanded === 'boolean' ? expanded : !(collapsed ?? true);
  const resolvedOnToggle = onToggleExpanded ?? onToggle ?? (() => {});
  const showFull = isPinnedOpen || hovered;

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: showFull ? 240 : 64,
        background: C.bg,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        zIndex: 50,
        boxShadow: C.shadow,
      }}
    >
      {/* ── Brand ────────────────────────────────────────────── */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 12px',
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Icon mark */}
        <div style={{
          width: 40,
          height: 40,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          background: C.accentLight,
          border: `1px solid ${C.accentBorder}`,
        }}>
          <Hexagon size={20} strokeWidth={1.5} color={C.accent} />
        </div>

        {/* Brand text */}
        <div style={{
          overflow: 'hidden',
          opacity: showFull ? 1 : 0,
          transform: showFull ? 'translateX(0)' : 'translateX(-8px)',
          transition: 'opacity 0.18s 0.04s, transform 0.18s 0.04s',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          <p style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: C.textPrimary,
            letterSpacing: '0.01em',
            lineHeight: 1.2,
          }}>
            {appName}
          </p>
          <p style={{
            fontSize: 10,
            color: C.textMuted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginTop: 3,
          }}>
            {appTagline}
          </p>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav style={{
        flex: 1,
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {navItems.map(item => (
          <NavButton
            key={item.path}
            item={item}
            isActive={resolvedActivePath === item.path}
            showLabel={showFull}
            onNavigate={resolvedOnNavigate}
          />
        ))}
      </nav>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div style={{
        borderTop: `1px solid ${C.border}`,
        padding: '8px 8px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        <FooterBtn
          icon={<Settings size={18} />}
          label="Settings"
          showLabel={showFull}
          title={!showFull ? 'Settings' : undefined}
        />

        <FooterBtn
          icon={isPinnedOpen
            ? <ChevronsLeft size={18} />
            : <ChevronsRight size={18} />
          }
          label={isPinnedOpen ? 'Hover Rail' : 'Pin Open'}
          showLabel={showFull}
          onClick={resolvedOnToggle}
          bordered
          title={!showFull ? (isPinnedOpen ? 'Collapse' : 'Pin Open') : undefined}
        />

        {/* Live dot */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '7px 11px',
          justifyContent: showFull ? 'flex-start' : 'center',
        }}>
          <span style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
            <span style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: '#22c55e',
              opacity: 0.4,
              animation: 'se-ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
            }} />
            <span style={{
              width: 8, height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              display: 'block',
            }} />
          </span>
          <span style={{
            fontSize: 10,
            color: C.textMuted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            opacity: showFull ? 1 : 0,
            maxWidth: showFull ? 160 : 0,
            transition: 'opacity 0.18s, max-width 0.2s',
          }}>
            Live monitoring
          </span>
        </div>
      </div>

      <style>{`
        @keyframes se-ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;

/* ─── Default nav items ──────────────────────────────────────────── */
export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { path: '/',        label: 'Overview',  icon: <LayoutDashboard size={18} /> },
  { path: '/alerts',  label: 'Alerts',    icon: <ShieldAlert size={18} /> },
  { path: '/chat',    label: 'Assistant', icon: <Bot size={18} /> },
  { path: '/mirror',  label: 'Mirror',    icon: <Radar size={18} /> },
  { path: '/lineup',  label: 'Lineup',    icon: <Users size={18} /> },
  { path: '/impact',  label: 'Impact',    icon: <BarChart3 size={18} /> },
  { path: '/decode',  label: 'Decoder',   icon: <ScanSearch size={18} /> },
  { path: '/notebook', label: 'Notebook',  icon: (
      <svg width="19" height="19" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="2" width="12" height="14" rx="1.5"
          stroke="currentColor" strokeWidth="1.6"
          fill="currentColor" fillOpacity="0.12"
        />
        <line x1="6" y1="2" x2="6" y2="16"
          stroke="currentColor" strokeWidth="1.3" opacity="0.6"
        />
        <line x1="8.5" y1="6"  x2="13" y2="6"  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
        <line x1="8.5" y1="9"  x2="13" y2="9"  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
        <line x1="8.5" y1="12" x2="11" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      </svg>
    ) },
  { path: '/report',  label: 'Reports',   icon: <FileText size={18} /> },
];

/* ─── Page title helper ──────────────────────────────────────────── */
const PAGE_TITLES: Record<string, string> = {
  '/':         'Overview',
  '/alerts':   'Alert Feed',
  '/chat':     'Analyst Assistant',
  '/mirror':   'The Mirror',
  '/lineup':   'The Lineup',
  '/impact':   'Leak Impact',
  '/decode':   'Slang Decoder',
  '/notebook': 'The Notebook',
  '/report':   'Report Generator',
};

export function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const segment = pathname.split('/')[1] ?? '';
  return segment.charAt(0).toUpperCase() + segment.slice(1) || 'ShadowEcho';
}
