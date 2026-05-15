import Layout from '../components/Layout';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import { useHierarchy } from '../lib/HierarchyContext';
import { toast } from '../lib/toast';

const HIERARCHY = [
  { key: 'faculty', label: 'Faculty', icon: 'fa-university', pageTitle: 'Courses' },
  { key: 'department', label: 'Department', icon: 'fa-building' },
  { key: 'program', label: 'Program', icon: 'fa-graduation-cap' },
  { key: 'year', label: 'Year', icon: 'fa-calendar' },
  { key: 'semester', label: 'Semester', icon: 'fa-calendar-alt' },
  { key: 'subject', label: 'Subject', icon: 'fa-book' },
];

const VIEWS = ['courses', 'faculty', 'department', 'level', 'year', 'semester', 'subject'];

function getChildCount(lists, key, parentId) {
  const idMap = { department: 'facultyId', program: 'departmentId', year: 'programId', semester: 'yearId', subject: 'semesterId' };
  const field = idMap[key];
  if (!field) return 0;
  return (lists[key] || []).filter(x => String(x[field]) === String(parentId)).length;
}

function getItems(lists, key, parentId, parentKey) {
  const idMap = { department: 'facultyId', program: 'departmentId', year: 'programId', semester: 'yearId', subject: 'semesterId' };
  const field = idMap[key];
  if (!field) return lists[key] || [];
  const items = (lists[key] || []).filter(x => String(x[field]) === String(parentId));
  console.log('[getItems]', key, 'parentId:', parentId, 'type:', typeof parentId, 'field:', field, 'found:', items.length, 'sample:', items[0]);
  return items;
}

export default function Browse({ toggleDarkMode, darkMode }) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { lists, updateItem, deleteItem } = useHierarchy();

  console.log('[Browse] lists:', JSON.stringify(lists).substring(0, 300));

  const [view, setView] = useState('courses');
  const [selected, setSelected] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hierarchyNavState');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return { faculty: null, department: null, program: null, year: null, semester: null };
  });
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteModal, setDeleteModal] = useState(null);

  const goBack = () => {
    const backMap = { faculty: 'courses', department: 'faculty', level: 'department', year: 'level', semester: 'year', subject: 'semester' };
    const newView = backMap[view] || 'courses';
    setView(newView);
    setEditModal(null);
    setDeleteModal(null);

    const clearMap = { faculty: ['department', 'program', 'year', 'semester', 'subject'], department: ['program', 'year', 'semester', 'subject'], level: ['year', 'semester', 'subject'], year: ['semester', 'subject'], semester: ['subject'] };
    setSelected(prev => {
      const newState = { ...prev };
      (clearMap[newView] || []).forEach(k => { newState[k] = null; });
      localStorage.setItem('hierarchyNavState', JSON.stringify(newState));
      return newState;
    });
  };

  const navigate = (newView, key, item) => {
    setView(newView);
    setSelected(prev => {
      const newState = { ...prev, [key]: item };
      localStorage.setItem('hierarchyNavState', JSON.stringify(newState));
      return newState;
    });
    setEditModal(null);
    setDeleteModal(null);
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    const name = editForm.name?.trim();
    if (!name) return;
    const { key, item } = editModal;
    updateItem(key, item.id, { name, code: editForm.code, description: editForm.description });
    setSelected(prev => ({ ...prev, [key]: { ...prev[key], name } }));
    setEditModal(null);
    setEditForm({});
    toast.success('Updated successfully');
  };

  const handleDelete = () => {
    if (!deleteModal) return;
    const { key, item } = deleteModal;
    deleteItem(key, item.id);
    toast.success('Deleted successfully');
    setDeleteModal(null);
  };

  const breadcrumb = () => {
    const crumbs = [];
    if (selected.faculty) crumbs.push({ label: 'Faculty', name: selected.faculty.name });
    if (selected.department) crumbs.push({ label: 'Department', name: selected.department.name });
    if (selected.program) crumbs.push({ label: 'Program', name: selected.program.name });
    if (selected.year) crumbs.push({ label: 'Year', name: selected.year.name });
    if (selected.semester) crumbs.push({ label: 'Semester', name: selected.semester.name });
    return crumbs;
  };

  const facultyItems = lists.faculty || [];
  const deptItems = getItems(lists, 'department', selected.faculty?.id);
  const progItems = getItems(lists, 'program', selected.department?.id);
  const yearItems = getItems(lists, 'year', selected.program?.id);
  const semItems = getItems(lists, 'semester', selected.year?.id);
  const subjItems = getItems(lists, 'subject', selected.semester?.id);

  const getPageTitle = () => {
    if (view === 'courses') return 'Courses';
    if (view === 'faculty') return selected.faculty?.name || 'Faculty';
    if (view === 'department') return selected.department?.name || 'Department';
    if (view === 'level') return selected.program?.name || 'Program';
    if (view === 'year') return selected.year?.name || 'Year';
    if (view === 'semester') return selected.semester?.name || 'Semester';
    if (view === 'subject') return selected.subject?.name || 'Subject';
    return 'Courses';
  };

  const getDesc = (key) => {
    const m = { faculty: 'University faculty', department: 'Department within faculty', program: 'Licence, Master, Doctorat', year: 'Academic year', semester: 'Semester', subject: 'Course subject' };
    return m[key] || '';
  };

  return (
    <Layout toggleDarkMode={toggleDarkMode} darkMode={darkMode}>
      <div className="page-header">
        {view !== 'courses' && (
          <button className="back-button" onClick={goBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
        )}
        <h1 className="page-title">
          <div className="page-title-icon">
            <i className="fas fa-book-open"></i>
          </div>
          {getPageTitle()}
        </h1>
      </div>

      {breadcrumb().length > 0 && (
        <div style={{ marginBottom: 20, fontSize: '0.85rem', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => { setView('courses'); setSelected({}); }}>Courses</span>
          {breadcrumb().map((c, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--ink-4)' }}>›</span>
              <span style={{ color: i < breadcrumb().length - 1 ? 'var(--ink-3)' : 'var(--ink)', fontWeight: i < breadcrumb().length - 1 ? 400 : 600 }}>
                {c.name}
              </span>
            </span>
          ))}
        </div>
      )}

      {view === 'courses' && (
        <div className="courses-grid">
          {facultyItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink-4)', gridColumn: '1 / -1' }}>
              <i className="fas fa-university" style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.4 }}></i>
              <p>No faculties added yet.</p>
              <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Admin can add faculties from the admin panel (⚙️).</p>
            </div>
          ) : facultyItems.map(item => (
            <div key={item.id} className="course-card" onClick={() => navigate('faculty', 'faculty', item)}>
              <div className="course-header">
                <div className="course-name">{item.name}</div>
                <div className="course-count">{getChildCount(lists, 'department', item.id)}</div>
              </div>
              <div className="course-content">
                <div className="course-description">
                  {item.description || `Access courses, materials, and assignments for ${item.name}.`}
                </div>
                <div className="course-actions">
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', flex: 'none' }}
                        onClick={(e) => { e.stopPropagation(); setEditModal({ key: 'faculty', item }); setEditForm({ name: item.name, description: item.description || '' }); }}>
                        <i className="fas fa-pen"></i>
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--danger)', flex: 'none' }}
                        onClick={(e) => { e.stopPropagation(); setDeleteModal({ key: 'faculty', item }); }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  )}
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); navigate('faculty', 'faculty', item); }}>Enter</button>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); router.push('/community'); }}>
                    Community
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'faculty' && (
        <div className="level-grid">
          {deptItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)', gridColumn: '1 / -1' }}>
              <i className="fas fa-building" style={{ fontSize: '3rem', marginBottom: 15, opacity: 0.5 }}></i>
              <p>No departments yet</p>
              <p>Admin can add departments using the admin controls</p>
            </div>
          ) : deptItems.map(item => {
            const progCount = getChildCount(lists, 'program', item.id);
            return (
            <div key={item.id} className="level-card" onClick={() => navigate('department', 'department', item)}>
              <div className="level-icon"><i className="fas fa-building"></i></div>
              <div className="level-name">{item.name}</div>
              <div className="level-description">{item.description || getDesc('department')}</div>
              <div style={{ marginTop: 15, fontSize: '0.85rem', color: 'var(--ink-3)' }}>{progCount} programs available</div>
              <div className="course-actions" style={{ marginTop: 20 }}>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); setEditModal({ key: 'department', item }); setEditForm({ name: item.name }); }}><i className="fas fa-pen"></i></button>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); setDeleteModal({ key: 'department', item }); }}><i className="fas fa-trash"></i></button>
                  </div>
                )}
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); navigate('department', 'department', item); }}>Enter</button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {view === 'department' && (
        <div className="level-grid">
          {progItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)', gridColumn: '1 / -1' }}>
              <i className="fas fa-graduation-cap" style={{ fontSize: '3rem', marginBottom: 15, opacity: 0.5 }}></i>
              <p>No academic levels yet</p>
              <p>Admin can add levels (Licence, Master, Doctorat, etc.) using the admin controls</p>
            </div>
          ) : progItems.map(item => {
            const yearCount = getChildCount(lists, 'year', item.id);
            return (
            <div key={item.id} className="level-card" onClick={() => navigate('level', 'program', item)}>
              <div className="level-icon"><i className="fas fa-graduation-cap"></i></div>
              <div className="level-name">{item.name}</div>
              <div className="level-description">{item.description || getDesc('program')}</div>
              <div style={{ marginTop: 15, fontSize: '0.85rem', color: 'var(--ink-3)' }}>{yearCount} years available</div>
              <div className="course-actions" style={{ marginTop: 20 }}>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); setEditModal({ key: 'program', item }); setEditForm({ name: item.name }); }}><i className="fas fa-pen"></i></button>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); setDeleteModal({ key: 'program', item }); }}><i className="fas fa-trash"></i></button>
                  </div>
                )}
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); navigate('level', 'program', item); }}>Enter</button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {view === 'level' && (
        <div className="level-grid">
          {yearItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)', gridColumn: '1 / -1' }}>
              <i className="fas fa-calendar" style={{ fontSize: '3rem', marginBottom: 15, opacity: 0.5 }}></i>
              <p>No years yet</p>
              <p>Admin can add years using the admin controls</p>
            </div>
          ) : yearItems.map(item => {
            const semCount = getChildCount(lists, 'semester', item.id);
            return (
            <div key={item.id} className="level-card" onClick={() => navigate('year', 'year', item)}>
              <div className="level-icon"><i className="fas fa-calendar"></i></div>
              <div className="level-name">{item.name}</div>
              <div className="level-description">{item.description || getDesc('year')}</div>
              <div style={{ marginTop: 15, fontSize: '0.85rem', color: 'var(--ink-3)' }}>{semCount} semesters available</div>
              <div className="course-actions" style={{ marginTop: 20 }}>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); setEditModal({ key: 'year', item }); setEditForm({ name: item.name }); }}><i className="fas fa-pen"></i></button>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); setDeleteModal({ key: 'year', item }); }}><i className="fas fa-trash"></i></button>
                  </div>
                )}
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); navigate('year', 'year', item); }}>Enter</button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {view === 'year' && (
        <div className="level-grid">
          {semItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)', gridColumn: '1 / -1' }}>
              <i className="fas fa-calendar-alt" style={{ fontSize: '3rem', marginBottom: 15, opacity: 0.5 }}></i>
              <p>No semesters yet</p>
              <p>Admin can add semesters (Semestre 1, Semestre 2, etc.) using the admin controls</p>
            </div>
          ) : semItems.map(item => {
            const subjCount = getChildCount(lists, 'subject', item.id);
            return (
            <div key={item.id} className="level-card" onClick={() => navigate('semester', 'semester', item)}>
              <div className="level-icon" style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}><i className="fas fa-calendar-alt"></i></div>
              <div className="level-name">{item.name}</div>
              <div className="level-description">{item.description || getDesc('semester')}</div>
              <div style={{ marginTop: 15, fontSize: '0.85rem', color: 'var(--ink-3)' }}>{subjCount} subjects available</div>
              <div className="course-actions" style={{ marginTop: 20 }}>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); setEditModal({ key: 'semester', item }); setEditForm({ name: item.name }); }}><i className="fas fa-pen"></i></button>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); setDeleteModal({ key: 'semester', item }); }}><i className="fas fa-trash"></i></button>
                  </div>
                )}
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); navigate('semester', 'semester', item); }}>Enter</button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {view === 'semester' && (
        <div className="module-grid">
          {subjItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)', gridColumn: '1 / -1' }}>
              <i className="fas fa-book" style={{ fontSize: '3rem', marginBottom: 15, opacity: 0.5 }}></i>
              <p>No subjects yet</p>
              <p>Admin can add subjects using the admin controls</p>
            </div>
          ) : subjItems.map(item => (
            <div key={item.id} className="module-card" onClick={() => navigate('subject', 'subject', item)}>
              <div className="module-header">
                <div className="module-icon"><i className="fas fa-book"></i></div>
                <div className="module-info">
                  <div className="module-name">{item.name}</div>
                  <div className="module-code">{item.code || ''}</div>
                </div>
              </div>
              <div className="module-sections">
                 <div className="section-title">Overview</div>
                 <div style={{ fontSize: '0.85rem', color: 'var(--ink-2)', marginBottom: 20 }}>{item.description || getDesc('subject')}</div>
              </div>
              <div className="course-actions">
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); setEditModal({ key: 'subject', item }); setEditForm({ name: item.name, code: item.code || '', description: item.description || '' }); }}><i className="fas fa-pen"></i></button>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); setDeleteModal({ key: 'subject', item }); }}><i className="fas fa-trash"></i></button>
                  </div>
                )}
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); navigate('subject', 'subject', item); }}>Enter Subject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'subject' && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>
          <i className="fas fa-file-alt" style={{ fontSize: '3rem', marginBottom: 15, opacity: 0.5 }}></i>
          <p style={{ fontWeight: 600, color: 'var(--ink)' }}>{selected.subject?.name} {selected.subject?.code ? `(${selected.subject.code})` : ''}</p>
          <p>Course lessons will appear here. Admin can add courses from the admin panel.</p>
        </div>
      )}

      {(editModal || deleteModal) && (
        <div className="modal-overlay" onClick={() => { setEditModal(null); setDeleteModal(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {editModal && (
              <>
                <div className="modal-header">
                  <h2 className="modal-title">Edit {HIERARCHY.find(h => h.key === editModal.key)?.label}</h2>
                  <div className="close-modal" onClick={() => setEditModal(null)}>×</div>
                </div>
                <form onSubmit={handleEditSave}>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input type="text" className="form-input" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} autoFocus />
                  </div>
                  {editModal.key === 'subject' && (
                    <div className="form-group">
                      <label className="form-label">Code</label>
                      <input type="text" className="form-input" value={editForm.code || ''} onChange={e => setEditForm({ ...editForm, code: e.target.value })} />
                    </div>
                  )}
                  {editModal.key === 'faculty' && (
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="form-input" rows="2" value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><i className="fas fa-save" style={{ marginRight: 6 }}></i> Save</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setEditModal(null)}>Cancel</button>
                  </div>
                </form>
              </>
            )}
            {deleteModal && (
              <>
                <div className="modal-header">
                  <h2 className="modal-title">Confirm Delete</h2>
                  <div className="close-modal" onClick={() => setDeleteModal(null)}>×</div>
                </div>
                <div style={{ padding: '10px 0' }}>
                  <p style={{ marginBottom: 16, color: 'var(--ink-2)' }}>
                    Are you sure you want to delete <strong>"{deleteModal.item.name}"</strong>?
                    This will also delete all child items.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)' }} onClick={handleDelete}><i className="fas fa-trash" style={{ marginRight: 6 }}></i> Delete</button>
                    <button className="btn btn-ghost" onClick={() => setDeleteModal(null)}>Cancel</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}