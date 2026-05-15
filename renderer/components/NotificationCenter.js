import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth';
import { supabase, HAS_SUPABASE } from '../lib/supabase';
import { getNotificationSettings, setNotificationSettings, listNotifications, markNotificationRead } from '../lib/db';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="notif-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      <span className="toggle-label">{label}</span>
    </label>
  );
}

function NotificationItem({ notif, onDismiss }) {
  const isLive = notif.type === 'live' || notif.type === 'live_stream';
  const isCourse = notif.type === 'course' || notif.type === 'course_upload';
  const isRequest = notif.type === 'teaching_request';

  return (
    <div className={`notif-item ${isLive ? 'live' : ''} ${notif.is_read ? 'read' : ''}`}>
      <div className="notif-icon">
        {isLive ? (
          <span className="dot-pulse" />
        ) : isRequest ? (
          <span style={{ fontSize: 18 }}>🎓</span>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        )}
      </div>
      <div className="notif-content">
        <div className="notif-title">
          {isLive && <span className="pill live">Live</span>}
          {isRequest && <span className="pill brand">Request</span>}
          {notif.title}
        </div>
        <div className="notif-sub">
          {notif.message}
        </div>
        <div className="notif-time">{formatTime(notif.created_at)}</div>
      </div>
      <div className="notif-action">
        {notif.link && (
          <Link href={notif.link} className={`btn sm ${isLive ? 'live' : 'ghost'}`} onClick={onDismiss}>
            {isLive ? 'Join' : 'View'}
          </Link>
        )}
      </div>
      <button className="notif-close" onClick={onDismiss} title="Dismiss">
        ×
      </button>
    </div>
  );
}

export default function NotificationCenter({ isOpen, onClose }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({ live: true, courses: true });
  const [notifications, setNotifications] = useState([]);
  const panelRef = useRef(null);

  useEffect(() => {
    setSettings(getNotificationSettings());
  }, []);

  const refresh = async () => {
    if (!user) return;
    const { data } = await listNotifications(user.id);
    setNotifications(data || []);
  };

  useEffect(() => {
    if (!isOpen || !user) return;
    refresh();
    const interval = setInterval(refresh, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [isOpen, user]);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setNotificationSettings(newSettings);
  };

  const dismissNotif = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await markNotificationRead(id);
  };

  const clearAll = async () => {
    const ids = notifications.filter(n => !n.is_read).map(n => n.id);
    setNotifications([]);
    for (const id of ids) {
      await markNotificationRead(id);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <>
      <div className="notif-overlay" onClick={onClose} />
      <div className="notif-panel" ref={panelRef}>
        <div className="notif-header">
          <h3>Notifications {unreadCount > 0 && `(${unreadCount})`}</h3>
          {unreadCount > 0 && (
            <button className="btn ghost xs" onClick={clearAll}>Mark all as read</button>
          )}
        </div>

        <div className="notif-settings">
          <Toggle
            checked={settings.live}
            onChange={(v) => updateSetting('live', v)}
            label="Live stream alerts"
          />
          <Toggle
            checked={settings.courses}
            onChange={(v) => updateSetting('courses', v)}
            label="New course notifications"
          />
        </div>

        <div className="notif-divider" />

        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <p>No new notifications</p>
              <span>You&apos;ll see alerts here when there's new activity for you.</span>
            </div>
          ) : (
            notifications.map((n, i) => (
              <NotificationItem
                key={n.id}
                notif={n}
                onDismiss={() => dismissNotif(n.id)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}