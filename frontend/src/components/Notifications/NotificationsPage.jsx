import React, { useEffect, useState } from 'react';
import { NODE_API_URL } from '../../config/api';

export default function NotificationsPage() {
  const [toEmail, setToEmail] = useState('');
  const [notes, setNotes] = useState([]);

  const fetchNotes = async (email) => {
    const to = email || toEmail || window.prompt('Enter your email to load notifications:');
    if (!to) return;
    setToEmail(to);
    try {
      const res = await fetch(`${NODE_API_URL}/notifications?to=${encodeURIComponent(to)}`);
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load notifications');
    }
  };

  useEffect(()=>{
    const stored = sessionStorage.getItem('candidateEmail') || sessionStorage.getItem('businessEmail');
    if (stored) fetchNotes(stored);
  }, []);

  const markRead = async (id) => {
    try {
      const res = await fetch(`${NODE_API_URL}/notifications/${id}/read`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      setNotes(notes.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) { console.error(err); alert('Failed to mark read'); }
  };

  const markAllRead = async () => {
    try {
      if (!toEmail) return alert('Enter your email first');
      const res = await fetch(`${NODE_API_URL}/notifications/mark-all-read`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ to: toEmail }) });
      if (!res.ok) throw new Error('Failed');
      setNotes(notes.map(n => ({ ...n, read: true })));
      alert('All marked read');
    } catch (err) { console.error(err); alert('Failed to mark all read'); }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">Notifications</h2>
        <div className="mb-4 flex gap-2">
          <input value={toEmail} onChange={(e)=>setToEmail(e.target.value)} className="border p-2 rounded flex-1" placeholder="Your email" />
          <button onClick={()=>fetchNotes()} className="bg-blue-600 text-white px-4 py-2 rounded">Load</button>
          <button onClick={markAllRead} className="bg-gray-600 text-white px-4 py-2 rounded">Mark all read</button>
        </div>

        <div className="space-y-3">
          {notes.length === 0 && <p className="text-gray-500">No notifications.</p>}
          {notes.map(n=> (
            <div key={n._id} className={`p-3 rounded border ${n.read ? 'bg-gray-50' : 'bg-white shadow'}`}>
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{n.title}</div>
                  <div className="text-sm text-gray-600">{n.message}</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</div>
                  {!n.read && <button onClick={()=>markRead(n._id)} className="text-sm text-blue-600 mt-2">Mark read</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
