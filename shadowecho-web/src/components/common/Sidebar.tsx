import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  group?: string;
}

const SIDEBAR_WIDTH = 296;

const IconOverview = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
    <rect x="8" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
    <rect x="1" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
    <rect x="8" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const IconAlerts = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <line x1="7" y1="5.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="7" cy="10.5" r="0.6" fill="currentColor" />
  </svg>
);

const IconDecoder = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
    <line x1="1.5" y1="7" x2="12.5" y2="7" stroke="currentColor" strokeWidth="1.2" />
    <path d="M7 1.5C8.5 3.5 8.5 10.5 7 12.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M7 1.5C5.5 3.5 5.5 10.5 7 12.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const IconMirror = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1V13" stroke="currentColor" strokeWidth="1.2" />
    <path d="M2 3.5L7 1L12 3.5V10.5L7 13L2 10.5V3.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

const IconImpact = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="7" cy="7" r="1" fill="currentColor" />
  </svg>
);

const IconLineup = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="1" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <rect x="3" y="1.5" width="3" height="3" fill="currentColor" opacity="0.5" />
    <rect x="7" y="5.5" width="3" height="3" fill="currentColor" opacity="0.5" />
  </svg>
);

const IconReport = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="2" y="1" width="8" height="12" stroke="currentColor" strokeWidth="1.2" />
    <path d="M5 1V13" stroke="currentColor" strokeWidth="1.2" />
    <line x1="7" y1="4" x2="9.5" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="7" y1="7" x2="9.5" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="7" y1="10" x2="9.5" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const IconChat = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1.5 2H12.5V9.5H8L5 12.5V9.5H1.5V2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <circle cx="4.5" cy="6" r="0.8" fill="currentColor" />
    <circle cx="7" cy="6" r="0.8" fill="currentColor" />
    <circle cx="9.5" cy="6" r="0.8" fill="currentColor" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Overview', icon: <IconOverview />, group: 'Monitor' },
  { path: '/alerts', label: 'Alerts', icon: <IconAlerts />, group: 'Monitor' },
  { path: '/decode', label: 'Decoder', icon: <IconDecoder />, group: 'Analyze' },
  { path: '/mirror', label: 'Mirror', icon: <IconMirror />, group: 'Analyze' },
  { path: '/impact', label: 'Impact', icon: <IconImpact />, group: 'Analyze' },
  { path: '/lineup', label: 'Lineup', icon: <IconLineup />, group: 'Investigate' },
  { path: '/report', label: 'Report', icon: <IconReport />, group: 'Investigate' },
  { path: '/chat', label: 'Assistant', icon: <IconChat />, group: 'Investigate' },
];

const Sidebar: React.FC = () => {
  const groups = NAV_ITEMS.reduce<Record<string, NavItem[]>>((acc, item) => {
    const key = item.group ?? 'Other';
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});

  return (
    <aside
      style={{
        width: SIDEBAR_WIDTH,
        minWidth: SIDEBAR_WIDTH,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #050b14 0%, #07101c 100%)',
        borderRight: '1px solid rgba(28, 55, 82, 0.9)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* <div
        style={{
          padding: '26px 24px 20px',
          borderBottom: '1px solid rgba(28, 55, 82, 0.75)',
          background:
            'linear-gradient(180deg, rgba(8, 18, 31, 0.98) 0%, rgba(5, 11, 20, 0.96) 100%)',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: 1.8,
              color: '#ecf6ff',
              lineHeight: 0.96,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Shadow<span style={{ color: '#ff445f' }}>Echo</span>
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: '#6a88a6',
              letterSpacing: 3.2,
              textTransform: 'uppercase',
            }}
          >
            SOC Analysis Console
          </div>
        </div>
        <div
          style={{
            marginTop: 16,
            height: 1,
            background:
              'linear-gradient(90deg, rgba(0, 200, 240, 0.28) 0%, rgba(0, 200, 240, 0.08) 45%, transparent 100%)',
          }}
        />
      </div> */}

      <div
  style={{
    padding: '20px 20px 16px',
    borderBottom: '1px solid rgba(28, 55, 82, 0.75)',
    background:
      'linear-gradient(180deg, rgba(8, 18, 31, 0.98) 0%, rgba(5, 11, 20, 0.96) 100%)',
    overflow: 'hidden', // ✅ prevents overflow
  }}
>
  <div style={{ minWidth: 0 }}>
    <div
      style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: 18, // ✅ reduced from 26
        letterSpacing: 2.0, // ✅ reduced spacing
        color: '#ecf6ff',
        lineHeight: 1.1,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis', // ✅ prevents breaking layout
      }}
    >
      Shadow<span style={{ color: '#ff445f' }}>Echo</span>
    </div>

    <div
      style={{
        marginTop: 6,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: '#6a88a6',
        letterSpacing: 2,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      SOC Analysis Console
    </div>
  </div>

  <div
    style={{
      marginTop: 14,
      height: 1,
      background:
        'linear-gradient(90deg, rgba(0, 200, 240, 0.28) 0%, rgba(0, 200, 240, 0.08) 45%, transparent 100%)',
    }}
  />
</div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 12px 12px' }}>
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} style={{ marginBottom: 14 }}>
            <div
              style={{
                padding: '8px 14px 6px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: 3.4,
                color: '#58728b',
                textTransform: 'uppercase',
              }}
            >
              {group}
            </div>

            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                style={{ textDecoration: 'none' }}
              >
                {({ isActive }) => (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      marginBottom: 4,
                      padding: '13px 14px',
                      border: isActive
                        ? '1px solid rgba(55, 202, 243, 0.22)'
                        : '1px solid transparent',
                      borderLeft: isActive
                        ? '3px solid #3dd7ff'
                        : '3px solid transparent',
                      borderRadius: 8,
                      background: isActive
                        ? 'linear-gradient(90deg, rgba(8, 35, 53, 0.92) 0%, rgba(7, 22, 37, 0.96) 100%)'
                        : 'transparent',
                      color: isActive ? '#f5fbff' : '#86a4bf',
                      cursor: 'pointer',
                      transition: 'all 0.16s ease',
                      position: 'relative',
                      boxShadow: isActive
                        ? 'inset 0 1px 0 rgba(61, 215, 255, 0.08), 0 0 18px rgba(0, 0, 0, 0.18)'
                        : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.035)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(95, 127, 157, 0.18)';
                        (e.currentTarget as HTMLElement).style.color = '#d8e8f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = '#86a4bf';
                      }
                    }}
                  >
                    <span
                      style={{
                        color: isActive ? '#3dd7ff' : '#6f95b6',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        opacity: isActive ? 1 : 0.95,
                      }}
                    >
                      {item.icon}
                    </span>

                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 16,
                        fontWeight: isActive ? 600 : 500,
                        letterSpacing: 0.15,
                      }}
                    >
                      {item.label}
                    </span>

                    {isActive && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 8,
                          bottom: 8,
                          width: 3,
                          background: '#3dd7ff',
                          boxShadow: '0 0 10px rgba(61, 215, 255, 0.55)',
                          borderRadius: 999,
                        }}
                      />
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(28, 55, 82, 0.75)',
          background: 'rgba(4, 10, 17, 0.96)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: '#607d98',
              letterSpacing: 1.8,
              textTransform: 'uppercase',
            }}
          >
            Backend
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#00e87a',
                boxShadow: '0 0 8px rgba(0,232,122,0.7)',
              }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: '#7df3ba',
              }}
            >
              :8000
            </span>
          </div>
        </div>

        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: '#5b7691',
            letterSpacing: 1.1,
            lineHeight: 1.8,
          }}
        >
          ShadowEcho 2025 | Threat Intelligence Workspace
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
