import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../lib/auth';
import { listFavorites, listActiveLivestreams } from '../lib/db';
import { toast } from '../lib/toast';
import Link from 'next/link';
import Avatar from '../components/Avatar';
import { useHierarchy } from '../lib/HierarchyContext';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home({ toggleDarkMode, darkMode }) {
  const { user } = useAuth();
  const { lists } = useHierarchy();
  const [favs, setFavs] = useState([]);
  const [lives, setLives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [academicInfo, setAcademicInfo] = useState({
    faculty: '',
    department: '',
    level: '',
    year: '',
    semester: ''
  });
  const [showLevelModal, setShowLevelModal] = useState(false);

  const saveAcademicInfo = (e) => {
    e.preventDefault();
    localStorage.setItem('academicInfo', JSON.stringify(academicInfo));
    setShowLevelModal(false);
    toast.success('Academic Level Updated');
  };

  useEffect(() => {
    if (user?.year_code) {
      setAcademicInfo(prev => ({ ...prev, level: user.year_code }));
    } else {
      const stored = localStorage.getItem('academicInfo');
      if (stored) setAcademicInfo(JSON.parse(stored));
    }
  }, [user]);

  const handleQuickAccess = () => {
    if (user?.role === 'student' && user.year_code) {
      router.push('/community'); 
      return;
    }
    if (!academicInfo.level) {
      setShowLevelModal(true);
      return;
    }
    toast.info(`Navigate to ${academicInfo.level}`);
  };

  const facultyOptions = lists.faculty || [];
  const departmentOptions = academicInfo.faculty ? (lists.department || []).filter(d => d.facultyId === academicInfo.faculty) : [];
  const programOptions = academicInfo.department ? (lists.program || []).filter(p => p.departmentId === academicInfo.department) : [];
  const yearOptions = academicInfo.program ? (lists.year || []).filter(y => y.programId === academicInfo.program) : [];
  const semesterOptions = academicInfo.year ? (lists.semester || []).filter(s => s.yearId === academicInfo.year) : [];

  return (
    <Layout toggleDarkMode={toggleDarkMode} darkMode={darkMode}>
      <div className="page-header">
        <h1 className="page-title">
          <div className="page-title-icon">
            <i className="fas fa-home"></i>
          </div>
          Home
        </h1>
      </div>

      <div className="academic-level-card" style={{ cursor: 'pointer' }} onClick={() => setShowLevelModal(true)}>
        <div className="academic-level-title">
          <i className="fas fa-user-graduate"></i>
          Your Academic Level
        </div>
        <div className="academic-level-path">
          {academicInfo.level ? (
            <div>
              <div style={{ marginBottom: 5 }}>
                <i className="fas fa-home" style={{ color: '#667eea', marginRight: 5 }}></i>
                Home
                <i className="fas fa-arrow-right" style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 8px' }}></i>
                <i className="fas fa-calendar" style={{ color: '#667eea', marginRight: 5 }}></i>
                Year
              </div>
              <div style={{ opacity: 0.8, fontSize: '0.9rem', color: '#94a3b8' }}>
                Quick access to: {academicInfo.faculty} &gt; {academicInfo.department} &gt; {academicInfo.level}
              </div>
            </div>
          ) : 'Not set yet - Click to configure'}
        </div>
        <div className="academic-level-actions">
          <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); handleQuickAccess(); }}>
            <i className="fas fa-rocket" style={{ marginRight: 8 }}></i>
            Quick Access to Year
          </button>
          <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); setShowLevelModal(true); }}>
            <i className="fas fa-edit" style={{ marginRight: 8 }}></i>
            Edit Level
          </button>
        </div>
        <div className="academic-level-info">
          <i className="fas fa-info-circle" style={{ marginRight: 5 }}></i>
          Quick access takes you directly to your Year page
        </div>
      </div>

      {lives && lives.length > 0 && (
        <div className="section-container" style={{ borderColor: '#ef4444', background: '#fff7f7' }}>
          <div className="section-header">
            <div className="section-label">
              <span className="pill live">Live Now</span>
            </div>
          </div>
          <div className="favorite-item" style={{ background: 'white' }}>
            <div className="favorite-icon" style={{ background: '#ef4444' }}>
              <i className="fas fa-play"></i>
            </div>
            <div className="favorite-details">
              <div className="favorite-title">{lives[0].module_name || 'Live session'}</div>
              <div className="favorite-subtitle">{lives[0].profiles?.full_name || 'Professor'}</div>
            </div>
            <Link href={`/live?module=${lives[0].module_id}`} className="btn btn-primary" style={{ flex: 'none' }}>Join Live</Link>
          </div>
        </div>
      )}

      <div className="section-container">
        <div className="section-header">
          <div className="section-label">
            <i className="fas fa-star"></i>
            Favorite Courses
          </div>
          <Link href="/browse" className="view-all">View All</Link>
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1].map(i => (
              <div key={i} className="favorite-item" style={{ opacity: 0.5 }}>
                <div className="favorite-icon" />
                <div className="favorite-details">
                  <div style={{ height: 14, width: 120, background: '#e2e8f0', borderRadius: 4 }} />
                  <div style={{ height: 12, width: 80, background: '#f1f5f9', borderRadius: 4, marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : favs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
            <i className="fas fa-star" style={{ fontSize: '2rem', marginBottom: 10, opacity: 0.5 }}></i>
            <p>No favorite courses yet. Click the heart icon on any module to save it here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {favs.slice(0, 3).map(c => (
              <Link key={c.id} href={`/module?id=${c.module_id}`} className="favorite-item">
                <div className="favorite-icon math">
                  <i className="fas fa-book"></i>
                </div>
                <div className="favorite-details">
                  <div className="favorite-title">{c.title || c.module?.name}</div>
                  <div className="favorite-subtitle">{c.module?.name || 'Course Module'}</div>
                </div>
                <div className="favorite-meta">View →</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="section-container">
        <div className="section-header">
          <div className="section-label">
            <i className="fas fa-heart"></i>
            Favorite Community Posts
          </div>
          <Link href="/community" className="view-all">View All</Link>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
          <i className="fas fa-heart" style={{ fontSize: '2rem', marginBottom: 10, opacity: 0.5 }}></i>
          <p>No favorite posts yet. Click the heart icon on any community post to save it here.</p>
        </div>
      </div>

      {showLevelModal && (
        <div className="modal-overlay" onClick={() => setShowLevelModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Set Your Academic Level</h2>
              <div className="close-modal" onClick={() => setShowLevelModal(false)}>×</div>
            </div>
            <form onSubmit={saveAcademicInfo} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div className="form-group">
                <label className="form-label">Faculty</label>
                <select 
                  className="form-input"
                  value={academicInfo.faculty} 
                  onChange={e => setAcademicInfo({...academicInfo, faculty: e.target.value, department: '', level: '', year: '', semester: ''})}
                >
                  <option value="">Select faculty...</option>
                  {facultyOptions.map(f => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select 
                  className="form-input"
                  value={academicInfo.department} 
                  onChange={e => setAcademicInfo({...academicInfo, department: e.target.value, level: '', year: '', semester: ''})}
                  disabled={!academicInfo.faculty}
                >
                  <option value="">Select department...</option>
                  {departmentOptions.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Program (Level)</label>
                <select 
                  className="form-input"
                  value={academicInfo.level} 
                  onChange={e => setAcademicInfo({...academicInfo, level: e.target.value, year: '', semester: ''})}
                  disabled={!academicInfo.department}
                >
                  <option value="">Select program...</option>
                  {programOptions.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <select 
                  className="form-input"
                  value={academicInfo.year} 
                  onChange={e => setAcademicInfo({...academicInfo, year: e.target.value, semester: ''})}
                  disabled={!academicInfo.level}
                >
                  <option value="">Select year...</option>
                  {yearOptions.map(y => (
                    <option key={y.id} value={y.name}>{y.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLevelModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}