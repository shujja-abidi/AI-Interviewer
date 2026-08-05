import React, { useEffect, useState } from 'react';
import { FiBell } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { NODE_API_URL } from '../../config/api';
import { getAuthSession } from '../../utility/auth';

/**
 * NotificationsBell
 * @param {string} linkTo - The route to navigate to when clicked.
 *   Pass '/business/notifications' for business portal,
 *   '/candidate/notifications' for candidate portal.
 */
export default function NotificationsBell({ linkTo = '/notifications' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      try {
        const auth = getAuthSession();
        const email =
          auth?.email ||
          localStorage.getItem('authEmail') ||
          localStorage.getItem('businessEmail') ||
          localStorage.getItem('email');
        if (!email) return;
        const res = await fetch(
          `${NODE_API_URL}/notifications?to=${encodeURIComponent(email)}&unreadOnly=true`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setCount(Array.isArray(data) ? data.length : 0);
      } catch {
        // ignore network errors
      }
    };
    fetchCount();
    const iv = setInterval(fetchCount, 30000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  return (
    <Link to={linkTo} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', color: 'inherit' }}>
      <FiBell style={{ fontSize: 22 }} />
      {count > 0 && (
        <span style={{
          position: 'absolute',
          top: -8,
          right: -8,
          background: '#ef4444',
          color: '#fff',
          borderRadius: '50%',
          fontSize: 11,
          fontWeight: 700,
          width: 18,
          height: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
