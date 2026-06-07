import React, { useState, useEffect } from 'react';
import { NODE_API_URL } from '../../config/api';

const METHOD_COLORS = {
  GET:    { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  POST:   { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  PUT:    { bg: '#fefce8', text: '#92400e', border: '#fde68a' },
  DELETE: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  PATCH:  { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
};

const statusLabel = (code) => {
  if (code >= 500) return 'Server Error';
  if (code >= 400) return 'Client Error';
  if (code >= 300) return 'Redirect';
  if (code >= 200) return 'OK';
  return String(code);
};

const statusStyle = (code) => {
  if (code >= 500) return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };
  if (code >= 400) return { bg: '#fef9c3', text: '#92400e', border: '#fde68a' };
  if (code >= 300) return { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' };
  return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
};

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorOnly, setErrorOnly] = useState(false);
  const [searchUrl, setSearchUrl] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NODE_API_URL}/api/admin/logs`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
      alert('Failed to fetch logs. Make sure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const displayed = logs.filter((log) => {
    if (errorOnly && log.status < 400) return false;
    if (searchUrl && !log.url?.toLowerCase().includes(searchUrl.toLowerCase())) return false;
    return true;
  });

  const errorCount = logs.filter((l) => l.status >= 400).length;

  return (
    <div style={{ padding: 32, background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1e293b' }}>System Logs</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            {logs.length} total requests &bull; {errorCount} errors
          </p>
        </div>
        <button
          onClick={fetchLogs}
          style={{
            background: '#3b82f6', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
            fontWeight: 600, fontSize: 14,
          }}
        >
          ↺ Refresh Logs
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: '14px 20px', marginBottom: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Error-only toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
          <div
            onClick={() => setErrorOnly((prev) => !prev)}
            style={{
              width: 44, height: 24, borderRadius: 99,
              background: errorOnly ? '#ef4444' : '#e2e8f0',
              position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: errorOnly ? 22 : 2,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'left 0.2s',
            }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: errorOnly ? '#dc2626' : '#475569' }}>
            Errors only (4xx / 5xx)
            {errorOnly && (
              <span style={{
                marginLeft: 6, background: '#fef2f2', color: '#dc2626',
                borderRadius: 9999, padding: '1px 8px', fontSize: 12,
              }}>
                {errorCount}
              </span>
            )}
          </span>
        </label>

        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text"
            placeholder="Filter by URL path..."
            value={searchUrl}
            onChange={(e) => setSearchUrl(e.target.value)}
            style={{
              border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 14px',
              fontSize: 14, width: '100%', background: '#f8fafc', color: '#374151',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          Showing {displayed.length} / {logs.length}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#94a3b8', fontSize: 16 }}>
          Loading system logs...
        </div>
      )}

      {!loading && (
        <div style={{
          background: '#fff', borderRadius: 14,
          boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden',
        }}>
          <div style={{ maxHeight: 620, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Timestamp', 'Method', 'URL', 'Status', 'Time', 'IP'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '11px 18px', textAlign: 'left', fontSize: 11,
                        fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                      No logs match the current filter.
                    </td>
                  </tr>
                ) : (
                  displayed.map((log, idx) => {
                    const mc = METHOD_COLORS[log.method] || { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
                    const sc = statusStyle(log.status);
                    const isError = log.status >= 400;
                    return (
                      <tr
                        key={log._id}
                        style={{
                          borderBottom: idx < displayed.length - 1 ? '1px solid #f1f5f9' : 'none',
                          background: isError ? '#fffbfb' : '#fff',
                        }}
                      >
                        <td style={{ padding: '11px 18px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                        </td>
                        <td style={{ padding: '11px 18px' }}>
                          <span style={{
                            background: mc.bg, color: mc.text, border: `1px solid ${mc.border}`,
                            borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                          }}>
                            {log.method}
                          </span>
                        </td>
                        <td style={{
                          padding: '11px 18px', fontSize: 12, color: '#475569',
                          maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                          title={log.url}
                        >
                          {log.url}
                        </td>
                        <td style={{ padding: '11px 18px' }}>
                          <span style={{
                            background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                            borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                          }}>
                            {log.status} {statusLabel(log.status)}
                          </span>
                        </td>
                        <td style={{ padding: '11px 18px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                          {log.responseTime != null ? `${log.responseTime} ms` : 'N/A'}
                        </td>
                        <td style={{ padding: '11px 18px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {log.ip || 'N/A'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
