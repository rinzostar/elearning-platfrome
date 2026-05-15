import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useRouter } from 'next/router';
import { toast } from '../lib/toast';
import { useHierarchy } from '../lib/HierarchyContext';
import { listPostsByYear, createPost, deletePost, notifyYear, HAS_SUPABASE } from '../lib/db';
import { uploadFile } from '../lib/storage';
import Avatar from '../components/Avatar';

function timeAgo(iso) {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
}

function getChildCount(lists, key, parentId) {
  const idMap = { department: 'facultyId', program: 'departmentId', year: 'programId', semester: 'yearId', subject: 'semesterId' };
  const field = idMap[key];
  if (!field) return 0;
  return (lists[key] || []).filter(x => String(x[field]) === String(parentId)).length;
}

function loadNavState() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('hierarchyNavState');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
  }
  return { faculty: null, department: null, program: null, year: null, semester: null };
}

export default function Community({ toggleDarkMode, darkMode }) {
  const router = useRouter();
  const { user } = useAuth();
  const { lists } = useHierarchy();
  const [view, setView] = useState('faculties');
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const facultyItems = lists.faculty || [];
  const deptItems = selectedFaculty ? (lists.department || []).filter(d => String(d.facultyId) === String(selectedFaculty.id)) : [];
  const progItems = selectedDept ? (lists.program || []).filter(p => String(p.departmentId) === String(selectedDept.id)) : [];
  const yearItems = selectedProgram ? (lists.year || []).filter(y => String(y.programId) === String(selectedProgram.id)) : [];

  useEffect(() => {
    const saved = loadNavState();
    if (saved.faculty) {
      const found = (lists.faculty || []).find(f => String(f.id) === String(saved.faculty.id));
      if (found) { setSelectedFaculty(found); setView('faculty'); }
    }
    if (saved.department) {
      const found = (lists.department || []).find(d => String(d.id) === String(saved.department.id));
      if (found) { setSelectedDept(found); setView('department'); }
    }
    if (saved.program) {
      const found = (lists.program || []).find(p => String(p.id) === String(saved.program.id));
      if (found) { setSelectedProgram(found); setView('program'); }
    }
    if (saved.year) {
      const found = (lists.year || []).find(y => String(y.id) === String(saved.year.id));
      if (found) { setSelectedYear(found); setView('year'); }
    }
  }, [lists.faculty, lists.department, lists.program, lists.year]);

  const refreshPosts = async () => {
    if (!selectedYear) return;
    setLoadingPosts(true);
    // Use year code or fallback to year name for matching
    const yearCode = selectedYear.code || selectedYear.name; 
    const { data } = await listPostsByYear(yearCode);
    setPosts(data || []);
    setLoadingPosts(false);
  };

  useEffect(() => {
    if (view === 'year' && selectedYear) {
      refreshPosts();
    }
  }, [view, selectedYear]);

  const saveNavState = (newState) => {
    localStorage.setItem('hierarchyNavState', JSON.stringify(newState));
  };

  const goToFaculty = (faculty) => {
    setSelectedFaculty(faculty);
    setSelectedDept(null);
    setSelectedProgram(null);
    setSelectedYear(null);
    setView('faculty');
    saveNavState({ faculty, department: null, program: null, year: null, semester: null });
  };

  const goToDept = (dept) => {
    setSelectedDept(dept);
    setSelectedProgram(null);
    setSelectedYear(null);
    setView('department');
    saveNavState({ faculty: selectedFaculty, department: dept, program: null, year: null, semester: null });
  };

  const goToProgram = (prog) => {
    setSelectedProgram(prog);
    setSelectedYear(null);
    setView('program');
    saveNavState({ faculty: selectedFaculty, department: selectedDept, program: prog, year: null, semester: null });
  };

  const goToYear = (year) => {
    setSelectedYear(year);
    setView('year');
    saveNavState({ faculty: selectedFaculty, department: selectedDept, program: selectedProgram, year, semester: null });
  };

  const goBack = () => {
    if (view === 'faculty') {
      setSelectedFaculty(null);
      setView('faculties');
      saveNavState({ faculty: null, department: null, program: null, year: null, semester: null });
    } else if (view === 'department') {
      setSelectedDept(null);
      setView('faculty');
    } else if (view === 'program') {
      setSelectedProgram(null);
      setView('department');
    } else if (view === 'year') {
      setSelectedYear(null);
      setView('program');
    }
  };

  const handlePost = async () => {
    if ((!newPost.trim() && !file) || !selectedYear || !user) {
      if (!user) toast.error('Please login to post');
      return;
    }
    setBusy(true);
    try {
      let filePath = null;
      if (file) {
        const up = await uploadFile('post-files', file);
        filePath = up.path;
      }

      const yearCode = selectedYear.code || selectedYear.name;
      const { error } = await createPost({
        author_id: user.id,
        content: newPost.trim(),
        year_code: yearCode,
        file_path: filePath
      });
      if (error) throw error;
      
      await notifyYear(yearCode, {
        title: 'New Community Post',
        message: `${user.name || 'A student'} posted in ${selectedYear.name} community`,
        type: 'community_post',
        link: '/community'
      });

      setNewPost('');
      setFile(null);
      toast.success('Post shared');
      await refreshPosts();
    } catch (err) {
      console.error('Post failed:', err);
      toast.error(err.message || 'Failed to post');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Delete this post?')) return;
    await deletePost(postId);
    toast.success('Post removed');
    await refreshPosts();
  };

  const canDelete = (post) => {
    if (user?.role === 'admin') return true;
    const yearCode = selectedYear?.code || selectedYear?.name;
    if (user?.is_community_admin && post.year_code === user.year_code) return true;
    if (post.author_id === user?.id) return true;
    return false;
  };

  const getPageTitle = () => {
    if (view === 'faculties') return 'Community';
    if (view === 'faculty') return `${selectedFaculty?.name}`;
    if (view === 'department') return `${selectedDept?.name}`;
    if (view === 'program') return `${selectedProgram?.name}`;
    if (view === 'year') return `${selectedYear?.name}`;
    return 'Community';
  };

  const goToCourses = (e) => {
    e.stopPropagation();
    router.push('/browse');
  };

  return (
    <Layout toggleDarkMode={toggleDarkMode} darkMode={darkMode}>
      <div className="page-header">
        {view !== 'faculties' && (
          <button className="back-button" onClick={goBack} style={{ marginRight: 15, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-1)' }}>
            <i className="fas fa-arrow-left"></i>
          </button>
        )}
        <h1 className="page-title">
          <div className="page-title-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <i className="fas fa-users"></i>
          </div>
          {getPageTitle()}
        </h1>
      </div>

      {view === 'faculties' && (
        <div className="community-faculty-grid">
          {facultyItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink-4)', gridColumn: '1 / -1' }}>
              <i className="fas fa-university" style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.4 }}></i>
              <p>No faculties added yet.</p>
            </div>
          ) : facultyItems.map(faculty => {
            const depts = (lists.department || []).filter(d => String(d.facultyId) === String(faculty.id));
            return (
              <div key={faculty.id} className="community-faculty-card" onClick={() => goToFaculty(faculty)}>
                <div className="community-faculty-header">
                  <div className="community-faculty-name">{faculty.name}</div>
                  <div className="community-post-count">{depts.length}</div>
                </div>
                <div className="community-faculty-content">
                  <div className="community-faculty-description">
                    {faculty.description || `Community for ${faculty.name}`}
                  </div>
                  <div className="community-faculty-stats">
                    <span><i className="fas fa-building"></i> {depts.length} Departments</span>
                  </div>
                  <div className="course-actions">
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); goToFaculty(faculty); }}>Enter Community</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'faculty' && selectedFaculty && (
        <div className="level-grid">
          {deptItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)', gridColumn: '1 / -1' }}>
              <i className="fas fa-building" style={{ fontSize: '3rem', marginBottom: 15, opacity: 0.5 }}></i>
              <p>No departments yet</p>
            </div>
          ) : deptItems.map(dept => {
            const progCount = getChildCount(lists, 'program', dept.id);
            return (
              <div key={dept.id} className="level-card" onClick={() => goToDept(dept)}>
                <div className="level-icon"><i className="fas fa-building"></i></div>
                <div className="level-name">{dept.name}</div>
                <div className="level-description">{dept.description || `Department in ${selectedFaculty.name}`}</div>
                <div style={{ marginTop: 15, display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--ink-3)' }}>
                  <span><i className="fas fa-graduation-cap"></i> {progCount} Programs</span>
                </div>
                <div className="course-actions" style={{ marginTop: 20 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }}>View Community</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'department' && selectedDept && (
        <div className="level-grid">
          {progItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)', gridColumn: '1 / -1' }}>
              <i className="fas fa-graduation-cap" style={{ fontSize: '3rem', marginBottom: 15, opacity: 0.5 }}></i>
              <p>No programs yet</p>
            </div>
          ) : progItems.map(prog => {
            const yearCount = getChildCount(lists, 'year', prog.id);
            return (
              <div key={prog.id} className="level-card" onClick={() => goToProgram(prog)}>
                <div className="level-icon"><i className="fas fa-graduation-cap"></i></div>
                <div className="level-name">{prog.name}</div>
                <div style={{ marginTop: 15, display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--ink-3)' }}>
                  <span><i className="fas fa-calendar"></i> {yearCount} Years</span>
                </div>
                <div className="course-actions" style={{ marginTop: 20 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }}>Enter</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'program' && selectedProgram && (
        <div className="level-grid">
          {yearItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)', gridColumn: '1 / -1' }}>
              <i className="fas fa-calendar" style={{ fontSize: '3rem', marginBottom: 15, opacity: 0.5 }}></i>
              <p>No years yet</p>
            </div>
          ) : yearItems.map(year => {
            return (
              <div key={year.id} className="level-card" onClick={() => goToYear(year)}>
                <div className="level-icon"><i className="fas fa-calendar"></i></div>
                <div className="level-name">{year.name}</div>
                <div className="course-actions" style={{ marginTop: 20 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }}>View Posts</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'year' && selectedYear && (
        <>
          <div className="create-post-section">
            <div className="post-input-wrapper">
              <div className="user-avatar-small">{(user?.name || 'A').substring(0, 2).toUpperCase()}</div>
              <div className="post-input-container">
                <textarea
                  className="post-textarea"
                  placeholder={`What's on your mind, ${user?.name?.split(' ')[0] || 'there'}?`}
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                />
              </div>
            </div>
            <div className="post-actions">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <label className="file-upload-btn">
                  <i className="fas fa-paperclip"></i>
                  {file ? file.name.substring(0, 15) + '...' : 'Attach'}
                  <input type="file" hidden onChange={e => setFile(e.target.files?.[0])} />
                </label>
                {file && <button className="btn ghost xs danger" onClick={() => setFile(null)}>×</button>}
              </div>
              <button className="post-btn" onClick={handlePost} disabled={busy || (!newPost.trim() && !file)}>
                <i className="fas fa-paper-plane" style={{ marginRight: 6 }}></i>
                {busy ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>

          <div className="posts-section">
            <div className="section-header">
              <div className="section-label">
                <i className="fas fa-comment"></i>
                Discussions in {selectedYear.name}
              </div>
            </div>
            
            {loadingPosts ? (
              <div className="skel" style={{ height: 100 }} />
            ) : posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>
                <i className="fas fa-comments" style={{ fontSize: '3rem', marginBottom: 15, opacity: 0.5 }}></i>
                <p>No posts yet. Be the first to post!</p>
              </div>
            ) : (
              <div className="posts-list">
                {posts.map((post, i) => (
                  <div key={post.id} className="post-item">
                    <div className="post-header">
                      <div className={`post-avatar avatar-${(i % 4) + 1}`}>
                        {(post.profiles?.full_name || 'A').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="post-author">
                        <div className="author-name">{post.profiles?.full_name}</div>
                        <div className="post-time">{timeAgo(post.created_at)}</div>
                      </div>
                      {canDelete(post) && (
                        <button className="btn ghost xs danger" onClick={() => handleDelete(post.id)} style={{ padding: '4px 8px' }}>
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                    <div className="post-content">
                      {post.content}
                    </div>
                    <div className="post-actions-icons">
                      <button className="post-action-btn">
                        <i className="fas fa-heart"></i>
                        Like
                      </button>
                      <button className="post-action-btn">
                        <i className="fas fa-comment"></i>
                        Comment
                      </button>
                      <button className="post-action-btn" style={{ marginLeft: 'auto' }}>
                        <i className="fas fa-share"></i>
                        Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
