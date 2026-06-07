import React, { useEffect, useState } from 'react';
import { NODE_API_URL } from '../../config/api';
import ContactCandidate from '../Business/ContactCandidate';
import { getAuthSession } from '../../utility/auth';

export default function EmployerApplications() {
  const [apps, setApps] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [contactEmail, setContactEmail] = useState(null);
  const auth = getAuthSession();

  const fetchApps = async () => {
    if (!auth.email) return;
    try {
      const res = await fetch(`${NODE_API_URL}/applications?business_email=${encodeURIComponent(auth.email)}`, { credentials: 'include' });
      const data = await res.json();
      setApps(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load applications');
    }
  };

  useEffect(()=>{
    fetchApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.email]);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${NODE_API_URL}/applications/${id}/status`, {
        method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status, changed_by: auth.email })
      , credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      alert('Status updated');
      fetchApps();
    } catch (err) { console.error(err); alert('Update failed'); }
  };



  const filteredApps = statusFilter ? apps.filter(a => a.status === statusFilter) : apps;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Manage Applications</h2>
        
        <div className="mb-6 flex gap-4 items-center">
          <label className="font-medium text-gray-700">Filter by Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border p-2 rounded flex-1 max-w-xs"
          >
            <option value="">All Applications</option>
            <option value="pending">Pending</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button onClick={fetchApps} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">Refresh</button>
        </div>

        <div className="space-y-4">
          {filteredApps.map(a => (
            <div key={a._id} className="border p-4 rounded bg-gray-50 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <div className="font-bold text-lg text-gray-800">{a.job_title}</div>
                <div className="text-sm text-gray-600 mb-2">{a.candidate_name || a.candidate_email} ({a.candidate_email})</div>
                <div className="text-sm px-3 py-1 rounded-full inline-block font-medium" style={{background:'#e5e7eb'}}>{a.status.replace('_', ' ').toUpperCase()}</div>
              </div>
              
              <div className="flex flex-wrap gap-2 items-center">
                <button onClick={() => setContactEmail(a.candidate_email)} className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition text-sm font-medium">Contact Candidate</button>
                {a.status !== 'shortlisted' && a.status !== 'approved' && (
                  <button onClick={()=>updateStatus(a._id,'shortlisted')} className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition text-sm font-medium">Shortlist</button>
                )}
                {a.status === 'shortlisted' && (
                  <button onClick={()=>updateStatus(a._id,'approved')} className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition text-sm font-medium">Hire / Approve</button>
                )}
                {a.status !== 'rejected' && (
                  <button onClick={()=>updateStatus(a._id,'rejected')} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition text-sm font-medium">Reject</button>
                )}
              </div>
            </div>
          ))}
          {filteredApps.length === 0 && (
            <div className="text-center text-gray-500 py-8">No applications found.</div>
          )}
        </div>
        

        
        {contactEmail && (
          <ContactCandidate candidateEmail={contactEmail} onClose={() => setContactEmail(null)} />
        )}
      </div>
    </div>
  );
}
