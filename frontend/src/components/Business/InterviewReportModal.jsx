import React, { useEffect, useState } from 'react';
import { PYTHON_API_URL } from '../../config/api';

const scoreColor = (score) => {
  if (score >= 75) return '#16a34a'; // green
  if (score >= 50) return '#d97706'; // amber
  return '#dc2626'; // red
};

const Badge = ({ label, color }) => (
  <span
    style={{
      background: color + '1a',
      color,
      border: `1px solid ${color}40`,
      borderRadius: 9999,
      padding: '2px 12px',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: 0.3,
    }}
  >
    {label}
  </span>
);

export default function InterviewReportModal({ sessionId, candidateName, onClose }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setError('No interview session linked to this application.');
      setLoading(false);
      return;
    }
    const fetchSession = async () => {
      try {
        const res = await fetch(`${PYTHON_API_URL}/api/interview-session/${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load interview session');
        setSession(data);
      } catch (err) {
        setError(err.message || 'Failed to load interview report.');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  const summary = session?.summary || {};
  const responses = session?.responses || [];
  const overallScore = summary.overall_score ?? 0;
  const decision = summary.recommended_decision || 'Pending';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: 780,
          padding: 32,
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1e293b' }}>
              AI Interview Report
            </h2>
            {candidateName && (
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
                Candidate: <strong>{candidateName}</strong>
              </p>
            )}
            {session && (
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: 13 }}>
                Role: {session.job_title || 'N/A'} &bull; Type: {session.interview_type || 'N/A'} &bull; Difficulty: {session.difficulty || 'N/A'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: '#475569',
            }}
          >
            ✕ Close
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            Loading interview report...
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: 16, color: '#dc2626', fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {!loading && !error && session && (
          <>
            {/* Score Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 16,
                marginBottom: 24,
              }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                borderRadius: 12,
                padding: 20,
                textAlign: 'center',
                border: '1px solid #bfdbfe',
              }}>
                <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Overall Score
                </div>
                <div style={{ fontSize: 42, fontWeight: 800, color: scoreColor(overallScore), lineHeight: 1.1, margin: '8px 0 4px' }}>
                  {overallScore}
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>/100</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                borderRadius: 12,
                padding: 20,
                textAlign: 'center',
                border: '1px solid #bbf7d0',
              }}>
                <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Decision
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#15803d', margin: '8px 0 4px', wordBreak: 'break-word' }}>
                  {decision}
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #fefce8, #fef9c3)',
                borderRadius: 12,
                padding: 20,
                textAlign: 'center',
                border: '1px solid #fde68a',
              }}>
                <div style={{ fontSize: 12, color: '#d97706', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Responses
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#92400e', lineHeight: 1.1, margin: '8px 0 4px' }}>
                  {summary.responses_completed ?? responses.length}
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>/ {summary.question_count ?? responses.length} questions</div>
              </div>
            </div>

            {/* Summary text */}
            {summary.last_summary && (
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                padding: 16, marginBottom: 20, fontSize: 14, color: '#475569', lineHeight: 1.6,
              }}>
                <strong style={{ color: '#1e293b' }}>AI Summary: </strong>
                {summary.last_summary}
              </div>
            )}

            {/* Per-response breakdown */}
            {responses.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>Response Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {responses.map((resp, idx) => {
                    const rScore = resp.report?.overall_score ?? 0;
                    const recs = resp.report?.recommendations || [];
                    const weaknesses = resp.report?.weaknesses || [];
                    return (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: 10,
                          padding: 16,
                          background: '#fff',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                              Q{idx + 1}
                            </span>
                            <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                              {resp.question || 'Interview Question'}
                            </p>
                            {resp.report?.summary && (
                              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                                {resp.report.summary}
                              </p>
                            )}
                          </div>
                          <div style={{ textAlign: 'center', minWidth: 60 }}>
                            <div style={{ fontSize: 26, fontWeight: 800, color: scoreColor(rScore) }}>{rScore}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>/100</div>
                          </div>
                        </div>

                        {/* Transcript */}
                        {resp.report?.transcript?.full_text && (
                          <details style={{ marginTop: 8 }}>
                            <summary style={{ cursor: 'pointer', fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>
                              View Transcript
                            </summary>
                            <div style={{
                              marginTop: 8, background: '#f8fafc', border: '1px solid #e2e8f0',
                              borderRadius: 8, padding: 12, fontSize: 13, color: '#475569',
                              whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: 200, overflowY: 'auto',
                            }}>
                              {resp.report.transcript.full_text}
                            </div>
                          </details>
                        )}

                        {/* Recommendations & Weaknesses */}
                        {(recs.length > 0 || weaknesses.length > 0) && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                            {recs.length > 0 && (
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>✓ Strengths</div>
                                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#374151' }}>
                                  {recs.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                              </div>
                            )}
                            {weaknesses.length > 0 && (
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>✗ Improvement Areas</div>
                                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#374151' }}>
                                  {weaknesses.slice(0, 3).map((w, i) => <li key={i}>{w}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {responses.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 14,
                border: '1px dashed #e2e8f0', borderRadius: 10,
              }}>
                No detailed response data available for this session.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
