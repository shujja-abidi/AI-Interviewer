import React, { useEffect, useState } from 'react';
import { FiBell } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { NODE_API_URL } from '../../config/api';

export default function NotificationsBell({ email }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      try {
        const stored = localStorage.getItem('authEmail');
        const to = email || stored || sessionStorage.getItem('candidateEmail') || sessionStorage.getItem('businessEmail');
        if (!to) return;
        const res = await fetch(`${NODE_API_URL}/notifications?to=${encodeURIComponent(to)}&unreadOnly=true`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setCount(Array.isArray(data) ? data.length : 0);
      } catch (err) {
        // ignore
      }
    };
    fetchCount();
    const iv = setInterval(fetchCount, 30000);
    return () => { mounted = false; clearInterval(iv); };
  }, [email]);

  return (
    <Link to="/notifications" className="relative inline-block">
      <FiBell className="text-2xl" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">{count}</span>
      )}
    </Link>
  );
}
