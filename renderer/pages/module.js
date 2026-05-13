import Layout from '../components/Layout';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import {
  getModule, listCoursesByModule, listAttachments,
  getActiveLivestreamForModule, toggleFavorite, listFavorites, endLivestream,
  createCourse, deleteCourse, updateCourse, createAttachment, deleteAttachment, updateModule,
} from '../lib/db';
import { publicUrl, uploadFile } from '../lib/storage';
import { toast } from '../lib/toast';
import { chatWithCourse, generateCourseDraft } from '../lib/aiClient';

function ytEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function firstYoutubeLink(text) {
  return text?.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}[^\s]*/)?.[0] || null;
}

function canPreviewFile(fileName = '', path = '') {
  const value = `${fileName} ${path}`.toLowerCase();
  return /\.(png|jpe?g|gif|webp|pdf)$/i.test(value);
}

function AttachmentPreview({ attachment }) {
  const url = publicUrl('course-files', attachment.file_path);
  const name = attachment.file_name || '';
  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(name || url);
  const isPdf = /\.pdf$/i.test(name || url);
  if (!canPreviewFile(name, url)) return null;
  return (
    <div className="embed-box">
      {isImage ? (
        <img src={url} alt={name} />
      ) : isPdf ? (
        <iframe src={url} title={name} />
      ) : null}
    </div>
  );
}

export default function Module() {
  const router = useRouter();
  const { user } = useAuth();
  const id = router.query.id;
  const [mod, setMod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [attach, setAttach] = useState([]);
  const [live, setLive] = useState(null);
  const [favs, setFavs] = useState(new Set());
  const [openCourse, setOpenCourse] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null); // course object
  const [editingModule, setEditingModule] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', content: '' });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const [chatText, setChatText] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const playerRef = useRef(null);

  const isOwner = user && mod && user.id === mod.owner_id;
  const isAdmin = user?.role === 'admin';
  const canManage = !!user && (isAdmin || isOwner);
  const canStartLive = canManage;

  const refresh = async () => {
    if (!id) return;
    try {
      const [m, c, l] = await Promise.all([
        getModule(id),
        listCoursesByModule(id),
        getActiveLivestreamForModule(id),
      ]);
      if (m.data) {
        setMod(m.data);
        setModuleName(m.data.name || '');
      }
      setCourses(c.data || []);
      setLive(l.data);
      if (c.data?.[0] && !openCourse) setOpenCourse(c.data[0]);
      if (user) {
        const { data: f } = await listFavorites(user.id);
        setFavs(new Set((f || []).map(x => x.id)));
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [id, user?.id]);

  useEffect(() => {
    if (!openCourse) { setAttach([]); return; }
    listAttachments({ courseId: openCourse.id }).then(({ data }) => setAttach(data || []));
    setChatMessages([]);
    setChatText('');
  }, [openCourse?.id]);

  const star = async (cid) => {
    if (!user) return;
    await toggleFavorite(user.id, cid);
    setFavs(prev => {
      const s = new Set(prev);
      if (s.has(cid)) s.delete(cid); else s.add(cid);
      return s;
    });
    toast.success(favs.has(cid) ? 'Removed from favorites' : 'Added to favorites');
  };

  const onAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.title || !id) return;
    setBusy(true);
    try {
      const { data, error } = await createCourse({
        module_id: Number(id),
        title: newCourse.title.trim(),
        content: newCourse.content.trim(),
        yt_url: firstYoutubeLink(newCourse.content),
      });
      if (error) throw error;
      setOpenCourse(data);
      setShowAdd(false);
      setNewCourse({ title: '', content: '' });
      toast.success('Course added');
      await refresh();
    } catch (err) { 
      console.error('Add course failed:', err);
      toast.error(err.message || 'Failed to add course'); 
    } finally {
      setBusy(false);
    }
  };

  const onGenerateCourse = async () => {
    if (!aiPrompt.trim()) return;
    setAiBusy(true);
    setAiError('');
    try {
      const course = await generateCourseDraft({
        moduleName: mod?.name,
        request: aiPrompt.trim(),
      });
      setNewCourse({
        title: course.title || '',
        content: course.content || '',
      });
      toast.success('Course draft generated');
    } catch (err) {
      setAiError(err.message);
      toast.error('AI request failed');
    }
    setAiBusy(false);
  };

  const onUpdateModule = async (e) => {
    e.preventDefault();
    if (!moduleName.trim()) return;
    setBusy(true);
    try {
      const { error } = await updateModule(id, { name: moduleName.trim() });
      if (error) throw error;
      setMod(prev => ({ ...prev, name: moduleName.trim() }));
      setEditingModule(false);
      toast.success('Module renamed');
      await refresh();
    } catch (err) { toast.error(err.message); }
    setBusy(false);
  };

  const onUpdateCourse = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await updateCourse(editing.id, {
        title: editing.title.trim(),
        content: editing.content?.trim() || '',
        yt_url: firstYoutubeLink(editing.content) || editing.yt_url?.trim() || null,
      });
      if (error) throw error;
      setOpenCourse(prev => prev?.id === editing.id ? {
        ...prev,
        title: editing.title.trim(),
        content: editing.content?.trim() || '',
        yt_url: firstYoutubeLink(editing.content) || editing.yt_url?.trim() || null,
      } : prev);
      setEditing(null);
      toast.success('Course updated');
      await refresh();
    } catch (err) { toast.error(err.message); }
    setBusy(false);
  };

  const onDeleteCourse = async (cid) => {
    if (!confirm('Are you sure you want to delete this course and all its attachments?')) return;
    setBusy(true);
    try {
      const { error } = await deleteCourse(cid);
      if (error) throw error;
      if (openCourse?.id === cid) setOpenCourse(courses.find(x => x.id !== cid) || null);
      toast.success('Course deleted');
      await refresh();
    } catch (err) { toast.error(err.message); }
    setBusy(false);
  };

  const onFileUpload = async (e, courseId) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const up = await uploadFile('course-files', f);
      const { error } = await createAttachment({ course_id: courseId, file_path: up.path, file_name: up.name });
      if (error) throw error;
      toast.success('File uploaded');
      if (openCourse?.id === courseId) {
        const { data } = await listAttachments({ courseId });
        setAttach(data || []);
      }
    } catch (err) { toast.error(err.message); }
    setBusy(false);
    e.target.value = '';
  };

  const onRemoveAttach = async (aid) => {
    if (!confirm('Remove this attachment?')) return;
    const { error } = await deleteAttachment(aid);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAttach(prev => prev.filter(x => x.id !== aid));
    toast.success('Attachment removed');
  };

  const askCourse = async (mode = 'chat') => {
    if (!openCourse) return;
    if (mode === 'chat' && !chatText.trim()) return;
    const question = chatText.trim();
    setChatBusy(true);
    setChatError('');
    if (mode === 'chat') {
      setChatMessages(prev => [...prev, { role: 'student', text: question }]);
      setChatText('');
    }
    try {
      const answer = await chatWithCourse({
        mode,
        question,
        course: {
          title: openCourse.title,
          content: openCourse.content || '',
          yt_url: openCourse.yt_url || firstYoutubeLink(openCourse.content) || '',
        },
      });

      setChatMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    } catch (err) {
      setChatError(err.message);
      toast.error('AI request failed');
    }
    setChatBusy(false);
  };

  const startLive = async () => {
    router.push(`/live?module=${id}`);
  };

  const stopLive = async () => {
    if (!live) return;
    setBusy(true);
    await endLivestream(live.id).catch(() => {});
    await fetch('/api/end-live', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module_id: Number(id) }),
    }).catch(() => {});
    toast.success('Live session ended');
    setBusy(false);
    refresh();
  };

  const openAndScroll = (c) => {
    setOpenCourse(c);
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  if (loading) {
    return (
      <Layout>
        <div className="page-header"><div className="skel" style={{ width: 120, height: 14 }} /></div>
        <div className="grid auto">
          {[0, 1, 2].map(i => <div key={i} className="skel-card"><div className="skel" style={{ width: 80, height: 14 }} /><div className="skel" style={{ width: 160, height: 18 }} /></div>)}
        </div>
      </Layout>
    );
  }
  if (!mod) return <Layout><div className="empty">Module not found.</div></Layout>;

  const embed = ytEmbed(openCourse?.yt_url || firstYoutubeLink(openCourse?.content));

  return (
    <Layout>
      <div className="page-header">
        <div className="crumb"><Link href="/browse">Browse</Link> / {mod.semester_label}</div>
        <div className="row between">
          <h1>{mod.name}</h1>
          <div className="row">
            {live && <span className="pill live">Live</span>}
            {live && !canManage && (
              <Link href={`/live?module=${id}`} className="btn live">Join live</Link>
            )}
            {live && canManage && (
              <>
                <Link href={`/live?module=${id}`} className="btn live">Open</Link>
                <button className="btn ghost sm" onClick={stopLive} disabled={busy}>End</button>
              </>
            )}
            {!live && canStartLive && (
              <button className="btn live" onClick={startLive} disabled={busy}>
                {busy ? 'Starting…' : 'Go live'}
              </button>
            )}
          </div>
        </div>
        <p className="sub">{mod.owner_name || 'Unassigned'} · {courses.length} {courses.length === 1 ? 'course' : 'courses'}</p>
        {canManage && (
          <div style={{ marginTop: 12 }}>
            {editingModule ? (
              <form className="row" onSubmit={onUpdateModule} style={{ gap: 8, flexWrap: 'wrap' }}>
                <input className="input" value={moduleName} onChange={e => setModuleName(e.target.value)} style={{ maxWidth: 320 }} />
                <button className="btn sm" disabled={busy}>Save</button>
                <button type="button" className="btn ghost sm" onClick={() => { setEditingModule(false); setModuleName(mod.name); }}>Cancel</button>
              </form>
            ) : (
              <button className="btn ghost sm" onClick={() => setEditingModule(true)}>Rename module</button>
            )}
          </div>
        )}
      </div>

      <div className={openCourse ? 'theater-mode' : ''}>
        <div className={openCourse ? 'main-theater' : ''}>
          {!openCourse && (
            <div className="row between" style={{ marginBottom: 12 }}>
              <h2>Courses</h2>
              {canManage && !showAdd && (
                <button className="btn sm" onClick={() => setShowAdd(true)}>Add course</button>
              )}
            </div>
          )}

          {showAdd && (
            <form className="card glass" onSubmit={onAddCourse} style={{ marginBottom: 20, border: '1px solid var(--ink)' }}>
              <div className="row between" style={{ marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>New Course</h3>
                <button type="button" className="btn ghost sm" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
              <div className="field">
                <label>Title</label>
                <input className="input" required value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} autoFocus />
              </div>
              <div className="field">
                <label>Content</label>
                <textarea
                  className="textarea"
                  placeholder="Type lesson notes, instructions, links, or paste a YouTube link..."
                  value={newCourse.content}
                  onChange={e => setNewCourse({ ...newCourse, content: e.target.value })}
                />
              </div>
              <div className="field">
                <label>AI course generator</label>
                <textarea
                  className="textarea"
                  placeholder="Example: Create a beginner lesson about matrix multiplication with examples and exercises."
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                />
                <button type="button" className="btn ghost sm" onClick={onGenerateCourse} disabled={aiBusy || !aiPrompt.trim()}>
                  {aiBusy ? 'Generating...' : 'Generate draft'}
                </button>
                {aiError && (
                  <div className="form-error">
                    {aiError}
                  </div>
                )}
              </div>
              <button className="btn" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
                {busy ? 'Adding...' : 'Create Course'}
              </button>
            </form>
          )}

          {!openCourse && courses.length === 0 && (
            <div className="empty">No courses uploaded yet.</div>
          )}
          
          {!openCourse && courses.map(c => (
            <div key={c.id}>
              {editing?.id === c.id ? (
                <form className="card" onSubmit={onUpdateCourse} style={{ marginBottom: 12, padding: 12 }}>
                  <div className="field">
                    <input className="input sm" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
                  </div>
                  <div className="field">
                    <textarea
                      className="textarea"
                      placeholder="Course content..."
                      value={editing.content || ''}
                      onChange={e => setEditing({ ...editing, content: e.target.value })}
                    />
                  </div>
                  <div className="row">
                    <button className="btn sm" type="submit">Save</button>
                    <button className="btn ghost sm" type="button" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div
                  className="course-row"
                  style={openCourse?.id === c.id ? { borderColor: 'var(--ink)', boxShadow: '0 0 0 3px rgba(10,10,10,0.04)' } : null}
                >
                  <div className="left" style={{ cursor: 'pointer' }} onClick={() => openAndScroll(c)}>
                    <div className="ic">{(c.yt_url || firstYoutubeLink(c.content)) ? '▶' : '📄'}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                        {c.attachment_count || 0} {c.attachment_count === 1 ? 'file' : 'files'}
                      </div>
                    </div>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    {user && (
                      <button className={`fav ${favs.has(c.id) ? 'on' : ''}`} onClick={() => star(c.id)} aria-label="Favorite">
                        {favs.has(c.id) ? '★' : '☆'}
                      </button>
                    )}
                    {canManage && (
                      <>
                        <button className="btn ghost sm" onClick={() => setEditing(c)}>Edit</button>
                        <button className="btn ghost sm" onClick={() => onDeleteCourse(c.id)} style={{ color: 'var(--danger)' }}>Delete</button>
                      </>
                    )}
                    <button className="btn ghost sm" onClick={() => openAndScroll(c)}>Open</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {openCourse && (
            <div className="active-view" style={{ animation: 'fade-up 0.4s var(--ease)' }}>
              <div ref={playerRef} className="video-hero">
                {embed ? (
                  <iframe
                    src={embed}
                    style={{ width: '100%', aspectRatio: '16/9', border: 0, display: 'block' }}
                    allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div style={{
                    aspectRatio: '16 / 9', background: 'radial-gradient(circle at center, #1a1a1a, #0a0a0a)',
                    display: 'grid', placeItems: 'center',
                    color: '#525252', fontSize: 13,
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>📄</div>
                      <div>No video — read content below</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="course-body-wrap" style={{ marginTop: 24 }}>
                <div className="row between" style={{ marginBottom: 16 }}>
                  <h2 style={{ fontSize: 24 }}>{openCourse.title}</h2>
                  <div className="row">
                    {canManage && (
                      <button className="btn ghost sm" onClick={() => setEditing(openCourse)}>Edit Lesson</button>
                    )}
                    <button className={`fav ${favs.has(openCourse.id) ? 'on' : ''}`} onClick={() => star(openCourse.id)}>
                      {favs.has(openCourse.id) ? '★' : '☆'}
                    </button>
                  </div>
                </div>
                
                {openCourse.content && (
                  <div className="course-content card" style={{ border: 'none', background: 'var(--surface)', fontSize: 15 }}>
                    {openCourse.content}
                  </div>
                )}

                {attach.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <h3 style={{ marginBottom: 12 }}>Attachments</h3>
                    <div className="inline-files">
                      {attach.map(a => <AttachmentPreview key={a.id} attachment={a} />)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {openCourse ? (
          <div className="lesson-sidebar">
            <div className="card glass" style={{ padding: 14 }}>
              <h3 style={{ marginBottom: 12, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)' }}>
                Lessons ({courses.length})
              </h3>
              <div className="lesson-list">
                {courses.map((c, i) => (
                  <div
                    key={c.id}
                    className={`lesson-item ${openCourse.id === c.id ? 'active' : ''}`}
                    onClick={() => openAndScroll(c)}
                  >
                    <div className="num">{(i + 1).toString().padStart(2, '0')}</div>
                    <div className="title">{c.title}</div>
                    <div className="ic" style={{ fontSize: 10 }}>{c.yt_url || firstYoutubeLink(c.content) ? '▶' : '📄'}</div>
                  </div>
                ))}
              </div>
              {canManage && (
                <button className="btn ghost sm" style={{ width: '100%', marginTop: 12 }} onClick={() => setShowAdd(true)}>
                  + Add Lesson
                </button>
              )}
            </div>

            <div className="card glass course-ai" style={{ flex: 1, minHeight: 400 }}>
              <div className="row between" style={{ padding: '14px 16px' }}>
                <h3 style={{ margin: 0, fontSize: 14 }}>Course Assistant</h3>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn ghost xs" onClick={() => setChatMessages([])} title="Clear chat">↺</button>
                  <button className="btn ghost xs" onClick={() => askCourse('summary')} disabled={chatBusy}>
                    Summarize
                  </button>
                </div>
              </div>
              <div className="course-ai-body">
                {chatMessages.length === 0 ? (
                  <div className="empty" style={{ background: 'transparent', border: '1px dashed var(--line)', padding: 24 }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
                    <div style={{ fontSize: 12 }}>{chatError || 'Ask anything about this lesson!'}</div>
                  </div>
                ) : chatMessages.map((m, i) => (
                  <div key={i} className={`ai-msg ${m.role}`}>
                    <div className="role-label">{m.role === 'assistant' ? 'AI' : 'You'}</div>
                    {m.text}
                  </div>
                ))}
                {chatBusy && (
                  <div className="ai-msg assistant">
                    <div className="role-label">AI</div>
                    <div className="row" style={{ gap: 4 }}>
                      <div className="dot" style={{ width: 4, height: 4, background: 'var(--ink-4)', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                      <div className="dot" style={{ width: 4, height: 4, background: 'var(--ink-4)', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }} />
                      <div className="dot" style={{ width: 4, height: 4, background: 'var(--ink-4)', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }} />
                    </div>
                  </div>
                )}
                {chatError && chatMessages.length > 0 && <div className="form-error">{chatError}</div>}
              </div>
              <form className="chat-input glass" onSubmit={(e) => { e.preventDefault(); askCourse('chat'); }} style={{ border: 'none', borderTop: '1px solid var(--line)' }}>
                <input
                  className="input glass sm"
                  placeholder="Ask a question..."
                  value={chatText}
                  onChange={e => setChatText(e.target.value)}
                  disabled={chatBusy}
                />
                <button className="btn sm" disabled={chatBusy || !chatText.trim()}>Ask</button>
              </form>
            </div>

            <div className="card glass">
              <h3 style={{ marginBottom: 8, fontSize: 14 }}>Resources</h3>
              {attach.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>No files attached.</div>
              ) : attach.map(a => (
                <div key={a.id} className="attach" style={{ background: 'transparent', padding: '8px 10px' }}>
                  <div className="name" style={{ fontSize: 12 }}>{a.file_name}</div>
                  <a href={publicUrl('course-files', a.file_path)} target="_blank" rel="noreferrer" className="btn ghost xs">↓</a>
                </div>
              ))}
              {canManage && (
                <label className="btn ghost sm" style={{ width: '100%', marginTop: 10, cursor: 'pointer' }}>
                  Upload File
                  <input type="file" hidden onChange={e => onFileUpload(e, openCourse.id)} />
                </label>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="row between" style={{ marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>Files</h3>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Select a course to view its files.</div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 8 }}>About</h3>
              <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                {mod.semester_label} · taught by {mod.owner_name || 'Unassigned'}.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
