import React, { useEffect, useState } from 'react';
import { NODE_API_URL } from '../../config/api';

const STAGES = [
  { id: 'pending', label: 'Applied' },
  { id: 'ongoing', label: 'Under Review' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'final', label: 'Decision' },
];

const stageIndex = (status) => {
  if (status === 'pending') return 0;
  if (status === 'ongoing') return 1;
  if (status === 'shortlisted') return 2;
  if (status === 'approved' || status === 'rejected') return 3;
  return 0;
};

const STATUS_PILL = {
  pending: { bg: '#fefce8', text: '#92400e', border: '#fde68a', label: 'Applied — Pending Review' },
  ongoing: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: 'Under Review' },
  shortlisted: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', label: 'Shortlisted 🎉' },
  approved: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: 'Approved ✓' },
  rejected: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', label: 'Rejected' },
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
      ATS Score: {num}%
    </span>
  );
};

export default function CandidateApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const email = localStorage.getItem('authEmail');
    if (!email) { setLoading(false); return; }
    const fetchApps = async () => {
      try {
        const res = await fetch(`${NODE_API_URL}/applications?candidate_email=${encodeURIComponent(email)}`);
        const data = await res.json();
        setApps(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  const filteredApps = apps.filter((a) => filter === 'all' || a.status === filter);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8', fontSize: 16 }}>
        Loading your applications...
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '24px 28px',
          boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1e293b' }}>My Applications</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
              Track your job applications and AI interview results in real time.
            </p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px',
              background: '#f8fafc', color: '#374151', fontSize: 14, cursor: 'pointer',
            }}
          >
            <option value="all">All Applications</option>
            <option value="pending">Applied (Pending)</option>
            <option value="ongoing">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {filteredApps.length === 0 && (
          <div style={{
            background: '#fff', borderRadius: 14, padding: '56px 28px',
            textAlign: 'center', color: '#94a3b8', fontSize: 15,
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
          }}>
            {filter === 'all'
              ? 'No applications yet. Apply for a job to get started!'
              : `No ${filter} applications found.`}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredApps.map((a) => {
            const pill = STATUS_PILL[a.status] || STATUS_PILL.pending;
            const idx = stageIndex(a.status);
            const pct = Math.round((idx / 3) * 100);
            // Latest employer note from history
            const latestNote = a.history && a.history.length > 0
              ? [...a.history].reverse().find((h) => h.note)
              : null;

            return (
              <div
                key={a._id}
                style={{
                  background: '#fff', borderRadius: 14, padding: '24px 28px',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
                  border: `1px solid ${pill.border}`,
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{a.job_title}</h3>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>{a.business_email}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
                      Applied {a.applied_at ? new Date(a.applied_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                      background: pill.bg, color: pill.text, border: `1px solid ${pill.border}`,
                      borderRadius: 9999, padding: '4px 14px', fontSize: 13, fontWeight: 700,
                    }}>
                      {pill.label}
                    </span>
                    {typeof a.ats_score === 'number' && a.ats_score > 0 && (
                      <AtsScoreBadge score={a.ats_score} />
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    height: 8, borderRadius: 99, background: '#e2e8f0', overflow: 'hidden', marginBottom: 8,
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: a.status === 'rejected'
                        ? '#ef4444'
                        : a.status === 'approved'
                        ? '#22c55e'
                        : '#3b82f6',
                      borderRadius: 99,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
                    {STAGES.map((stage, i) => {
                      const isActive = i <= idx;
                      const isFinal = stage.id === 'final';
                      const label = isFinal
                        ? (a.status === 'approved' ? '✓ Approved' : a.status === 'rejected' ? '✕ Rejected' : 'Decision')
                        : stage.label;
                      return (
                        <span
                          key={stage.id}
                          style={{
                            color: isActive
                              ? (a.status === 'rejected' && isFinal ? '#dc2626' : a.status === 'approved' && isFinal ? '#16a34a' : '#3b82f6')
                              : '#94a3b8',
                            fontWeight: isActive ? 700 : 400,
                          }}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* AI Interview badge */}
                {a.session_id && (
                  <div style={{
                    background: '#f5f3ff', border: '1px solid #ddd6fe',
                    borderRadius: 10, padding: '10px 14px',
                    fontSize: 13, color: '#6d28d9', marginBottom: 10,
                  }}>
                    <strong>🤖 AI Interview Submitted</strong> — Your AI interview report has been sent to the employer for review.
                    <div style={{ fontSize: 11, color: '#a78bfa', marginTop: 3 }}>Session ID: {a.session_id}</div>
                  </div>
                )}

                {/* Employer note */}
                {latestNote && (
                  <div style={{
                    background: '#f0f9ff', border: '1px solid #bae6fd',
                    borderRadius: 10, padding: '10px 14px',
                    fontSize: 13, color: '#0369a1',
                    borderLeft: '4px solid #38bdf8',
                  }}>
                    <strong>💬 Employer Note:</strong> {latestNote.note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
