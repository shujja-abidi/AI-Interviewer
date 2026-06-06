import React, { useEffect, useState } from 'react';
import { NODE_API_URL } from '../../config/api';

function ScheduleModal({ open, onClose, onSubmit }) {
  const [when, setWhen] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(()=>{ if (!open) { setWhen(''); setLink(''); setNotes(''); } }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">Schedule Interview</h3>
        <label className="block mb-2 text-sm">Date & Time</label>
        <input type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)} className="w-full border p-2 rounded mb-3" />
        <label className="block mb-2 text-sm">Meeting Link (optional)</label>
        <input value={link} onChange={e=>setLink(e.target.value)} className="w-full border p-2 rounded mb-3" placeholder="https://" />
        <label className="block mb-2 text-sm">Notes (optional)</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="w-full border p-2 rounded mb-4" />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
          <button onClick={()=>onSubmit({ scheduled_time: when, interview_link: link, notes })} className="px-4 py-2 rounded bg-green-600 text-white">Schedule</button>
        </div>
      </div>
    </div>
  );
}

export default function EmployerApplications() {
  const [email, setEmail] = useState('');
  const [apps, setApps] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentAppId, setCurrentAppId] = useState(null);

  const fetchApps = async () => {
    const business_email = email || window.prompt('Enter your business email to load applications:');
    if (!business_email) return;
    setEmail(business_email);
    try {
      const res = await fetch(`${NODE_API_URL}/applications?business_email=${encodeURIComponent(business_email)}`, { credentials: 'include' });
      const data = await res.json();
      setApps(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load applications');
    }
  };

  useEffect(()=>{
    const stored = sessionStorage.getItem('businessEmail');
    if (stored) { setEmail(stored); fetchApps(); }
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${NODE_API_URL}/applications/${id}/status`, {
        method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status, changed_by: email })
      , credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const updated = await res.json();
      alert('Status updated');
      fetchApps();
    } catch (err) { console.error(err); alert('Update failed'); }
  };
  const openScheduleModal = (id) => { setCurrentAppId(id); setShowModal(true); };
  const closeScheduleModal = () => { setCurrentAppId(null); setShowModal(false); };
  const scheduleInterview = async (payload) => {
    if (!currentAppId) return;
    try {
      const res = await fetch(`${NODE_API_URL}/applications/${currentAppId}/schedule`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        credentials: 'include',
        body: JSON.stringify({ ...payload, changed_by: email })
      });
      if (!res.ok) throw new Error('Failed to schedule');
      alert('Interview scheduled');
      closeScheduleModal();
      fetchApps();
    } catch (err) { console.error(err); alert('Scheduling failed'); }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Employer Applications</h2>
        <div className="mb-4 flex gap-2">
          <input value={email} onChange={(e)=>setEmail(e.target.value)} className="border p-2 rounded flex-1" placeholder="Business email" />
          <button onClick={fetchApps} className="bg-blue-600 text-white px-4 py-2 rounded">Load</button>
        </div>
        <div className="space-y-4">
          {apps.map(a=> (
            <div key={a._id} className="border p-4 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{a.job_title}</div>
                  <div className="text-sm text-gray-500">{a.candidate_email}</div>
                </div>
                  <div className="flex items-center gap-2">
                  <div className="text-sm px-3 py-1 rounded-full" style={{background:'#f3f4f6'}}>{a.status}</div>
                  <button onClick={()=>updateStatus(a._id,'shortlisted')} className="bg-yellow-500 text-white px-3 py-1 rounded">Shortlist</button>
                  <button onClick={()=>openScheduleModal(a._id)} className="bg-green-600 text-white px-3 py-1 rounded">Schedule</button>
                  <button onClick={()=>updateStatus(a._id,'rejected')} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <ScheduleModal open={showModal} onClose={closeScheduleModal} onSubmit={scheduleInterview} />
      </div>
    </div>
  );
}
