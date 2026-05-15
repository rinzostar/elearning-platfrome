import { useState, useEffect } from 'react';
import { toast } from '../lib/toast';
import { useHierarchy } from '../lib/HierarchyContext';

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <div className="close-modal" onClick={onClose}>×</div>
        </div>
        {children}
      </div>
    </div>
  );
}

function DeleteItem({ name, count, onDelete }) {
  return (
    <div className="delete-item">
      <div>
        <div style={{ fontWeight: 500 }}>{name}</div>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{count}</div>
      </div>
      <button className="delete-btn" onClick={onDelete}>
        <i className="fas fa-trash"></i> Delete
      </button>
    </div>
  );
}

const CascadeWarning = () => (
  <div style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: 10 }}>
    <i className="fas fa-exclamation-triangle"></i> Warning: Deletes all children too!
  </div>
);

export default function AdminPanel({ isOpen, onClose }) {
  const { lists, addItem, deleteItem } = useHierarchy();
  const [activeModal, setActiveModal] = useState(null);

  // Add form fields
  const [addFacultyName, setAddFacultyName] = useState('');
  const [addFacultyDesc, setAddFacultyDesc] = useState('');
  const [addDeptFaculty, setAddDeptFaculty] = useState('');
  const [addDeptName, setAddDeptName] = useState('');
  const [addDeptDesc, setAddDeptDesc] = useState('');
  const [addProgFaculty, setAddProgFaculty] = useState('');
  const [addProgDept, setAddProgDept] = useState('');
  const [addProgName, setAddProgName] = useState('');
  const [addProgDesc, setAddProgDesc] = useState('');
  const [addYearFaculty, setAddYearFaculty] = useState('');
  const [addYearDept, setAddYearDept] = useState('');
  const [addYearProg, setAddYearProg] = useState('');
  const [addYearName, setAddYearName] = useState('');
  const [addYearDesc, setAddYearDesc] = useState('');
  const [addSemFaculty, setAddSemFaculty] = useState('');
  const [addSemDept, setAddSemDept] = useState('');
  const [addSemProg, setAddSemProg] = useState('');
  const [addSemYear, setAddSemYear] = useState('');
  const [addSemName, setAddSemName] = useState('');
  const [addSemDesc, setAddSemDesc] = useState('');
  const [addSubjFaculty, setAddSubjFaculty] = useState('');
  const [addSubjDept, setAddSubjDept] = useState('');
  const [addSubjProg, setAddSubjProg] = useState('');
  const [addSubjYear, setAddSubjYear] = useState('');
  const [addSubjSem, setAddSubjSem] = useState('');
  const [addSubjName, setAddSubjName] = useState('');
  const [addSubjCode, setAddSubjCode] = useState('');
  const [addSubjDesc, setAddSubjDesc] = useState('');

  // Delete filter fields
  const [delDeptFaculty, setDelDeptFaculty] = useState('');
  const [delProgFaculty, setDelProgFaculty] = useState('');
  const [delProgDept, setDelProgDept] = useState('');
  const [delYearFaculty, setDelYearFaculty] = useState('');
  const [delYearDept, setDelYearDept] = useState('');
  const [delYearProg, setDelYearProg] = useState('');
  const [delSemFaculty, setDelSemFaculty] = useState('');
  const [delSemDept, setDelSemDept] = useState('');
  const [delSemProg, setDelSemProg] = useState('');
  const [delSemYear, setDelSemYear] = useState('');
  const [delSubjFaculty, setDelSubjFaculty] = useState('');
  const [delSubjDept, setDelSubjDept] = useState('');
  const [delSubjProg, setDelSubjProg] = useState('');
  const [delSubjYear, setDelSubjYear] = useState('');
  const [delSubjSem, setDelSubjSem] = useState('');

  // PDF and Video state
  const [pdfFaculty, setPdfFaculty] = useState('');
  const [pdfDept, setPdfDept] = useState('');
  const [pdfProg, setPdfProg] = useState('');
  const [pdfYear, setPdfYear] = useState('');
  const [pdfSem, setPdfSem] = useState('');
  const [pdfSubj, setPdfSubj] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfSection, setPdfSection] = useState('courses');
  
  const [vidFaculty, setVidFaculty] = useState('');
  const [vidDept, setVidDept] = useState('');
  const [vidProg, setVidProg] = useState('');
  const [vidYear, setVidYear] = useState('');
  const [vidSem, setVidSem] = useState('');
  const [vidSubj, setVidSubj] = useState('');
  const [vidTitle, setVidTitle] = useState('');
  const [vidType, setVidType] = useState('normal');
  const [vidUrl, setVidUrl] = useState('');
  
  const [materials, setMaterials] = useState({ pdfs: [], videos: [] });

  useEffect(() => {
    const loadMaterials = () => {
      try {
        const mats = JSON.parse(localStorage.getItem('adminMaterials') || '{"pdfs":[],"videos":[]}');
        setMaterials(mats);
      } catch {}
    };
    loadMaterials();
    const h = () => loadMaterials();
    window.addEventListener('hierarchy-updated', h);
    return () => window.removeEventListener('hierarchy-updated', h);
  }, []);

  const getDepts = (fid) => (lists.department || []).filter(d => d.facultyId === fid);
  const getProgs = (did) => (lists.program || []).filter(p => p.departmentId === did);
  const getYears = (pid) => (lists.year || []).filter(y => y.programId === pid);
  const getSems = (yid) => (lists.semester || []).filter(s => s.yearId === yid);
  const getSubjs = (sid) => (lists.subject || []).filter(s => s.semesterId === sid);

  const closeModal = () => {
    setActiveModal(null);
    setAddFacultyName(''); setAddFacultyDesc('');
    setAddDeptFaculty(''); setAddDeptName(''); setAddDeptDesc('');
    setAddProgFaculty(''); setAddProgDept(''); setAddProgName(''); setAddProgDesc('');
    setAddYearFaculty(''); setAddYearDept(''); setAddYearProg(''); setAddYearName(''); setAddYearDesc('');
    setAddSemFaculty(''); setAddSemDept(''); setAddSemProg(''); setAddSemYear(''); setAddSemName(''); setAddSemDesc('');
    setAddSubjFaculty(''); setAddSubjDept(''); setAddSubjProg(''); setAddSubjYear(''); setAddSubjSem(''); setAddSubjName(''); setAddSubjCode(''); setAddSubjDesc('');
    setDelDeptFaculty(''); setDelProgFaculty(''); setDelProgDept('');
    setDelYearFaculty(''); setDelYearDept(''); setDelYearProg('');
    setDelSemFaculty(''); setDelSemDept(''); setDelSemProg(''); setDelSemYear('');
    setDelSubjFaculty(''); setDelSubjDept(''); setDelSubjProg(''); setDelSubjYear(''); setDelSubjSem('');
  };

  

  const doAdd = (key, item) => {
    console.log('[AdminPanel] doAdd called with key:', key, 'item:', JSON.stringify(item).substring(0, 100));
    console.log('[AdminPanel] current lists before add:', JSON.stringify(lists).substring(0, 200));
    addItem(key, item);
    console.log('[AdminPanel] after addItem, lists:', JSON.stringify(lists).substring(0, 200));
    toast.success('Added');
    closeModal();
  };

  const doDelete = (key, id, name) => {
    if (!confirm(`Delete "${name}" and all children?`)) return;
    deleteItem(key, id);
    toast.success('Deleted');
    closeModal();
  };

  const childCount = (key, pid) => {
    const idMap = { department: 'facultyId', program: 'departmentId', year: 'programId', semester: 'yearId', subject: 'semesterId' };
    const f = idMap[key];
    return f ? (lists[key] || []).filter(x => x[f] === pid).length : 0;
  };

  

  const doUploadPdf = () => {
    if (!pdfFaculty || !pdfDept || !pdfProg || !pdfYear || !pdfSem || !pdfSubj || !pdfTitle.trim()) {
      toast.error('Fill all required fields');
      return;
    }
    const mats = { ...materials, pdfs: [...(materials.pdfs || []), { id: Date.now(), title: pdfTitle.trim(), section: pdfSection, subjectId: pdfSubj, size: '1.2 MB', date: new Date().toISOString() }] };
    setMaterials(mats);
    localStorage.setItem('adminMaterials', JSON.stringify(mats));
    toast.success('PDF uploaded');
    setPdfTitle('');
    setActiveModal(null);
  };

  const doDeletePdf = (id) => {
    if (!confirm('Delete this PDF?')) return;
    const mats = { ...materials, pdfs: materials.pdfs.filter(p => p.id !== id) };
    setMaterials(mats);
    localStorage.setItem('adminMaterials', JSON.stringify(mats));
    toast.success('PDF deleted');
  };

  const doAddVideo = () => {
    if (!vidFaculty || !vidDept || !vidProg || !vidYear || !vidSem || !vidSubj || !vidTitle.trim()) {
      toast.error('Fill all required fields');
      return;
    }
    if (vidType === 'streaming' && !vidUrl.trim()) {
      toast.error('Enter streaming URL');
      return;
    }
    const mats = { ...materials, videos: [...(materials.videos || []), { id: Date.now(), title: vidTitle.trim(), type: vidType, url: vidUrl, subjectId: vidSubj, size: vidType === 'streaming' ? 'Streaming' : '15 MB', date: new Date().toISOString() }] };
    setMaterials(mats);
    localStorage.setItem('adminMaterials', JSON.stringify(mats));
    toast.success('Video added');
    setVidTitle(''); setVidUrl('');
    setActiveModal(null);
  };

  const doDeleteVideo = (id) => {
    if (!confirm('Delete this video?')) return;
    const mats = { ...materials, videos: materials.videos.filter(v => v.id !== id) };
    setMaterials(mats);
    localStorage.setItem('adminMaterials', JSON.stringify(mats));
    toast.success('Video deleted');
  };

  const getSubjects = (semId) => (lists.subject || []).filter(s => s.semesterId === semId);
  const getPdfsForSubj = (subjId) => (materials.pdfs || []).filter(p => p.subjectId === subjId);
  const getVideosForSubj = (subjId) => (materials.videos || []).filter(v => v.subjectId === subjId);

  if (!isOpen) return null;

  return (
    <>
      <div className="admin-fab" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-times"></i></div>
      <div className="admin-panel active" style={{ bottom: 170, width: 380, maxHeight: '75vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}><i className="fas fa-cog" style={{ marginRight: 8, color: 'var(--primary)' }}></i>Admin Controls</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: '1.2rem', padding: 4 }}>×</button>
        </div>

        <div className="admin-section">
          <div className="admin-section-title">Structure</div>
          <div className="admin-action" onClick={() => setActiveModal('addFaculty')}><i className="fas fa-plus-circle"></i><span>Add New Faculty</span></div>
          <div className="admin-action" onClick={() => { setDelDeptFaculty(''); setActiveModal('deleteFaculty'); }}><i className="fas fa-trash"></i><span>Delete Faculty</span></div>
          <div className="admin-action" onClick={() => { setAddDeptFaculty(''); setAddDeptName(''); setAddDeptDesc(''); setActiveModal('addDepartment'); }}><i className="fas fa-building"></i><span>Add Department</span></div>
          <div className="admin-action" onClick={() => { setDelDeptFaculty(''); setActiveModal('deleteDepartment'); }}><i className="fas fa-trash"></i><span>Delete Department</span></div>
        </div>

        <div className="admin-section">
          <div className="admin-section-title">Academic Programs</div>
          <div className="admin-action" onClick={() => setActiveModal('addProgram')}><i className="fas fa-graduation-cap"></i><span>Add Program</span></div>
          <div className="admin-action" onClick={() => setActiveModal('deleteProgram')}><i className="fas fa-trash"></i><span>Delete Program</span></div>
          <div className="admin-action" onClick={() => setActiveModal('addYear')}><i className="fas fa-calendar-plus"></i><span>Add Year</span></div>
          <div className="admin-action" onClick={() => setActiveModal('deleteYear')}><i className="fas fa-trash"></i><span>Delete Year</span></div>
        </div>

        <div className="admin-section">
          <div className="admin-section-title">Semesters</div>
          <div className="admin-action" onClick={() => setActiveModal('addSemester')}><i className="fas fa-calendar-plus"></i><span>Add Semester</span></div>
          <div className="admin-action" onClick={() => setActiveModal('deleteSemester')}><i className="fas fa-trash"></i><span>Delete Semester</span></div>
        </div>

        <div className="admin-section">
          <div className="admin-section-title">Subjects</div>
          <div className="admin-action" onClick={() => setActiveModal('addSubject')}><i className="fas fa-book-medical"></i><span>Add Subject</span></div>
          <div className="admin-action" onClick={() => setActiveModal('deleteSubject')}><i className="fas fa-trash"></i><span>Delete Subject</span></div>
        </div>

        <div className="admin-section">
          <div className="admin-section-title">PDF Materials</div>
          <div className="admin-action" onClick={() => setActiveModal('uploadPdf')}><i className="fas fa-file-upload"></i><span>Upload PDF</span></div>
          <div className="admin-action" onClick={() => setActiveModal('deletePdf')}><i className="fas fa-trash"></i><span>Delete PDF</span></div>
        </div>

        <div className="admin-section" style={{ borderBottom: 'none', marginBottom: 0 }}>
          <div className="admin-section-title">Video Materials</div>
          <div className="admin-action" onClick={() => setActiveModal('addVideo')}><i className="fas fa-video"></i><span>Upload Video</span></div>
          <div className="admin-action" onClick={() => setActiveModal('deleteVideo')}><i className="fas fa-trash"></i><span>Delete Video</span></div>
        </div>
      </div>

      {/* ADD FACULTY */}
      {activeModal === 'addFaculty' && (
        <Modal title="Add New Faculty" onClose={closeModal}>
          <div className="form-group"><label className="form-label">Faculty Name</label>
            <input type="text" className="form-input" placeholder="e.g., Faculté de Médecine" value={addFacultyName} onChange={e => setAddFacultyName(e.target.value)} autoFocus /></div>
          <div className="form-group"><label className="form-label">Description</label>
            <textarea className="form-input" rows="3" placeholder="Description" value={addFacultyDesc} onChange={e => setAddFacultyDesc(e.target.value)} /></div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => addFacultyName.trim() ? doAdd('faculty', { id: Date.now(), name: addFacultyName.trim(), description: addFacultyDesc, createdAt: new Date().toISOString() }) : toast.error('Name required')}>Add Faculty</button>
        </Modal>
      )}

      {/* DELETE FACULTY */}
      {activeModal === 'deleteFaculty' && (
        <Modal title="Delete Faculty" onClose={closeModal}>
          <div className="delete-item-list">
            {(lists.faculty || []).length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-4)' }}>No faculties</div>
              : (lists.faculty || []).map(f => <DeleteItem key={f.id} name={f.name} count={`${childCount('department', f.id)} departments`} onDelete={() => doDelete('faculty', f.id, f.name)} />)}
          </div>
          <CascadeWarning />
        </Modal>
      )}

      {/* ADD DEPARTMENT */}
      {activeModal === 'addDepartment' && (
        <Modal title="Add New Department" onClose={closeModal}>
          <div className="form-group"><label className="form-label">Select Faculty</label>
            <select className="form-input" value={addDeptFaculty} onChange={e => setAddDeptFaculty(e.target.value)}>
              <option value="">Select faculty...</option>
              {(lists.faculty || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Department Name</label>
            <input type="text" className="form-input" placeholder="e.g., Département de Chirurgie" value={addDeptName} onChange={e => setAddDeptName(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Description</label>
            <textarea className="form-input" rows="3" placeholder="Description" value={addDeptDesc} onChange={e => setAddDeptDesc(e.target.value)} /></div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => addDeptFaculty && addDeptName.trim() ? doAdd('department', { id: Date.now(), name: addDeptName.trim(), facultyId: addDeptFaculty, description: addDeptDesc }) : toast.error('Select faculty and enter name')}>Add Department</button>
        </Modal>
      )}

      {/* DELETE DEPARTMENT */}
      {activeModal === 'deleteDepartment' && (
        <Modal title="Delete Department" onClose={closeModal}>
          <div className="form-group"><label className="form-label">Select Faculty</label>
            <select className="form-input" value={delDeptFaculty} onChange={e => setDelDeptFaculty(e.target.value)}>
              <option value="">Select faculty...</option>
              {(lists.faculty || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>
          <div className="delete-item-list">
            {!delDeptFaculty ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-4)' }}>Select a faculty above</div>
              : getDepts(delDeptFaculty).length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-4)' }}>No departments</div>
              : getDepts(delDeptFaculty).map(d => <DeleteItem key={d.id} name={d.name} count={`${childCount('program', d.id)} programs`} onDelete={() => doDelete('department', d.id, d.name)} />)}
          </div>
          <CascadeWarning />
        </Modal>
      )}

      {/* ADD PROGRAM */}
      {activeModal === 'addProgram' && (
        <Modal title="Add Program" onClose={closeModal}>
          <div className="form-group"><label className="form-label">Select Faculty</label>
            <select className="form-input" value={addProgFaculty} onChange={e => { setAddProgFaculty(e.target.value); setAddProgDept(''); }}>
              <option value="">Select faculty...</option>
              {(lists.faculty || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Department</label>
            <select className="form-input" value={addProgDept} onChange={e => setAddProgDept(e.target.value)}>
              <option value="">Select department...</option>
              {getDepts(addProgFaculty).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Program Name</label>
            <input type="text" className="form-input" placeholder="e.g., Licence, Master, Doctorat" value={addProgName} onChange={e => setAddProgName(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Description</label>
            <textarea className="form-input" rows="3" placeholder="Description" value={addProgDesc} onChange={e => setAddProgDesc(e.target.value)} /></div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => addProgFaculty && addProgDept && addProgName.trim() ? doAdd('program', { id: Date.now(), name: addProgName.trim(), departmentId: addProgDept, description: addProgDesc }) : toast.error('All fields required')}>Add Program</button>
        </Modal>
      )}

      {/* DELETE PROGRAM */}
      {activeModal === 'deleteProgram' && (
        <Modal title="Delete Program" onClose={closeModal}>
          <div className="form-group"><label className="form-label">Select Faculty</label>
            <select className="form-input" value={delProgFaculty} onChange={e => { setDelProgFaculty(e.target.value); setDelProgDept(''); }}>
              <option value="">Select faculty...</option>
              {(lists.faculty || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Department</label>
            <select className="form-input" value={delProgDept} onChange={e => setDelProgDept(e.target.value)}>
              <option value="">Select department...</option>
              {getDepts(delProgFaculty).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
          <div className="delete-item-list">
            {!delProgDept ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-4)' }}>Select above</div>
              : getProgs(delProgDept).length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-4)' }}>No programs</div>
              : getProgs(delProgDept).map(p => <DeleteItem key={p.id} name={p.name} count={`${childCount('year', p.id)} years`} onDelete={() => doDelete('program', p.id, p.name)} />)}
          </div>
          <CascadeWarning />
        </Modal>
      )}

      {/* ADD YEAR */}
      {activeModal === 'addYear' && (
        <Modal title="Add Academic Year" onClose={closeModal}>
          <div className="form-group"><label className="form-label">Select Faculty</label>
            <select className="form-input" value={addYearFaculty} onChange={e => { setAddYearFaculty(e.target.value); setAddYearDept(''); setAddYearProg(''); }}>
              <option value="">Select faculty...</option>
              {(lists.faculty || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Department</label>
            <select className="form-input" value={addYearDept} onChange={e => { setAddYearDept(e.target.value); setAddYearProg(''); }}>
              <option value="">Select department...</option>
              {getDepts(addYearFaculty).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Program</label>
            <select className="form-input" value={addYearProg} onChange={e => setAddYearProg(e.target.value)}>
              <option value="">Select program...</option>
              {getProgs(addYearDept).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Year Name</label>
            <input type="text" className="form-input" placeholder="e.g., Year 1" value={addYearName} onChange={e => setAddYearName(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Description</label>
            <textarea className="form-input" rows="3" placeholder="Description" value={addYearDesc} onChange={e => setAddYearDesc(e.target.value)} /></div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => addYearFaculty && addYearDept && addYearProg && addYearName.trim() ? doAdd('year', { id: Date.now(), name: addYearName.trim(), programId: addYearProg, description: addYearDesc }) : toast.error('All fields required')}>Add Year</button>
        </Modal>
      )}

      {/* DELETE YEAR */}
      {activeModal === 'deleteYear' && (
        <Modal title="Delete Academic Year" onClose={closeModal}>
          <div className="form-group"><label className="form-label">Select Faculty</label>
            <select className="form-input" value={delYearFaculty} onChange={e => { setDelYearFaculty(e.target.value); setDelYearDept(''); setDelYearProg(''); }}>
              <option value="">Select faculty...</option>
              {(lists.faculty || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Department</label>
            <select className="form-input" value={delYearDept} onChange={e => { setDelYearDept(e.target.value); setDelYearProg(''); }}>
              <option value="">Select department...</option>
              {getDepts(delYearFaculty).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Program</label>
            <select className="form-input" value={delYearProg} onChange={e => setDelYearProg(e.target.value)}>
              <option value="">Select program...</option>
              {getProgs(delYearDept).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div className="delete-item-list">
            {!delYearProg ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-4)' }}>Select above</div>
              : getYears(delYearProg).length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-4)' }}>No years</div>
              : getYears(delYearProg).map(y => <DeleteItem key={y.id} name={y.name} count={`${childCount('semester', y.id)} semesters`} onDelete={() => doDelete('year', y.id, y.name)} />)}
          </div>
          <CascadeWarning />
        </Modal>
      )}

      {/* ADD SEMESTER */}
      {activeModal === 'addSemester' && (
        <Modal title="Add Semester" onClose={closeModal}>
          <div className="form-group"><label className="form-label">Select Faculty</label>
            <select className="form-input" value={addSemFaculty} onChange={e => { setAddSemFaculty(e.target.value); setAddSemDept(''); setAddSemProg(''); setAddSemYear(''); }}>
              <option value="">Select faculty...</option>
              {(lists.faculty || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Department</label>
            <select className="form-input" value={addSemDept} onChange={e => { setAddSemDept(e.target.value); setAddSemProg(''); setAddSemYear(''); }}>
              <option value="">Select department...</option>
              {getDepts(addSemFaculty).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Program</label>
            <select className="form-input" value={addSemProg} onChange={e => { setAddSemProg(e.target.value); setAddSemYear(''); }}>
              <option value="">Select program...</option>
              {getProgs(addSemDept).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Year</label>
            <select className="form-input" value={addSemYear} onChange={e => setAddSemYear(e.target.value)}>
              <option value="">Select year...</option>
              {getYears(addSemProg).map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Semester Name</label>
            <input type="text" className="form-input" placeholder="e.g., Semestre 1" value={addSemName} onChange={e => setAddSemName(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Description</label>
            <textarea className="form-input" rows="3" placeholder="Description" value={addSemDesc} onChange={e => setAddSemDesc(e.target.value)} /></div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => addSemFaculty && addSemDept && addSemProg && addSemYear && addSemName.trim() ? doAdd('semester', { id: Date.now(), name: addSemName.trim(), yearId: addSemYear, description: addSemDesc }) : toast.error('All fields required')}>Add Semester</button>
        </Modal>
      )}

      {/* DELETE SEMESTER */}
      {activeModal === 'deleteSemester' && (
        <Modal title="Delete Semester" onClose={closeModal}>
          <div className="form-group"><label className="form-label">Select Faculty</label>
            <select className="form-input" value={delSemFaculty} onChange={e => { setDelSemFaculty(e.target.value); setDelSemDept(''); setDelSemProg(''); setDelSemYear(''); }}>
              <option value="">Select faculty...</option>
              {(lists.faculty || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Department</label>
            <select className="form-input" value={delSemDept} onChange={e => { setDelSemDept(e.target.value); setDelSemProg(''); setDelSemYear(''); }}>
              <option value="">Select department...</option>
              {getDepts(delSemFaculty).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Program</label>
            <select className="form-input" value={delSemProg} onChange={e => { setDelSemProg(e.target.value); setDelSemYear(''); }}>
              <option value="">Select program...</option>
              {getProgs(delSemDept).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Year</label>
            <select className="form-input" value={delSemYear} onChange={e => setDelSemYear(e.target.value)}>
              <option value="">Select year...</option>
              {getYears(delSemProg).map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select></div>
          <div className="delete-item-list">
            {!delSemYear ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-4)' }}>Select above</div>
              : getSems(delSemYear).length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-4)' }}>No semesters</div>
              : getSems(delSemYear).map(s => <DeleteItem key={s.id} name={s.name} count={`${childCount('subject', s.id)} subjects`} onDelete={() => doDelete('semester', s.id, s.name)} />)}
          </div>
          <CascadeWarning />
        </Modal>
      )}

      {/* ADD SUBJECT */}
      {activeModal === 'addSubject' && (
        <Modal title="Add Subject" onClose={closeModal}>
          <div className="form-group"><label className="form-label">Select Faculty</label>
            <select className="form-input" value={addSubjFaculty} onChange={e => { setAddSubjFaculty(e.target.value); setAddSubjDept(''); setAddSubjProg(''); setAddSubjYear(''); setAddSubjSem(''); }}>
              <option value="">Select faculty...</option>
              {(lists.faculty || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Department</label>
            <select className="form-input" value={addSubjDept} onChange={e => { setAddSubjDept(e.target.value); setAddSubjProg(''); setAddSubjYear(''); setAddSubjSem(''); }}>
              <option value="">Select department...</option>
              {getDepts(addSubjFaculty).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Program</label>
            <select className="form-input" value={addSubjProg} onChange={e => { setAddSubjProg(e.target.value); setAddSubjYear(''); setAddSubjSem(''); }}>
              <option value="">Select program...</option>
              {getProgs(addSubjDept).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Year</label>
            <select className="form-input" value={addSubjYear} onChange={e => { setAddSubjYear(e.target.value); setAddSubjSem(''); }}>
              <option value="">Select year...</option>
              {getYears(addSubjProg).map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Semester</label>
            <select className="form-input" value={addSubjSem} onChange={e => setAddSubjSem(e.target.value)}>
              <option value="">Select semester...</option>
              {getSems(addSubjYear).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Subject Name</label>
            <input type="text" className="form-input" placeholder="e.g., Algorithmique" value={addSubjName} onChange={e => setAddSubjName(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Subject Code</label>
            <input type="text" className="form-input" placeholder="e.g., INF201" value={addSubjCode} onChange={e => setAddSubjCode(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Description</label>
            <textarea className="form-input" rows="3" placeholder="Description" value={addSubjDesc} onChange={e => setAddSubjDesc(e.target.value)} /></div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => addSubjFaculty && addSubjDept && addSubjProg && addSubjYear && addSubjSem && addSubjName.trim() ? doAdd('subject', { id: Date.now(), name: addSubjName.trim(), semesterId: addSubjSem, code: addSubjCode, description: addSubjDesc }) : toast.error('All fields required')}>Add Subject</button>
        </Modal>
      )}

      {/* DELETE SUBJECT */}
      {activeModal === 'deleteSubject' && (
        <Modal title="Delete Subject" onClose={closeModal}>
          <div className="form-group"><label className="form-label">Select Faculty</label>
            <select className="form-input" value={delSubjFaculty} onChange={e => { setDelSubjFaculty(e.target.value); setDelSubjDept(''); setDelSubjProg(''); setDelSubjYear(''); setDelSubjSem(''); }}>
              <option value="">Select faculty...</option>
              {(lists.faculty || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Department</label>
            <select className="form-input" value={delSubjDept} onChange={e => { setDelSubjDept(e.target.value); setDelSubjProg(''); setDelSubjYear(''); setDelSubjSem(''); }}>
              <option value="">Select department...</option>
              {getDepts(delSubjFaculty).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Program</label>
            <select className="form-input" value={delSubjProg} onChange={e => { setDelSubjProg(e.target.value); setDelSubjYear(''); setDelSubjSem(''); }}>
              <option value="">Select program...</option>
              {getProgs(delSubjDept).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Year</label>
            <select className="form-input" value={delSubjYear} onChange={e => { setDelSubjYear(e.target.value); setDelSubjSem(''); }}>
              <option value="">Select year...</option>
              {getYears(delSubjProg).map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Semester</label>
            <select className="form-input" value={delSubjSem} onChange={e => setDelSubjSem(e.target.value)}>
              <option value="">Select semester...</option>
              {getSems(delSubjYear).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
          <div className="delete-item-list">
            {!delSubjSem ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-4)' }}>Select above</div>
              : getSubjs(delSubjSem).length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-4)' }}>No subjects</div>
              : getSubjs(delSubjSem).map(s => <DeleteItem key={s.id} name={`${s.name} ${s.code ? `(${s.code})` : ''}`} count="subject" onDelete={() => doDelete('subject', s.id, s.name)} />)}
          </div>
          <CascadeWarning />
        </Modal>
      )}

      {/* UPLOAD PDF */}
      {activeModal === 'uploadPdf' && (
        <Modal title="Upload PDF Material" onClose={closeModal}>
          <div className="form-group"><label className="form-label">Select Faculty</label>
            <select className="form-input" value={pdfFaculty} onChange={e => { setPdfFaculty(e.target.value); setPdfDept(''); setPdfProg(''); setPdfYear(''); setPdfSem(''); setPdfSubj(''); }}>
              <option value="">Select faculty...</option>
              {(lists.faculty || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Department</label>
            <select className="form-input" value={pdfDept} onChange={e => { setPdfDept(e.target.value); setPdfProg(''); setPdfYear(''); setPdfSem(''); setPdfSubj(''); }}>
              <option value="">Select department...</option>
              {getDepts(pdfFaculty).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Program</label>
            <select className="form-input" value={pdfProg} onChange={e => { setPdfProg(e.target.value); setPdfYear(''); setPdfSem(''); setPdfSubj(''); }}>
              <option value="">Select program...</option>
              {getProgs(pdfDept).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Year</label>
            <select className="form-input" value={pdfYear} onChange={e => { setPdfYear(e.target.value); setPdfSem(''); setPdfSubj(''); }}>
              <option value="">Select year...</option>
              {getYears(pdfProg).map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Semester</label>
            <select className="form-input" value={pdfSem} onChange={e => { setPdfSem(e.target.value); setPdfSubj(''); }}>
              <option value="">Select semester...</option>
              {getSems(pdfYear).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Subject</label>
            <select className="form-input" value={pdfSubj} onChange={e => setPdfSubj(e.target.value)}>
              <option value="">Select subject...</option>
              {getSubjects(pdfSem).map(s => <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">PDF Title</label>
            <input type="text" className="form-input" placeholder="e.g., Chapter 1 Notes" value={pdfTitle} onChange={e => setPdfTitle(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Section</label>
            <select className="form-input" value={pdfSection} onChange={e => setPdfSection(e.target.value)}>
              <option value="courses">Course Materials</option>
              <option value="exams">Exams</option>
              <option value="exercises">Exercises</option>
            </select></div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={doUploadPdf}><i className="fas fa-upload" style={{ marginRight: 8 }}></i>Upload PDF</button>
        </Modal>
      )}

      {/* DELETE PDF */}
      {activeModal === 'deletePdf' && (
        <Modal title="Delete PDF" onClose={closeModal}>
          <div className="delete-item-list">
            {(materials.pdfs || []).length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-4)' }}>No PDFs uploaded</div>
              : materials.pdfs.map(p => <DeleteItem key={p.id} name={p.title} count={`${p.section} • ${p.size}`} onDelete={() => doDeletePdf(p.id)} />)}
          </div>
        </Modal>
      )}

      {/* ADD VIDEO */}
      {activeModal === 'addVideo' && (
        <Modal title="Add Video Material" onClose={closeModal}>
          <div className="form-group"><label className="form-label">Select Faculty</label>
            <select className="form-input" value={vidFaculty} onChange={e => { setVidFaculty(e.target.value); setVidDept(''); setVidProg(''); setVidYear(''); setVidSem(''); setVidSubj(''); }}>
              <option value="">Select faculty...</option>
              {(lists.faculty || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Department</label>
            <select className="form-input" value={vidDept} onChange={e => { setVidDept(e.target.value); setVidProg(''); setVidYear(''); setVidSem(''); setVidSubj(''); }}>
              <option value="">Select department...</option>
              {getDepts(vidFaculty).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Program</label>
            <select className="form-input" value={vidProg} onChange={e => { setVidProg(e.target.value); setVidYear(''); setVidSem(''); setVidSubj(''); }}>
              <option value="">Select program...</option>
              {getProgs(vidDept).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Year</label>
            <select className="form-input" value={vidYear} onChange={e => { setVidYear(e.target.value); setVidSem(''); setVidSubj(''); }}>
              <option value="">Select year...</option>
              {getYears(vidProg).map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Semester</label>
            <select className="form-input" value={vidSem} onChange={e => { setVidSem(e.target.value); setVidSubj(''); }}>
              <option value="">Select semester...</option>
              {getSems(vidYear).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Select Subject</label>
            <select className="form-input" value={vidSubj} onChange={e => setVidSubj(e.target.value)}>
              <option value="">Select subject...</option>
              {getSubjects(vidSem).map(s => <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Video Title</label>
            <input type="text" className="form-input" placeholder="e.g., Lecture 1" value={vidTitle} onChange={e => setVidTitle(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Video Type</label>
            <select className="form-input" value={vidType} onChange={e => setVidType(e.target.value)}>
              <option value="normal">Normal Video</option>
              <option value="streaming">Live Streaming</option>
            </select></div>
          {vidType === 'streaming' && (
            <div className="form-group"><label className="form-label">Streaming URL</label>
              <input type="text" className="form-input" placeholder="e.g., https://..." value={vidUrl} onChange={e => setVidUrl(e.target.value)} /></div>
          )}
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={doAddVideo}><i className="fas fa-video" style={{ marginRight: 8 }}></i>Add Video</button>
        </Modal>
      )}

      {/* DELETE VIDEO */}
      {activeModal === 'deleteVideo' && (
        <Modal title="Delete Video" onClose={closeModal}>
          <div className="delete-item-list">
            {(materials.videos || []).length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-4)' }}>No videos added</div>
              : materials.videos.map(v => <DeleteItem key={v.id} name={v.title} count={`${v.type} • ${v.size}`} onDelete={() => doDeleteVideo(v.id)} />)}
          </div>
        </Modal>
      )}
    </>
  );
}