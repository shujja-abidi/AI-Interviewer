import React, { useEffect, useState, useCallback } from 'react';
import { NODE_API_URL } from '../../config/api';
import { getAuthSession } from '../../utility/auth';

/* Icon helpers (inline SVG to avoid extra deps) */
const BellIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* Notification type → accent color */
const typeColor = (type) => {
  const map = {
    application: '#3b82f6',
    status_update: '#7c3aed',
    job_approved: '#16a34a',
    job_rejected: '#dc2626',
    shortlisted: '#d97706',
    contact: '#0891b2',
    message: '#0891b2',
  };
  return map[type] || '#64748b';
};

const typeLabel = (type) => {
  if (!type) return 'Notification';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export default function NotificationsPage() {
  const auth = getAuthSession();
  // Resolve email from auth utility (works for both candidate & business)
  const email = auth?.email
    || localStorage.getItem('authEmail')
    || localStorage.getItem('businessEmail')
    || localStorage.getItem('email')
    || '';

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!email) { setLoading(false); return; }
    try {
      const res = await fetch(`${NODE_API_URL}/notifications?to=${encodeURIComponent(email)}`);
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchNotes();
    const interval = setInterval(fetchNotes, 30000);
    return () => clearInterval(interval);
  }, [fetchNotes]);

  const markRead = async (id) => {
    try {
      const res = await fetch(`${NODE_API_URL}/notifications/${id}/read`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      setNotes((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    if (!email || markingAll) return;
    setMarkingAll(true);
    try {
      await fetch(`${NODE_API_URL}/notifications/mark-all-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email }),
      });
      setNotes((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingAll(false);
    }
  };

  const displayed = filter === 'unread' ? notes.filter((n) => !n.read) : notes;
  const unreadCount = notes.filter((n) => !n.read).length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: 740, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
          borderRadius: 16,
          padding: '24px 28px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 10,
              padding: 10,
              color: '#fff',
              display: 'flex',
            }}>
              <BellIcon />
            </div>
            <div>
              <h1 style={{ margin: 0, color: '#fff', fontSize: 22, fontWeight: 800 }}>
                Notifications
              </h1>
              <p style={{ margin: '3px 0 0', color: '#bfdbfe', fontSize: 13 }}>
                {email || 'No account detected'}
                {unreadCount > 0 && (
                  <span style={{
                    marginLeft: 8,
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: 9999,
                    padding: '1px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAll}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 8,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  opacity: markingAll ? 0.6 : 1,
                }}
              >
                ✓ Mark all read
              </button>
            )}
            <button
              onClick={fetchNotes}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 8,
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ↺ Refresh
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '4px',
          marginBottom: 16,
          display: 'inline-flex',
          gap: 2,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {[
            { key: 'all', label: `All (${notes.length})` },
            { key: 'unread', label: `Unread (${unreadCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                background: filter === key ? '#2563eb' : 'transparent',
                color: filter === key ? '#fff' : '#64748b',
                border: 'none',
                borderRadius: 9,
                padding: '8px 20px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* No email state */}
        {!email && (
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: '48px 28px',
            textAlign: 'center',
            color: '#94a3b8',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
            <p style={{ fontSize: 15 }}>Please log in to view your notifications.</p>
          </div>
        )}

        {/* Loading */}
        {email && loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 15 }}>
            Loading notifications...
          </div>
        )}

        {/* Empty state */}
        {email && !loading && displayed.length === 0 && (
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: '56px 28px',
            textAlign: 'center',
            color: '#94a3b8',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
            <p style={{ fontSize: 15 }}>
              {filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
            </p>
          </div>
        )}

        {/* Notification list */}
        {!loading && displayed.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayed.map((n) => {
              const accent = typeColor(n.type);
              return (
                <div
                  key={n._id}
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    padding: '16px 20px',
                    boxShadow: n.read ? '0 1px 3px rgba(0,0,0,0.04)' : '0 2px 12px rgba(37,99,235,0.1)',
                    border: n.read ? '1px solid #f1f5f9' : `1px solid ${accent}30`,
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    opacity: n.read ? 0.75 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Accent dot */}
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: n.read ? '#cbd5e1' : accent,
                    marginTop: 5,
                    flexShrink: 0,
                  }} />

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                      <div>
                        <span style={{
                          background: `${accent}15`,
                          color: accent,
                          border: `1px solid ${accent}30`,
                          borderRadius: 6,
                          padding: '1px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          marginRight: 8,
                        }}>
                          {typeLabel(n.type)}
                        </span>
                        {!n.read && (
                          <span style={{
                            background: '#fef2f2',
                            color: '#ef4444',
                            border: '1px solid #fecaca',
                            borderRadius: 6,
                            padding: '1px 8px',
                            fontSize: 11,
                            fontWeight: 700,
                          }}>
                            NEW
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>
                        {timeAgo(n.created_at)}
                      </span>
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '6px 0 3px' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.55 }}>
                      {n.message}
                    </div>
                  </div>

                  {/* Mark read button */}
                  {!n.read && (
                    <button
                      onClick={() => markRead(n._id)}
                      title="Mark as read"
                      style={{
                        background: '#f0fdf4',
                        color: '#16a34a',
                        border: '1px solid #bbf7d0',
                        borderRadius: 8,
                        padding: '6px 10px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <CheckIcon /> Read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
