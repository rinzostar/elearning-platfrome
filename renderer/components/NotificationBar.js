import { useState, useEffect } from 'react';

export default function NotificationBar() {
  const [active, setActive] = useState(false);
  const [notif, setNotif] = useState({ title: '', message: '' });

  useEffect(() => {
    // Listen for custom events to show notifications
    const handler = (e) => {
      setNotif(e.detail);
      setActive(true);
      setTimeout(() => setActive(false), 5000);
    };
    window.addEventListener('show-notification', handler);
    return () => window.removeEventListener('show-notification', handler);
  }, []);

  return (
    <div className={`notification-bar ${active ? 'active' : ''}`}>
      <div className="favorite-icon" style={{ background: 'white', color: 'var(--primary)', width: '35px', height: '35px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </div>
      <div className="notification-content">
        <div className="notification-title">{notif.title}</div>
        <div className="notification-message">{notif.message}</div>
      </div>
      <button className="notification-close" onClick={() => setActive(false)}>&times;</button>
    </div>
  );
}

export function showNotification(title, message) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('show-notification', { detail: { title, message } }));
  }
}
