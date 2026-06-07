import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NODE_API_URL } from '../../config/api';

const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    background: '#fff',
    borderRadius: 12,
    padding: '18px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flex: '1 1 160px',
    minWidth: 140,
    border: `1px solid ${color}30`,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 10,
      background: `${color}15`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 22, flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

const CandidateHome = () => {
  const navigate = useNavigate();
  const [jobPosts, setJobPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState(null);
  const limit = 10;

  // Fetch candidate application stats
  useEffect(() => {
    const email = localStorage.getItem('authEmail');
    if (!email) return;
    const fetchStats = async () => {
      try {
        const res = await fetch(`${NODE_API_URL}/applications?candidate_email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const counts = { total: data.length, pending: 0, ongoing: 0, shortlisted: 0, approved: 0, rejected: 0 };
        data.forEach((a) => {
          if (counts[a.status] !== undefined) counts[a.status]++;
        });
        setStats(counts);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      }
    };
    fetchStats();
  }, []);

  const fetchJobs = async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const queryParams = new URLSearchParams({ search, location, type, page: currentPage, limit }).toString();
      const response = await fetch(`${NODE_API_URL}/getjobs?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch job posts');
      const data = await response.json();
      setHasMore(data.length >= limit);
      if (reset) {
        setJobPosts(data);
        setPage(2);
      } else {
        setJobPosts((prev) => [...prev, ...data]);
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  useEffect(() => {
    fetchJobs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, location, type]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <main style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Welcome header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#1e293b' }}>
            Welcome back! 👋
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 15 }}>
            Explore job opportunities, check your application status, and prepare for AI interviews.
          </p>
        </div>

        {/* Stats widget */}
        {stats && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 0 }}>
              <StatCard label="Total Applied" value={stats.total} color="#3b82f6" icon="📋" />
              <StatCard label="Pending Review" value={stats.pending} color="#f59e0b" icon="⏳" />
              <StatCard label="Shortlisted" value={stats.shortlisted} color="#8b5cf6" icon="⭐" />
              <StatCard label="Approved" value={stats.approved} color="#10b981" icon="✅" />
              <StatCard label="Rejected" value={stats.rejected} color="#ef4444" icon="✕" />
            </div>
            {stats.total > 0 && (
              <div style={{ marginTop: 10, textAlign: 'right' }}>
                <button
                  onClick={() => navigate('/candidate/applications')}
                  style={{
                    background: 'none', border: 'none', color: '#3b82f6',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline',
                  }}
                >
                  View all applications →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Search & Filter Panel */}
        <div style={{
          background: '#fff', padding: '20px 24px', borderRadius: 14,
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 20,
        }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search by title, company, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: '2 1 200px', border: '1px solid #e2e8f0', borderRadius: 8,
                padding: '10px 14px', fontSize: 14, color: '#374151',
              }}
            />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                flex: '1 1 120px', border: '1px solid #e2e8f0', borderRadius: 8,
                padding: '10px 14px', fontSize: 14, color: '#374151',
              }}
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                flex: '1 1 120px', border: '1px solid #e2e8f0', borderRadius: 8,
                padding: '10px 14px', fontSize: 14, background: '#fff', color: '#374151',
              }}
            >
              <option value="">Any Type</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
            <button
              type="submit"
              style={{
                background: '#3b82f6', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 22px', fontSize: 14,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Search
            </button>
          </form>
        </div>

        {/* Job Listings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {jobPosts.map((job) => (
            <div
              key={job._id}
              style={{
                background: '#fff', padding: '20px 24px', borderRadius: 14,
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: 14,
                border: '1px solid #f1f5f9',
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)'; }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                  {job.basicDetails?.title || 'Job Title'}
                </h2>
                <p style={{ margin: '4px 0', fontSize: 14, color: '#64748b' }}>
                  {job.name || 'Unknown Company'}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {job.basicDetails?.location && (
                    <span style={{
                      background: '#f1f5f9', color: '#475569', borderRadius: 9999,
                      padding: '3px 10px', fontSize: 12, fontWeight: 500,
                    }}>
                      📍 {job.basicDetails.location}
                    </span>
                  )}
                  {job.basicDetails?.jobType && (
                    <span style={{
                      background: '#eff6ff', color: '#1d4ed8', borderRadius: 9999,
                      padding: '3px 10px', fontSize: 12, fontWeight: 500,
                      border: '1px solid #bfdbfe',
                    }}>
                      {job.basicDetails.jobType}
                    </span>
                  )}
                  {job.createdAt && (
                    <span style={{
                      background: '#f8fafc', color: '#94a3b8', borderRadius: 9999,
                      padding: '3px 10px', fontSize: 12,
                    }}>
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => navigate(`/candidate/job/${job._id}`)}
                style={{
                  background: '#3b82f6', color: '#fff', border: 'none',
                  borderRadius: 9, padding: '10px 22px', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                View Details →
              </button>
            </div>
          ))}

          {jobPosts.length === 0 && (
            <div style={{
              background: '#fff', borderRadius: 14, padding: '56px 28px',
              textAlign: 'center', color: '#94a3b8', fontSize: 15,
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            }}>
              No jobs found matching your criteria. Try adjusting your filters.
            </div>
          )}
        </div>

        {/* Load More */}
        {jobPosts.length > 0 && hasMore && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              onClick={() => fetchJobs(false)}
              style={{
                background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
                borderRadius: 9, padding: '10px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Load More Jobs
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CandidateHome;
