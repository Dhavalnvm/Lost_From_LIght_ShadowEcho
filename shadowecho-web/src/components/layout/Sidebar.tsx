import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  group?: string;
}

const SIDEBAR_COLLAPSED = 84;
const SIDEBAR_EXPANDED = 292;

const IconOverview = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
    <rect x="11" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
    <rect x="2" y="11" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
    <rect x="11" y="11" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const IconAlerts = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M9 2L16 15H2L9 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <line x1="9" y1="6.5" x2="9" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="9" cy="12.7" r="0.9" fill="currentColor" />
  </svg>
);

const IconDecoder = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="6.4" stroke="currentColor" strokeWidth="1.4" />
    <line x1="2.6" y1="9" x2="15.4" y2="9" stroke="currentColor" strokeWidth="1.4" />
    <path d="M9 2.8C10.8 5 10.8 13 9 15.2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M9 2.8C7.2 5 7.2 13 9 15.2" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const IconMirror = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M9 2V16" stroke="currentColor" strokeWidth="1.4" />
    <path d="M3.2 4.4L9 2L14.8 4.4V13.6L9 16L3.2 13.6V4.4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

const IconImpact = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="6.4" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="9" cy="9" r="3.6" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="9" cy="9" r="1.4" fill="currentColor" />
  </svg>
);

const IconLineup = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <line x1="2" y1="4" x2="16" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="2" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <rect x="4" y="2.3" width="3.6" height="3.4" rx="0.8" fill="currentColor" opacity="0.55" />
    <rect x="9.6" y="7.3" width="3.6" height="3.4" rx="0.8" fill="currentColor" opacity="0.55" />
  </svg>
);

const IconReport = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="4" y="2.2" width="9" height="13.6" rx="1.1" stroke="currentColor" strokeWidth="1.4" />
    <line x1="7.1" y1="5.4" x2="11.3" y2="5.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="7.1" y1="9" x2="11.3" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="7.1" y1="12.6" x2="11.3" y2="12.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const IconChat = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M2.6 3.1H15.4V11.6H10.1L7 14.8V11.6H2.6V3.1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="6.2" cy="7.2" r="1" fill="currentColor" />
    <circle cx="9" cy="7.2" r="1" fill="currentColor" />
    <circle cx="11.8" cy="7.2" r="1" fill="currentColor" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Overview', shortLabel: 'OV', icon: <IconOverview />, group: 'Monitor' },
  { path: '/alerts', label: 'Alerts', shortLabel: 'AL', icon: <IconAlerts />, group: 'Monitor' },
  { path: '/decode', label: 'Decoder', shortLabel: 'DE', icon: <IconDecoder />, group: 'Analyze' },
  { path: '/mirror', label: 'Mirror', shortLabel: 'MI', icon: <IconMirror />, group: 'Analyze' },
  { path: '/impact', label: 'Impact', shortLabel: 'IM', icon: <IconImpact />, group: 'Analyze' },
  { path: '/lineup', label: 'Lineup', shortLabel: 'LI', icon: <IconLineup />, group: 'Investigate' },
  { path: '/report', label: 'Report', shortLabel: 'RE', icon: <IconReport />, group: 'Investigate' },
  { path: '/chat', label: 'Assistant', shortLabel: 'AI', icon: <IconChat />, group: 'Investigate' },
];

const Sidebar: React.FC = () => {
  const groups = NAV_ITEMS.reduce<Record<string, NavItem[]>>((acc, item) => {
    const key = item.group ?? 'Other';
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});

  return (
    <aside
      className="sidebar-shell"
      style={{
        width: SIDEBAR_COLLAPSED,
        minWidth: SIDEBAR_COLLAPSED,
        flexShrink: 0,
      }}
    >
      <div className="sidebar-inner">
        <div className="sidebar-brand">
          {/* <div className="sidebar-brandMark"></div> */}
          <div className="sidebar-expandOnly">
            <div className="sidebar-brandTitle">
              Shadow<span>Echo</span>
            </div>
            <div className="sidebar-brandSub">Threat Operations Grid</div>
          </div>
        </div>

        <div className="sidebar-sectionLabel sidebar-expandOnly">Modules</div>

        <nav className="sidebar-nav">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="sidebar-group">
              <div className="sidebar-groupLabel sidebar-expandOnly">{group}</div>

              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className="sidebar-linkWrapper"
                >
                  {({ isActive }) => (
                    <div
                      className={`sidebar-link ${isActive ? 'sidebar-linkActive' : ''}`}
                      title={item.label}
                      aria-label={item.label}
                    >
                      <span className="sidebar-linkIcon">{item.icon}</span>
                      <span className="sidebar-linkText sidebar-expandOnly">{item.label}</span>
                      <span className="sidebar-linkShort">{item.shortLabel}</span>
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-status">
            <span className="sidebar-statusDot" />
            <span className="sidebar-expandOnly">Backend live</span>
            <span className="sidebar-linkShort">:8000</span>
          </div>
          <div className="sidebar-footerMeta sidebar-expandOnly">
            Hover rail navigation inspired by productivity-first analyst tooling.
          </div>
        </div>
      </div>

      <style>{`
        .sidebar-shell {
          position: sticky;
          top: 0;
          z-index: 40;
          height: 100vh;
          background:
            linear-gradient(180deg, rgba(7, 11, 20, 0.98) 0%, rgba(10, 16, 28, 0.98) 100%),
            radial-gradient(circle at top left, rgba(92, 224, 180, 0.12), transparent 34%);
          border-right: 1px solid rgba(121, 148, 168, 0.14);
          transition: width 0.24s ease, min-width 0.24s ease, box-shadow 0.24s ease;
          overflow: hidden;
          box-shadow: inset -1px 0 0 rgba(255,255,255,0.02);
        }

        .sidebar-shell:hover {
          width: ${SIDEBAR_EXPANDED}px !important;
          min-width: ${SIDEBAR_EXPANDED}px !important;
          box-shadow: 16px 0 32px rgba(0, 0, 0, 0.35);
        }

        .sidebar-inner {
          display: flex;
          height: 100%;
          flex-direction: column;
          padding: 18px 12px 14px;
          gap: 12px;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 10px 16px;
          border-bottom: 1px solid rgba(121, 148, 168, 0.12);
        }

        .sidebar-brandMark {
          width: 48px;
          min-width: 48px;
          height: 48px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-family: 'Sora', 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.24em;
          color: #f5fbf8;
          background:
            linear-gradient(135deg, rgba(91, 228, 183, 0.22), rgba(42, 90, 110, 0.18)),
            rgba(14, 23, 36, 0.96);
          border: 1px solid rgba(128, 200, 179, 0.22);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .sidebar-brandTitle {
          font-family: 'Sora', 'Syne', sans-serif;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #eef6f2;
          white-space: nowrap;
        }

        .sidebar-brandTitle span {
          color: #5be4b7;
        }

        .sidebar-brandSub {
          margin-top: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(151, 176, 189, 0.72);
          white-space: nowrap;
        }

        .sidebar-sectionLabel,
        .sidebar-groupLabel {
          padding: 0 12px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(151, 176, 189, 0.48);
        }

        .sidebar-nav {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .sidebar-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-linkWrapper {
          text-decoration: none;
        }

        .sidebar-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          min-height: 52px;
          padding: 12px 12px;
          border-radius: 16px;
          color: rgba(190, 206, 216, 0.78);
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
          border: 1px solid transparent;
          overflow: hidden;
        }

        .sidebar-link::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(91, 228, 183, 0.1), rgba(91, 228, 183, 0));
          opacity: 0;
          transition: opacity 0.18s ease;
        }

        .sidebar-link:hover {
          color: #f6fbf8;
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(132, 170, 182, 0.14);
          transform: translateX(2px);
        }

        .sidebar-link:hover::before,
        .sidebar-linkActive::before {
          opacity: 1;
        }

        .sidebar-linkActive {
          color: #f6fbf8;
          border-color: rgba(111, 224, 186, 0.2);
          background: linear-gradient(90deg, rgba(14, 28, 38, 0.98), rgba(13, 22, 32, 0.92));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .sidebar-linkIcon {
          position: relative;
          z-index: 1;
          width: 28px;
          min-width: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: inherit;
        }

        .sidebar-linkText {
          position: relative;
          z-index: 1;
          font-family: 'Manrope', 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }

        .sidebar-linkShort {
          margin-left: auto;
          position: relative;
          z-index: 1;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.18em;
          color: rgba(151, 176, 189, 0.5);
          text-transform: uppercase;
        }

        .sidebar-footer {
          margin-top: auto;
          padding: 12px 10px 6px;
          border-top: 1px solid rgba(121, 148, 168, 0.12);
        }

        .sidebar-status {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 36px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(200, 242, 222, 0.84);
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .sidebar-statusDot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #5be4b7;
          box-shadow: 0 0 14px rgba(91, 228, 183, 0.9);
          flex-shrink: 0;
        }

        .sidebar-footerMeta {
          margin-top: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          line-height: 1.6;
          color: rgba(151, 176, 189, 0.58);
        }

        .sidebar-expandOnly {
          opacity: 0;
          width: 0;
          overflow: hidden;
          transition: opacity 0.14s ease;
          white-space: nowrap;
        }

        .sidebar-shell:hover .sidebar-expandOnly {
          opacity: 1;
          width: auto;
          overflow: visible;
        }

        .sidebar-shell:hover .sidebar-linkShort {
          display: none;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
