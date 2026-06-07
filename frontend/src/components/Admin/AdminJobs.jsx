import React, { useState, useEffect } from 'react';
import { NODE_API_URL } from '../../config/api';

const STATUS_STYLES = {
  pending:  { bg: '#fefce8', text: '#92400e', border: '#fde68a', label: 'Pending Review' },
  approved: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: 'Approved' },
  rejected: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', label: 'Rejected' },
  draft:    { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', label: 'Draft' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <span style={{
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      borderRadius: 9999, padding: '3px 12px', fontSize: 12, fontWeight: 700,
    }}>
      {s.label}
    </span>
  );
};

const AdminJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState(null); // job id being updated

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const url = filter
        ? `${NODE_API_URL}/admin/jobs?status=${encodeURIComponent(filter)}`
        : `${NODE_API_URL}/admin/jobs`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      alert('Failed to fetch jobs. Make sure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const updateJobStatus = async (id, status) => {
    setUpdating(id);
    try {
      const response = await fetch(`${NODE_API_URL}/admin/job/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update job status');
      await fetchJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job posting permanently?')) return;
    try {
      const response = await fetch(`${NODE_API_URL}/api/admin/jobs/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete job');
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Error deleting job');
    }
  };

  return (
    <div style={{ padding: 32, background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1e293b' }}>
            Moderate Job Posts
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Approve, reject, or remove job postings submitted by employers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px',
              fontSize: 14, background: '#fff', cursor: 'pointer', color: '#374151',
            }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
          </select>
          <button
            onClick={fetchJobs}
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
          Loading jobs...
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div style={{
          background: '#fff', borderRadius: 14, padding: '56px 28px',
          textAlign: 'center', color: '#94a3b8', fontSize: 15,
          boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
        }}>
          No jobs found{filter ? ` with status "${filter}"` : ''}.
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div style={{
          background: '#fff', borderRadius: 14,
          boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Job Title', 'Company', 'Business Email', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 20px', textAlign: 'left', fontSize: 12,
                      fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, idx) => {
                const isUpdating = updating === job._id;
                return (
                  <tr
                    key={job._id}
                    style={{
                      borderBottom: idx < jobs.length - 1 ? '1px solid #f1f5f9' : 'none',
                      background: isUpdating ? '#f8fafc' : '#fff',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#1e293b', fontSize: 14 }}>
                      {job.basicDetails?.title || job.name || 'Untitled'}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#475569', fontSize: 14 }}>
                      {job.basicDetails?.company || job.name || 'N/A'}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748b', fontSize: 13 }}>
                      {job.email || 'N/A'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <StatusBadge status={job.status || 'draft'} />
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {/* Approve */}
                        {job.status !== 'approved' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => updateJobStatus(job._id, 'approved')}
                            style={{
                              background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                              borderRadius: 7, padding: '5px 14px', cursor: isUpdating ? 'not-allowed' : 'pointer',
                              fontSize: 13, fontWeight: 600, opacity: isUpdating ? 0.6 : 1,
                            }}
                          >
                            ✓ Approve
                          </button>
                        )}

                        {/* Reject */}
                        {job.status !== 'rejected' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => updateJobStatus(job._id, 'rejected')}
                            style={{
                              background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca',
                              borderRadius: 7, padding: '5px 14px', cursor: isUpdating ? 'not-allowed' : 'pointer',
                              fontSize: 13, fontWeight: 600, opacity: isUpdating ? 0.6 : 1,
                            }}
                          >
                            ✕ Reject
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          disabled={isUpdating}
                          onClick={() => handleDelete(job._id)}
                          style={{
                            background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0',
                            borderRadius: 7, padding: '5px 14px', cursor: isUpdating ? 'not-allowed' : 'pointer',
                            fontSize: 13, fontWeight: 600, opacity: isUpdating ? 0.6 : 1,
                          }}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminJobs;
