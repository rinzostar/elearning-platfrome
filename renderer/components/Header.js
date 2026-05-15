import { useAuth } from '../lib/auth';
import Avatar from './Avatar';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import NotificationCenter from './NotificationCenter';
import { listNotifications } from '../lib/db';

export default function Header({ toggleDarkMode, darkMode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = async () => {
    if (!user) return;
    const { data } = await listNotifications(user.id);
    setUnreadCount((data || []).filter(n => !n.is_read).length);
  };

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <header className="app-header">
      <div className="logo-section">
        <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white', textDecoration: 'none' }}>
          <div className="app-icon">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <div className="app-title">University Platform</div>
        </Link>
      </div>

      <div className="header-controls">
        <div className="header-btn" onClick={() => setNotifOpen(true)} style={{ position: 'relative' }}>
          <i className="fas fa-bell"></i>
          {unreadCount > 0 && (
            <span className="notif-badge">{unreadCount}</span>
          )}
        </div>

        <div className="header-btn" onClick={toggleDarkMode}>
          <i className={darkMode ? "fas fa-sun" : "fas fa-moon"}></i>
        </div>

        <div className="user-profile" onClick={() => router.push('/profile')}>
          <div className="user-avatar">
            {(user?.name || 'A').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.name || 'Admin User'}</div>
            <div style={{ fontSize: '0.75rem', opacity: '0.8' }}>{user?.role || 'Administrator'}</div>
          </div>
        </div>
      </div>

      <NotificationCenter isOpen={notifOpen} onClose={() => { setNotifOpen(false); refreshCount(); }} />
    </header>
  );
}