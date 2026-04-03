// src/pages/AlertsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchAlerts, fetchAlertSummary, acknowledgeAlert } from '../services/api';
import type { Alert, AlertSummary } from '../types/api';
import { ErrorBanner, LiveIndicator, Spinner } from '../components/common';

const SEVERITIES = ['all', 'critical', 'high', 'medium', 'low'] as const;
type SevFilter = (typeof SEVERITIES)[number];

/* ── Confidence bar (sparkline-style) ─────────────────────────────── */
const ConfBar: React.FC<{ value: number }> = ({ value }) => {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80 ? '#ff2244' :
    pct >= 60 ? '#ff6600' :
    pct >= 40 ? '#ffcc00' : '#00cc66';
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span
        className="text-xs font-bold tabular-nums"
        style={{ fontFamily: "'Orbitron',monospace", color, minWidth: 36, textAlign: 'right' }}
      >
        {pct}%
      </span>
    </div>
  );
};

/* ── Severity key-indicator card (Splunk style) ──────────────────── */
interface SevCardProps {
  severity: 'critical' | 'high' | 'medium' | 'low';
  count: number;
  active: boolean;
  onClick: () => void;
}

const SEV_META = {
  critical: { color: '#ff2244', bg: 'rgba(255,34,68,0.08)',  border: 'rgba(255,34,68,0.35)',  label: 'CRITICAL' },
  high:     { color: '#ff6600', bg: 'rgba(255,102,0,0.08)', border: 'rgba(255,102,0,0.35)', label: 'HIGH' },
  medium:   { color: '#ffcc00', bg: 'rgba(255,204,0,0.06)', border: 'rgba(255,204,0,0.3)',  label: 'MEDIUM' },
  low:      { color: '#00cc66', bg: 'rgba(0,204,102,0.06)', border: 'rgba(0,204,102,0.3)',  label: 'LOW' },
};

const SevCard: React.FC<SevCardProps> = ({ severity, count, active, onClick }) => {
  const m = SEV_META[severity];
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? m.bg : 'rgba(255,255,255,0.02)',
        border: `1px solid ${active ? m.border : 'rgba(255,255,255,0.06)'}`,
        boxShadow: active ? `0 0 20px ${m.color}22` : 'none',
        padding: '18px 16px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Bottom accent bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: active ? `linear-gradient(90deg,transparent,${m.color},transparent)` : 'transparent',
        transition: 'all 0.2s',
      }} />
      <div
        style={{
          fontFamily: "'Orbitron',monospace",
          fontSize: 40,
          fontWeight: 900,
          color: active ? m.color : 'rgba(255,255,255,0.5)',
          lineHeight: 1,
          letterSpacing: '-1px',
          transition: 'color 0.2s',
        }}
      >
        {count}
      </div>
      <div style={{
        fontFamily: "'Share Tech Mono',monospace",
        fontSize: 9,
        letterSpacing: '0.25em',
        color: active ? m.color : 'rgba(255,255,255,0.3)',
        marginTop: 6,
        transition: 'color 0.2s',
      }}>
        {m.label}
      </div>
      {active && count > 0 && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          width: 7, height: 7, borderRadius: '50%',
          background: m.color, boxShadow: `0 0 8px ${m.color}`,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      )}
    </button>
  );
};

/* ── Alert row ───────────────────────────────────────────────────── */
interface AlertRowProps {
  alert: Alert;
  acking: boolean;
  onAck: () => void;
}

const AlertRow: React.FC<AlertRowProps> = ({ alert, acking, onAck }) => {
  const m = SEV_META[alert.severity as keyof typeof SEV_META] ?? SEV_META.low;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '90px 1fr 140px 110px',
        gap: 16,
        alignItems: 'center',
        padding: '13px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        borderLeft: alert.acknowledged ? '3px solid transparent' : `3px solid ${m.color}`,
        background: alert.acknowledged
          ? 'transparent'
          : `linear-gradient(90deg, ${m.color}08 0%, transparent 30%)`,
        transition: 'all 0.15s',
        opacity: alert.acknowledged ? 0.45 : 1,
      }}
    >
      {/* Severity */}
      <div>
        <span style={{
          display: 'inline-block',
          fontSize: 9,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          padding: '3px 8px',
          border: `1px solid ${m.border}`,
          background: m.bg,
          color: m.color,
          fontFamily: "'Share Tech Mono',monospace",
          fontWeight: 700,
        }}>
          {alert.severity?.toUpperCase()}
        </span>
      </div>

      {/* Title + meta */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: 13,
          color: 'rgba(200,223,240,0.95)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 3,
        }}>
          {alert.title || 'Untitled Alert'}
        </div>
        <div style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: 10,
          color: 'rgba(90,138,176,0.7)',
          letterSpacing: '0.05em',
        }}>
          {alert.alert_type && <span style={{ marginRight: 10 }}>{alert.alert_type}</span>}
          {alert.post_id && <span>post: {alert.post_id.slice(0, 10)}…</span>}
          {alert.created_at && (
            <span style={{ marginLeft: 10, color: 'rgba(90,138,176,0.5)' }}>
              {alert.created_at.slice(0, 16).replace('T', ' ')}
            </span>
          )}
        </div>
        {alert.summary && (
          <div style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 10,
            color: 'rgba(90,138,176,0.6)',
            marginTop: 3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {alert.summary.slice(0, 120)}{alert.summary.length > 120 ? '…' : ''}
          </div>
        )}
      </div>

      {/* Confidence */}
      <ConfBar value={alert.confidence ?? 0} />

      {/* Action */}
      {alert.acknowledged ? (
        <span style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: 10,
          color: '#00cc66',
          opacity: 0.6,
          letterSpacing: '0.1em',
        }}>
          ✓ ACKNOWLEDGED
        </span>
      ) : (
        <button
          onClick={onAck}
          disabled={acking}
          style={{
            background: 'rgba(0,212,255,0.07)',
            border: '1px solid rgba(0,212,255,0.3)',
            color: '#00d4ff',
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 9,
            letterSpacing: '0.15em',
            padding: '6px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s',
            opacity: acking ? 0.4 : 1,
            textTransform: 'uppercase',
          }}
        >
          {acking ? '…' : '✓ ACK'}
        </button>
      )}
    </div>
  );
};

/* ── Page ────────────────────────────────────────────────────────── */
const AlertsPage: React.FC = () => {
  const [alerts, setAlerts]       = useState<Alert[]>([]);
  const [summary, setSummary]     = useState<AlertSummary | null>(null);
  const [filter, setFilter]       = useState<SevFilter>('all');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [acking, setAcking]       = useState<Set<number | string>>(new Set());

  const load = useCallback(async () => {
    try {
      const [al, sum] = await Promise.all([
        fetchAlerts(100, filter === 'all' ? undefined : filter),
        fetchAlertSummary(),
      ]);
      setAlerts(al.alerts);
      setSummary(sum);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  const handleAck = async (id: number | string) => {
    setAcking(p => new Set(p).add(id));
    try { await acknowledgeAlert(id); await load(); }
    catch { /* no-op */ }
    finally { setAcking(p => { const n = new Set(p); n.delete(id); return n; }); }
  };

  const unacked = alerts.filter(a => !a.acknowledged).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.3s ease' }}>

      {/* ── Page header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <h1 style={{
              fontFamily: "'Orbitron',monospace",
              fontSize: 26,
              fontWeight: 700,
              color: '#c8dff0',
              letterSpacing: '0.1em',
              lineHeight: 1,
            }}>
              ALERT FEED
            </h1>
            <p style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 11,
              color: 'rgba(90,138,176,0.7)',
              letterSpacing: '0.15em',
              marginTop: 4,
              textTransform: 'uppercase',
            }}>
              All detected threats · {unacked} unacknowledged
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {loading && <Spinner />}
          <LiveIndicator updatedAt={lastUpdated} />
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* ── Key indicators (Splunk style) ────────────────────── */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
            <SevCard
              key={sev}
              severity={sev}
              count={summary[sev] ?? 0}
              active={filter === sev}
              onClick={() => setFilter(filter === sev ? 'all' : sev)}
            />
          ))}
        </div>
      )}

      {/* ── Filter bar ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: 9,
          color: 'rgba(90,138,176,0.5)',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginRight: 4,
        }}>
          FILTER:
        </span>
        {SEVERITIES.map(s => {
          const m = s !== 'all' ? SEV_META[s] : null;
          const active = filter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '6px 14px',
                fontFamily: "'Share Tech Mono',monospace",
                fontSize: 10,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                background: active ? (m ? m.bg : 'rgba(0,212,255,0.1)') : 'transparent',
                border: `1px solid ${active ? (m ? m.border : 'rgba(0,212,255,0.4)') : 'rgba(255,255,255,0.07)'}`,
                color: active ? (m ? m.color : '#00d4ff') : 'rgba(90,138,176,0.6)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          );
        })}
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={load}
            style={{
              padding: '6px 14px',
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              background: 'transparent',
              border: '1px solid rgba(0,212,255,0.2)',
              color: '#00d4ff',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            ↺ REFRESH
          </button>
        </div>
      </div>

      {/* ── Table header ─────────────────────────────────────── */}
      <div style={{
        border: '1px solid rgba(14,32,53,1)',
        background: 'rgba(7,16,28,0.9)',
        overflow: 'hidden',
      }}>
        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '90px 1fr 140px 110px',
          gap: 16,
          padding: '8px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,212,255,0.03)',
        }}>
          {['SEVERITY', 'TITLE / DETAILS', 'CONFIDENCE', 'ACTION'].map(h => (
            <span key={h} style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 9,
              letterSpacing: '0.2em',
              color: 'rgba(90,138,176,0.5)',
              textTransform: 'uppercase',
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {loading && alerts.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Spinner />
          </div>
        ) : alerts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 48,
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 13,
            color: 'rgba(90,138,176,0.4)',
            letterSpacing: '0.1em',
          }}>
            No alerts for this filter
          </div>
        ) : (
          alerts.map(alert => (
            <AlertRow
              key={alert.id}
              alert={alert}
              acking={acking.has(alert.id)}
              onAck={() => handleAck(alert.id)}
            />
          ))
        )}
      </div>

      {/* ── Footer stat bar ──────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: 24,
        padding: '10px 16px',
        border: '1px solid rgba(14,32,53,1)',
        background: 'rgba(7,16,28,0.6)',
        fontFamily: "'Share Tech Mono',monospace",
        fontSize: 10,
        color: 'rgba(90,138,176,0.5)',
        letterSpacing: '0.1em',
      }}>
        <span>TOTAL: <span style={{ color: '#00d4ff' }}>{alerts.length}</span></span>
        <span>UNACKED: <span style={{ color: '#ff2244' }}>{unacked}</span></span>
        {summary && <>
          <span>CRITICAL: <span style={{ color: '#ff2244' }}>{summary.critical ?? 0}</span></span>
          <span>HIGH: <span style={{ color: '#ff6600' }}>{summary.high ?? 0}</span></span>
          <span>MEDIUM: <span style={{ color: '#ffcc00' }}>{summary.medium ?? 0}</span></span>
          <span>LOW: <span style={{ color: '#00cc66' }}>{summary.low ?? 0}</span></span>
        </>}
        {lastUpdated && (
          <span style={{ marginLeft: 'auto' }}>
            UPDATED {lastUpdated.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;