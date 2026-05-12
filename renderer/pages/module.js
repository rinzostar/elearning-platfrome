import Layout from '../components/Layout';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import {
  getModule, listCoursesByModule, listAttachments,
  getActiveLivestreamForModule, toggleFavorite, listFavorites, endLivestream,
} from '../lib/db';
import { publicUrl } from '../lib/storage';
import { toast } from '../lib/toast';

function ytEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
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
  const playerRef = useRef(null);

  const isOwner = user && mod && user.id === mod.owner_id;
  const canStartLive = user && (user.role === 'admin' || isOwner);

  const refresh = async () => {
    if (!id) return;
    const [m, c, l] = await Promise.all([
      getModule(id),
      listCoursesByModule(id),
      getActiveLivestreamForModule(id),
    ]);
    setMod(m.data);
    setCourses(c.data || []);
    setLive(l.data);
    if (c.data?.[0] && !openCourse) setOpenCourse(c.data[0]);
    if (user) {
      const { data: f } = await listFavorites(user.id);
      setFavs(new Set((f || []).map(x => x.id)));
    }
    setLoading(false);
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [id, user?.id]);

  // load attachments for selected course
  useEffect(() => {
    if (!openCourse) { setAttach([]); return; }
    listAttachments({ courseId: openCourse.id }).then(({ data }) => setAttach(data || []));
  }, [openCourse?.id]);

  const star = async (cid) => {
    if (!user) return;
    await toggleFavorite(user.id, cid);
    setFavs(prev => {
      const s = new Set(prev);
      s.has(cid) ? s.delete(cid) : s.add(cid);
      return s;
    });
    toast.success(favs.has(cid) ? 'Removed from favorites' : 'Added to favorites');
  };

  const startLive = async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/start-live', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: Number(id), host_id: user.id }),
      });
      const j = await r.json();
      if (j.ok) router.push(`/live?id=${j.livestream.id}&room=${j.livestream.room_name}`);
      else toast.error(j.error || 'Failed to start live');
    } catch (e) { toast.error(e.message); }
    setBusy(false);
  };

  const stopLive = async () => {
    if (!live) return;
    setBusy(true);
    await endLivestream(live.id).catch(() => {});
    await fetch('/api/end-live', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ livestream_id: live.id }),
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

  const embed = openCourse?.yt_url ? ytEmbed(openCourse.yt_url) : null;

  return (
    <Layout>
      <div className="page-header">
        <div className="crumb"><Link href="/browse">Browse</Link> / {mod.semester_label}</div>
        <div className="row between">
          <h1>{mod.name}</h1>
          <div className="row">
            {live && <span className="pill live">Live</span>}
            {live && !isOwner && (
              <Link href={`/live?id=${live.id}&room=${live.room_name}`} className="btn live">Join live</Link>
            )}
            {live && (isOwner || user?.role === 'admin') && (
              <>
                <Link href={`/live?id=${live.id}&room=${live.room_name}`} className="btn live">Open</Link>
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
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28 }}>
        <div>
          <h2 style={{ marginBottom: 12 }}>Courses</h2>
          {courses.length === 0 ? (
            <div className="empty">No courses uploaded yet.</div>
          ) : courses.map(c => (
            <div
              key={c.id}
              className="course-row"
              style={openCourse?.id === c.id ? { borderColor: 'var(--ink)', boxShadow: '0 0 0 3px rgba(10,10,10,0.04)' } : null}
            >
              <div className="left">
                <div className="ic">{c.yt_url ? '▶' : '📄'}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {c.attachment_count || 0} {c.attachment_count === 1 ? 'file' : 'files'}
                  </div>
                </div>
              </div>
              <div className="row">
                {user && (
                  <button className={`fav ${favs.has(c.id) ? 'on' : ''}`} onClick={() => star(c.id)} aria-label="Favorite">
                    {favs.has(c.id) ? '★' : '☆'}
                  </button>
                )}
                <button className="btn ghost sm" onClick={() => openAndScroll(c)}>Open</button>
              </div>
            </div>
          ))}

          {openCourse && (
            <>
              <div className="divider" />
              <div ref={playerRef}>
                <h2 style={{ marginBottom: 12 }}>{openCourse.title}</h2>
                {embed ? (
                  <iframe
                    src={embed}
                    style={{ width: '100%', aspectRatio: '16/9', border: 0, borderRadius: 'var(--radius)' }}
                    allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div style={{
                    aspectRatio: '16 / 9', background: '#0a0a0a',
                    borderRadius: 'var(--radius)', display: 'grid', placeItems: 'center',
                    color: '#525252', fontSize: 13,
                  }}>
                    No video — see attachments
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <h3 style={{ marginBottom: 12 }}>
              {openCourse ? 'Files' : 'Attachments'}
              {openCourse && <span style={{ fontWeight: 400, color: 'var(--ink-3)', fontSize: 12, marginLeft: 6 }}>· {openCourse.title}</span>}
            </h3>
            {attach.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>No files for this course.</div>
            ) : attach.map(a => (
              <div key={a.id} className="attach">
                <div className="name">{a.file_name}</div>
                <a className="btn ghost sm" href={publicUrl('course-files', a.file_path)} target="_blank" rel="noreferrer">
                  Download
                </a>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 8 }}>About</h3>
            <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              {mod.semester_label} · taught by {mod.owner_name || 'Unassigned'}.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
