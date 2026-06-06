import React, { useEffect, useState } from 'react';
import { NODE_API_URL } from '../../config/api';

export default function CandidateApplications() {
  const [email, setEmail] = useState('');
  const [apps, setApps] = useState([]);

  const fetchApps = async (e) => {
    const candidate_email = e || email || window.prompt('Enter candidate email to load applications:');
    if (!candidate_email) return;
    setEmail(candidate_email);
    try {
      const res = await fetch(`${NODE_API_URL}/applications?candidate_email=${encodeURIComponent(candidate_email)}`);
      const data = await res.json();
      setApps(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load applications');
    }
  };

  useEffect(() => {
    // try loading from session if stored
    const stored = sessionStorage.getItem('candidateEmail');
    if (stored) fetchApps(stored);
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">My Applications</h2>
        <div className="mb-4 flex gap-2">
          <input value={email} onChange={(e)=>setEmail(e.target.value)} className="border p-2 rounded flex-1" placeholder="Your email" />
          <button onClick={()=>fetchApps()} className="bg-blue-600 text-white px-4 py-2 rounded">Load</button>
        </div>
        <div className="space-y-4">
          {apps.map(a=> (
            <div key={a._id} className="border p-4 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{a.job_title}</div>
                  <div className="text-sm text-gray-500">{a.business_email}</div>
                  {a.scheduled_interview && a.scheduled_interview.scheduled_time && (
                    <div className="text-sm text-gray-600 mt-1">Interview: {new Date(a.scheduled_interview.scheduled_time).toLocaleString()}</div>
                  )}
                </div>
                <div className="text-sm px-3 py-1 rounded-full" style={{background:'#f3f4f6'}}>{a.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
