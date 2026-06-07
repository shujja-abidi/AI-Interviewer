import React, { useEffect, useState } from 'react';
import { NODE_API_URL } from '../../config/api';

const STATUS_STAGES = [
  { id: 'pending', label: 'Applied' },
  { id: 'ongoing', label: 'Under Review' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'final', label: 'Decision' }
];

export default function CandidateApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchApps = async (emailToFetch) => {
    try {
      setLoading(true);
      const res = await fetch(`${NODE_API_URL}/applications?candidate_email=${encodeURIComponent(emailToFetch)}`);
      const data = await res.json();
      setApps(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('authEmail');
    if (stored) fetchApps(stored);
    else setLoading(false);
  }, []);

  const getStatusIndex = (status) => {
    if (status === 'pending') return 0;
    if (status === 'ongoing') return 1;
    if (status === 'shortlisted') return 2;
    if (status === 'approved' || status === 'rejected') return 3;
    return 0;
  };

  const filteredApps = apps.filter(a => filter === 'all' ? true : a.status === filter);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading applications...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">My Applications</h2>
            <p className="text-gray-500">Track the status of your job applications</p>
          </div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 bg-gray-50 text-gray-700 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Applications</option>
            <option value="pending">Applied</option>
            <option value="ongoing">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {filteredApps.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500">
            No applications found.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApps.map(a => {
              const currentStageIndex = getStatusIndex(a.status);
              
              return (
                <div key={a._id} className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{a.job_title}</h3>
                      <p className="text-gray-500">{a.business_email}</p>
                      <p className="text-sm text-gray-400 mt-1">Applied on {new Date(a.applied_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      {a.status === 'approved' && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Approved</span>}
                      {a.status === 'rejected' && <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">Rejected</span>}
                      {a.status !== 'approved' && a.status !== 'rejected' && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium capitalize">{a.status === 'ongoing' ? 'Under Review' : a.status}</span>}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                      <div style={{ width: `${(currentStageIndex / 3) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      {STATUS_STAGES.map((stage, idx) => (
                        <div key={stage.id} className={`text-center ${idx <= currentStageIndex ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                          {stage.id === 'final' 
                            ? (a.status === 'approved' ? 'Approved' : a.status === 'rejected' ? 'Rejected' : 'Decision')
                            : stage.label
                          }
                        </div>
                      ))}
                    </div>
                  </div>

                  {a.session_id && (
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Interview Assessment Submitted</h4>
                      <p className="text-xs text-gray-500">Your AI interview report has been attached to this application and is being reviewed by the employer.</p>
                      <p className="text-xs text-gray-400 mt-1">Session ID: {a.session_id}</p>
                    </div>
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
