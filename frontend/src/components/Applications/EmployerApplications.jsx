import React, { useEffect, useState } from 'react';
import { NODE_API_URL } from '../../config/api';
import ContactCandidate from '../Business/ContactCandidate';
import InterviewReportModal from '../Business/InterviewReportModal';
import { getAuthSession } from '../../utility/auth';

const STATUS_COLORS = {
  pending: { bg: '#fefce8', text: '#92400e', border: '#fde68a' },
  ongoing: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  shortlisted: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  approved: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  rejected: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const label = status === 'ongoing' ? 'Under Review' : status.replace('_', ' ').toUpperCase();
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 9999, padding: '3px 12px', fontSize: 12, fontWeight: 700,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
};

const AtsScoreBadge = ({ score }) => {
  const num = Number(score) || 0;
  const color = num >= 75 ? '#16a34a' : num >= 50 ? '#d97706' : '#dc2626';
  const bg = num >= 75 ? '#f0fdf4' : num >= 50 ? '#fefce8' : '#fef2f2';
  const border = num >= 75 ? '#bbf7d0' : num >= 50 ? '#fde68a' : '#fecaca';
  return (
    <span style={{
      background: bg, color, border: `1px solid ${border}`,
      borderRadius: 9999, padding: '3px 12px', fontSize: 12, fontWeight: 700,
    }}>
      ATS {num}%
    </span>
  );
};

export default function EmployerApplications() {
  const [apps, setApps] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [contactEmail, setContactEmail] = useState(null);
  const [reportSession, setReportSession] = useState(null); // { sessionId, candidateName, applicationData }
  const auth = getAuthSession();

  const fetchApps = async () => {
    if (!auth.email) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${NODE_API_URL}/applications?business_email=${encodeURIComponent(auth.email)}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      setApps(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.email]);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${NODE_API_URL}/applications/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, changed_by: auth.email }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed');
      fetchApps();
    } catch (err) {
      console.error(err);
      alert('Status update failed');
    }
  };

  const filteredApps = statusFilter ? apps.filter((a) => a.status === statusFilter) : apps;

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '24px 28px',
          boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1e293b' }}>
              Manage Applications
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
              Review candidate profiles, ATS scores, and AI interview reports.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px',
                background: '#f8fafc', color: '#374151', fontSize: 14, cursor: 'pointer',
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="ongoing">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={fetchApps}
              style={{
                background: '#3b82f6', color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
                fontWeight: 600, fontSize: 14,
              }}
            >
              ↺ Refresh
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#94a3b8', fontSize: 16 }}>
            Loading applications...
          </div>
        )}

        {!loading && filteredApps.length === 0 && (
          <div style={{
            background: '#fff', borderRadius: 14, padding: '48px 28px',
            textAlign: 'center', color: '#94a3b8', fontSize: 15,
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
          }}>
            No applications found.
          </div>
        )}

        {!loading && filteredApps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredApps.map((a) => (
              <div
                key={a._id}
                style={{
                  background: '#fff', borderRadius: 14, padding: '20px 24px',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
                  border: '1px solid #f1f5f9',
                  display: 'flex', flexDirection: 'column', gap: 14,
                }}
              >
                {/* Top row: candidate info + badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>
                      {a.candidate_name || a.candidate_email}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                      {a.candidate_email} &bull; Applied for: <strong>{a.job_title}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      {a.applied_at ? new Date(a.applied_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <StatusBadge status={a.status} />
                    {typeof a.ats_score === 'number' && <AtsScoreBadge score={a.ats_score} />}
                    {a.session_id && (
                      <span style={{
                        background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd',
                        borderRadius: 9999, padding: '3px 12px', fontSize: 12, fontWeight: 700,
                      }}>
                        🤖 AI Interview Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {/* Contact */}
                  <button
                    onClick={() => setContactEmail(a.candidate_email)}
                    style={{
                      background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                      borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600,
                    }}
                  >
                    ✉ Contact Candidate
                  </button>

                  {/* View AI Report */}
                  {a.session_id && (
                    <button
                      onClick={() => setReportSession({ sessionId: a.session_id, candidateName: a.candidate_name || a.candidate_email, applicationData: a })}
                      style={{
                        background: '#f5f3ff', color: '#7c3aed', border: '1px solid #c4b5fd',
                        borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600,
                      }}
                    >
                      📊 View AI Interview Report
                    </button>
                  )}

                  {/* Status actions */}
                  {a.status !== 'shortlisted' && a.status !== 'approved' && a.status !== 'rejected' && (
                    <button
                      onClick={() => updateStatus(a._id, 'shortlisted')}
                      style={{
                        background: '#fefce8', color: '#92400e', border: '1px solid #fde68a',
                        borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600,
                      }}
                    >
                      ⭐ Shortlist
                    </button>
                  )}
                  {a.status === 'shortlisted' && (
                    <button
                      onClick={() => updateStatus(a._id, 'approved')}
                      style={{
                        background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                        borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600,
                      }}
                    >
                      ✓ Approve / Hire
                    </button>
                  )}
                  {a.status !== 'rejected' && a.status !== 'approved' && (
                    <button
                      onClick={() => updateStatus(a._id, 'rejected')}
                      style={{
                        background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca',
                        borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600,
                      }}
                    >
                      ✕ Reject
                    </button>
                  )}
                </div>

                {/* History notes (latest note from employer) */}
                {a.history && a.history.length > 0 && a.history[a.history.length - 1].note && (
                  <div style={{
                    background: '#f8fafc', borderRadius: 8, padding: '10px 14px',
                    fontSize: 13, color: '#475569', borderLeft: '3px solid #3b82f6',
                  }}>
                    <strong>Note:</strong> {a.history[a.history.length - 1].note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {contactEmail && (
        <ContactCandidate candidateEmail={contactEmail} onClose={() => setContactEmail(null)} />
      )}
      {reportSession && (
        <InterviewReportModal
          sessionId={reportSession.sessionId}
          candidateName={reportSession.candidateName}
          applicationData={reportSession.applicationData}
          onClose={() => setReportSession(null)}
        />
      )}
    </div>
  );
}
