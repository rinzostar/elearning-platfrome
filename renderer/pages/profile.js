import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import Avatar from '../components/Avatar';
import { toast } from '../lib/toast';

export default function Profile({ toggleDarkMode, darkMode }) {
  const { user } = useAuth();
  const [academicInfo, setAcademicInfo] = useState({ faculty: '', department: '', level: '', semester: '' });
  const [notifications, setNotifications] = useState({ global: true, community: true, courses: true });
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('academicInfo');
    if (stored) setAcademicInfo(JSON.parse(stored));
    
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) setProfileImage(savedImage);
  }, []);

  const handleImageChange = (imageUrl) => {
    setProfileImage(imageUrl);
    localStorage.setItem('profileImage', imageUrl);
    toast.success('Profile picture updated!');
  };

  const saveAcademicInfo = (e) => {
    e.preventDefault();
    localStorage.setItem('academicInfo', JSON.stringify(academicInfo));
    toast.success('Academic level saved!');
  };

  return (
    <Layout toggleDarkMode={toggleDarkMode} darkMode={darkMode}>
      <div className="page-header">
        <h1 className="page-title">
          <div className="page-title-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          Profile
        </h1>
      </div>

      <div className="profile-container" style={{ maxWidth: 1200 }}>
        <div className="profile-card" style={{ textAlign: 'center' }}>
          <div className="profile-header" style={{ border: 'none', marginBottom: 0, paddingBottom: 0 }}>
            <div style={{ display: 'inline-block', position: 'relative' }}>
              <Avatar 
                name={user?.name || 'Admin User'} 
                id={user?.id} 
                size={120} 
                fontSize={40}
                editable={true}
                onImageChange={handleImageChange}
              />
            </div>
            <div className="profile-name" style={{ marginTop: 15 }}>{user?.name || 'Admin User'}</div>
            <div className="profile-role">{user?.role || 'Administrator'}</div>
            <div style={{ color: 'var(--ink-3)', fontSize: '0.9rem' }}>University Administration</div>
            <div style={{ color: 'var(--ink-3)', fontSize: '0.9rem', marginTop: 8 }}>admin@university.edu</div>
            <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--ink-4)' }}>
              <i className="fas fa-camera" style={{ marginRight: 5 }}></i>
              Click avatar to change photo
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20, marginTop: 20 }}>
            <div className="profile-stats">
              <div className="stat-item">
                <div className="stat-value" style={{ color: 'var(--primary)' }}>12</div>
                <div className="stat-label">Courses</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: '#43e97b' }}>156</div>
                <div className="stat-label">PDFs</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: '#f093fb' }}>24</div>
                <div className="stat-label">Posts</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: '#4facfe' }}>5</div>
                <div className="stat-label">Faculties</div>
              </div>
            </div>
          </div>

          <div className="academic-level-selector">
            <div className="level-selector-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              Set Your Academic Level
            </div>
            <form onSubmit={saveAcademicInfo}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 12 }}>
                <input type="text" className="form-input" placeholder="Faculty" value={academicInfo.faculty} onChange={e => setAcademicInfo({...academicInfo, faculty: e.target.value})} />
                <input type="text" className="form-input" placeholder="Department" value={academicInfo.department} onChange={e => setAcademicInfo({...academicInfo, department: e.target.value})} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input type="text" className="form-input" placeholder="Level" value={academicInfo.level} onChange={e => setAcademicInfo({...academicInfo, level: e.target.value})} />
                  <input type="text" className="form-input" placeholder="Semester" value={academicInfo.semester} onChange={e => setAcademicInfo({...academicInfo, semester: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="save-level-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                </svg>
                Save Academic Level
              </button>
            </form>
          </div>
        </div>

        <div className="profile-card">
          <h2 style={{ marginBottom: 20, color: 'var(--ink)' }}>Settings</h2>
          <ul className="settings-list">
            <li className="setting-item">
              <div className="setting-label">
                <div className="setting-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div>
                  <div>Global Notifications</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)' }}>Turn off all notifications</div>
                </div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={notifications.global} onChange={e => setNotifications({...notifications, global: e.target.checked})} />
                <span className="toggle-slider"></span>
              </label>
            </li>
            <li className="setting-item">
              <div className="setting-label">
                <div className="setting-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span>Community Notifications</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={notifications.community} onChange={e => setNotifications({...notifications, community: e.target.checked})} />
                <span className="toggle-slider"></span>
              </label>
            </li>
            <li className="setting-item">
              <div className="setting-label">
                <div className="setting-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <span>Course Notifications</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={notifications.courses} onChange={e => setNotifications({...notifications, courses: e.target.checked})} />
                <span className="toggle-slider"></span>
              </label>
            </li>
            <li className="setting-item">
              <div className="setting-label">
                <div className="setting-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </div>
                <span>Dark Mode</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
                <span className="toggle-slider"></span>
              </label>
            </li>
          </ul>

          <div style={{ marginTop: 30 }}>
            <h3 style={{ marginBottom: 15, color: 'var(--ink)' }}>Module Notifications</h3>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 20, border: '1px solid var(--line)', textAlign: 'center' }}>
              <div style={{ color: 'var(--ink-3)', fontSize: '0.9rem' }}>
                <i className="fas fa-bell" style={{ fontSize: '1.5rem', marginBottom: 10, opacity: 0.5 }}></i>
                <p>No modules with notifications yet</p>
                <p style={{ fontSize: '0.8rem', marginTop: 5 }}>Enable notifications on modules you want to follow</p>
              </div>
            </div>
          </div>

          <div className="disconnect-section">
            <h3 style={{ marginBottom: 12, color: 'var(--ink)' }}>Session Management</h3>
            <p style={{ color: 'var(--ink-3)', marginBottom: 16, fontSize: '0.9rem' }}>
              You are currently logged in as administrator. Click below to disconnect your session.
            </p>
            <button className="disconnect-btn" onClick={() => toast.info('Session disconnect requested')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
