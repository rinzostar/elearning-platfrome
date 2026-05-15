// Data access layer. If Supabase env is not set, returns in-memory mock data
// so the UI still works for design preview.
import { supabase, HAS_SUPABASE } from './supabase';

// ---------- MOCK STORE ----------
const mock = {
  semesters: [
    { id: 1, level: 'Licence', year_code: 'L1', semester_code: 'S1', label: 'Licence 1 - S1' },
    { id: 2, level: 'Licence', year_code: 'L1', semester_code: 'S2', label: 'Licence 1 - S2' },
    { id: 3, level: 'Licence', year_code: 'L2', semester_code: 'S3', label: 'Licence 2 - S3' },
    { id: 4, level: 'Licence', year_code: 'L2', semester_code: 'S4', label: 'Licence 2 - S4' },
    { id: 5, level: 'Licence', year_code: 'L3', semester_code: 'S5', label: 'Licence 3 - S5' },
    { id: 6, level: 'Licence', year_code: 'L3', semester_code: 'S6', label: 'Licence 3 - S6' },
    { id: 7, level: 'Master', year_code: 'M1', semester_code: 'S1', label: 'Master 1 - S1' },
    { id: 8, level: 'Master', year_code: 'M1', semester_code: 'S2', label: 'Master 1 - S2' },
    { id: 9, level: 'Master', year_code: 'M2', semester_code: 'S3', label: 'Master 2 - S3' },
    { id: 10, level: 'Doctorat', year_code: 'D', semester_code: 'R', label: 'Doctorat - Research' },
  ],
  modules: [
    { id: 1, semester_id: 1, name: 'Mathematics I', owner_id: 'mock-professor', owner_name: 'Dr. M. Chérif' },
    { id: 2, semester_id: 1, name: 'Intro to Programming', owner_id: 'mock-professor', owner_name: 'Dr. L. Hadj' },
    { id: 3, semester_id: 1, name: 'Physics I', owner_id: 'mock-professor', owner_name: 'Dr. S. Kaci' },
    { id: 4, semester_id: 7, name: 'Linear Algebra', owner_id: 'mock-professor', owner_name: 'Dr. A. Benali' },
  ],
  courses: [
    { id: 1, module_id: 1, title: 'Vectors and spaces', content: 'Intro notes for vectors and spaces.\nhttps://www.youtube.com/watch?v=fNk_zzaMoSs', yt_url: 'https://www.youtube.com/watch?v=fNk_zzaMoSs', created_at: '2025-05-10' },
    { id: 2, module_id: 1, title: 'Matrix operations', content: 'Matrix operation notes and exercises.', yt_url: null, created_at: '2025-05-09' },
    { id: 3, module_id: 1, title: 'Linear transformations', content: 'Linear transformations overview.', yt_url: 'https://www.youtube.com/watch?v=kYB8IZa5AuE', created_at: '2025-05-07' },
  ],
  attachments: [
    { id: 1, course_id: 1, file_name: 'Lecture-01.pdf', file_path: '#' },
    { id: 2, course_id: 1, file_name: 'Exercises.docx', file_path: '#' },
    { id: 3, course_id: 2, file_name: 'Slides-week1.pptx', file_path: '#' },
  ],
  favorites: [], // {user_id, course_id}
  posts: [
    { id: 1, author_id: 'u1', author_name: 'Yacine M.', content: 'Anyone has the past exam papers for Algorithms? 📚', link: null, file_path: null, created_at: new Date(Date.now() - 7200e3).toISOString() },
    { id: 2, author_id: 'u2', author_name: 'Inès B.', content: 'Found a great free course on linear algebra.', link: 'https://youtube.com', file_path: null, created_at: new Date(Date.now() - 18000e3).toISOString() },
  ],
  reports: [],
  livestreams: [],
  teaching_requests: [],
  notifications: [],
  users: [
    { id: 'u1', full_name: 'Aïcha Benali', email: 'a.benali@school.edu', role: 'professor', banned: false, dob: '01/01/1980' },
    { id: 'u2', full_name: 'Yacine Meziane', email: 'y.meziane@school.edu', role: 'student', banned: false, dob: '01/01/2005', year_code: 'L1' },
    { id: 'u3', full_name: 'Inès Belkacem', email: 'i.belkacem@school.edu', role: 'student', banned: false, dob: '01/01/2005', year_code: 'L1' },
    { id: 'u4', full_name: 'Mohamed Chérif', email: 'm.cherif@school.edu', role: 'professor', banned: false, dob: '01/01/1975' },
  ],
};

const ok = (data) => ({ data, error: null });
const nextId = (arr) => (arr.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1);
const electronAPI = () => (typeof window !== 'undefined' ? window.electronAPI : null);
const LIVE_TTL_HOURS = 8;
const liveCutoff = () => new Date(Date.now() - LIVE_TTL_HOURS * 60 * 60 * 1000).toISOString();

// Helper to prevent indefinite hangs
const DB_TIMEOUT = 30000; // 30s
async function withTimeout(promise, context = 'Database', ms = DB_TIMEOUT) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${context} request timed out`)), ms);
  });
  try {
    const res = await Promise.race([promise, timeoutPromise]);
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------- API ----------

export async function listSemesters() {
  if (!HAS_SUPABASE) return ok(mock.semesters);
  try {
    return await withTimeout(supabase.from('semesters').select('*').order('id'), 'listSemesters');
  } catch (e) { return { data: null, error: e }; }
}

export async function listModulesBySemester(semesterId) {
  if (!HAS_SUPABASE) {
    const rows = mock.modules.filter(m => m.semester_id === Number(semesterId));
    return ok(rows.map(m => ({ ...m, course_count: mock.courses.filter(c => c.module_id === m.id).length })));
  }
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('modules')
        .select('id, name, semester_id, owner_id, profiles:owner_id(full_name), courses(count)')
        .eq('semester_id', semesterId),
      'listModulesBySemester'
    );
    if (error) return { data: null, error };
    return ok(data.map(m => ({
      id: m.id, name: m.name, semester_id: m.semester_id, owner_id: m.owner_id,
      owner_name: m.profiles?.full_name, course_count: m.courses?.[0]?.count || 0,
    })));
  } catch (e) { return { data: null, error: e }; }
}

export async function getModule(id) {
  if (!HAS_SUPABASE) {
    const m = mock.modules.find(x => x.id === Number(id));
    if (!m) return ok(null);
    const sem = mock.semesters.find(s => s.id === m.semester_id);
    return ok({ ...m, semester_label: sem?.label, year_code: sem?.year_code });
  }
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('modules')
        .select('*, profiles:owner_id(full_name), semesters(label, year_code)')
        .eq('id', id).single(),
      'getModule'
    );
    if (error) return { data: null, error };
    return ok({ ...data, owner_name: data.profiles?.full_name, semester_label: data.semesters?.label, year_code: data.semesters?.year_code });
  } catch (e) { return { data: null, error: e }; }
}

export async function listCoursesByModule(moduleId) {
  if (!HAS_SUPABASE) {
    const rows = mock.courses.filter(c => c.module_id === Number(moduleId));
    return ok(rows.map(c => ({ ...c, attachment_count: mock.attachments.filter(a => a.course_id === c.id).length })));
  }
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('courses')
        .select('*, attachments(count)')
        .eq('module_id', moduleId)
        .order('created_at', { ascending: false }),
      'listCoursesByModule'
    );
    if (error) return { data: null, error };
    return ok(data.map(c => ({ ...c, attachment_count: c.attachments?.[0]?.count || 0 })));
  } catch (e) { return { data: null, error: e }; }
}

export async function listAttachments({ moduleId, courseId } = {}) {
  if (!HAS_SUPABASE) {
    if (courseId) return ok(mock.attachments.filter(a => a.course_id === Number(courseId)));
    if (moduleId) {
      const courseIds = mock.courses.filter(c => c.module_id === Number(moduleId)).map(c => c.id);
      return ok(mock.attachments.filter(a => courseIds.includes(a.course_id)));
    }
    return ok([]);
  }
  try {
    if (courseId) return await withTimeout(supabase.from('attachments').select('*').eq('course_id', courseId), 'listAttachments:course');
    const { data: courses } = await supabase.from('courses').select('id').eq('module_id', moduleId);
    const ids = (courses || []).map(c => c.id);
    if (!ids.length) return ok([]);
    return await withTimeout(supabase.from('attachments').select('*').in('course_id', ids), 'listAttachments:module');
  } catch (e) { return { data: null, error: e }; }
}

export async function endLivestream(id) {
  if (!HAS_SUPABASE) {
    const l = mock.livestreams.find(x => x.id === id);
    if (l) l.status = 'ended';
    return ok(true);
  }
  try {
    return await withTimeout(supabase.from('livestreams').update({ status: 'ended' }).eq('id', id), 'endLivestream');
  } catch (e) { return { data: null, error: e }; }
}

// Replaced by unified version at end of file

export async function dismissReports(postId) {
  if (!HAS_SUPABASE) {
    mock.reports = mock.reports.filter(r => r.post_id !== Number(postId));
    return ok(true);
  }
  try {
    if (electronAPI()?.dismissReports) {
      const res = await withTimeout(electronAPI().dismissReports({ post_id: postId }), 'dismissReports:ipc');
      if (res?.error) return { data: null, error: new Error(res.error) };
      return ok(true);
    }
    return await withTimeout(supabase.from('reports').delete().eq('post_id', postId), 'dismissReports:supabase');
  } catch (e) { return { data: null, error: e }; }
}

export async function listMyModules(profId) {
  if (!HAS_SUPABASE) {
    return ok(mock.modules
      .filter(m => m.owner_id === profId)
      .map(m => ({
        ...m,
        semester_label: mock.semesters.find(s => s.id === m.semester_id)?.label,
        course_count: mock.courses.filter(c => c.module_id === m.id).length,
      })));
  }
  try {
    // Check modules where prof is owner OR in module_teachers
    const { data: owned } = await supabase.from('modules').select('id').eq('owner_id', profId);
    const { data: teaching } = await supabase.from('module_teachers').select('module_id').eq('professor_id', profId);
    
    const ids = Array.from(new Set([
      ...(owned || []).map(o => o.id),
      ...(teaching || []).map(t => t.module_id)
    ]));

    if (!ids.length) return ok([]);

    const { data, error } = await withTimeout(
      supabase
        .from('modules')
        .select('*, semesters(label), courses(count)')
        .in('id', ids),
      'listMyModules'
    );
    if (error) return { data: null, error };
    return ok(data.map(m => ({
      ...m, semester_label: m.semesters?.label, course_count: m.courses?.[0]?.count || 0,
    })));
  } catch (e) { return { data: null, error: e }; }
}

export async function createCourse({ module_id, title, content = '', yt_url = null }) {
  if (!HAS_SUPABASE) {
    const course = {
      id: nextId(mock.courses),
      module_id: Number(module_id),
      title,
      content,
      yt_url,
      created_at: new Date().toISOString(),
    };
    mock.courses.unshift(course);
    return ok(course);
  }
  try {
    return await withTimeout(
      supabase.from('courses').insert({ module_id, title, content, yt_url }).select().single(),
      'createCourse',
      45000 // 45s for potentially large content
    );
  } catch (e) { return { data: null, error: e }; }
}

export async function updateCourse(id, { title, content, yt_url }) {
  if (!HAS_SUPABASE) {
    const c = mock.courses.find(x => x.id === Number(id));
    if (c) {
      if (title !== undefined) c.title = title;
      if (content !== undefined) c.content = content;
      if (yt_url !== undefined) c.yt_url = yt_url;
    }
    return ok(true);
  }
  try {
    return await withTimeout(
      supabase.from('courses').update({ title, content, yt_url }).eq('id', id),
      'updateCourse',
      45000 // 45s
    );
  } catch (e) { return { data: null, error: e }; }
}

export async function deleteCourse(id) {
  if (!HAS_SUPABASE) {
    const idx = mock.courses.findIndex(x => x.id === Number(id));
    if (idx >= 0) {
      mock.courses.splice(idx, 1);
      mock.attachments = mock.attachments.filter(a => a.course_id !== Number(id));
    }
    return ok(true);
  }
  try {
    // Delete attachments first (due to FK)
    await supabase.from('attachments').delete().eq('course_id', id);
    return await withTimeout(supabase.from('courses').delete().eq('id', id), 'deleteCourse');
  } catch (e) { return { data: null, error: e }; }
}

export async function deleteAttachment(id) {
  if (!HAS_SUPABASE) {
    const idx = mock.attachments.findIndex(x => x.id === Number(id));
    if (idx >= 0) mock.attachments.splice(idx, 1);
    return ok(true);
  }
  try {
    return await withTimeout(supabase.from('attachments').delete().eq('id', id), 'deleteAttachment');
  } catch (e) { return { data: null, error: e }; }
}

export async function createAttachment({ course_id, file_path, file_name }) {
  if (!HAS_SUPABASE) {
    const attachment = { id: nextId(mock.attachments), course_id: Number(course_id), file_path, file_name };
    mock.attachments.push(attachment);
    return ok(attachment);
  }
  try {
    return await withTimeout(
      supabase.from('attachments').insert({ course_id, file_path, file_name }).select().single(),
      'createAttachment'
    );
  } catch (e) { return { data: null, error: e }; }
}

export async function listFavorites(userId) {
  if (!HAS_SUPABASE) {
    const favIds = mock.favorites.filter(f => f.user_id === userId).map(f => f.course_id);
    return ok(mock.courses.filter(c => favIds.includes(c.id)).map(c => ({
      ...c, module: mock.modules.find(m => m.id === c.module_id),
    })));
  }
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('favorites')
        .select('courses(*, modules(name))')
        .eq('user_id', userId),
      'listFavorites'
    );
    if (error) return { data: null, error };
    return ok((data || []).map(r => ({ ...r.courses, module: { name: r.courses?.modules?.name } })));
  } catch (e) { return { data: null, error: e }; }
}

export async function toggleFavorite(userId, courseId) {
  if (!HAS_SUPABASE) {
    const idx = mock.favorites.findIndex(f => f.user_id === userId && f.course_id === courseId);
    if (idx >= 0) mock.favorites.splice(idx, 1);
    else mock.favorites.push({ user_id: userId, course_id: courseId });
    return ok(true);
  }
  try {
    const { data: existing } = await supabase
      .from('favorites').select().eq('user_id', userId).eq('course_id', courseId).maybeSingle();
    if (existing) {
      await withTimeout(supabase.from('favorites').delete().eq('user_id', userId).eq('course_id', courseId), 'toggleFavorite:delete');
    } else {
      await withTimeout(supabase.from('favorites').insert({ user_id: userId, course_id: courseId }), 'toggleFavorite:insert');
    }
    return ok(true);
  } catch (e) { return { data: null, error: e }; }
}

// Functions consolidated or moved to end of file

export async function listUsers() {
  if (!HAS_SUPABASE) return ok(mock.users);
  try {
    return await withTimeout(supabase.from('profiles').select('*').order('full_name'), 'listUsers');
  } catch (e) { return { data: null, error: e }; }
}

export async function setBanned(userId, banned) {
  if (!HAS_SUPABASE) {
    const u = mock.users.find(x => x.id === userId);
    if (u) u.banned = banned;
    return ok(true);
  }
  try {
    return await withTimeout(supabase.from('profiles').update({ banned }).eq('id', userId), 'setBanned');
  } catch (e) { return { data: null, error: e }; }
}

export async function listAdminModules() {
  if (!HAS_SUPABASE) {
    return ok(mock.modules.map(m => ({
      ...m,
      semester_label: mock.semesters.find(s => s.id === m.semester_id)?.label,
      owner_name: mock.users.find(u => u.id === m.owner_id)?.full_name || 'Unassigned',
    })));
  }
  try {
    return await withTimeout(
      supabase
        .from('modules')
        .select('*, semesters(label), profiles:owner_id(full_name)')
        .order('id'),
      'listAdminModules'
    );
  } catch (e) { return { data: null, error: e }; }
}

export async function createModule({ name, semester_id, owner_id }) {
  if (!HAS_SUPABASE) {
    mock.modules.push({ id: nextId(mock.modules), name, semester_id: Number(semester_id), owner_id });
    return ok(true);
  }
  try {
    return await withTimeout(supabase.from('modules').insert({ name, semester_id, owner_id }), 'createModule');
  } catch (e) { return { data: null, error: e }; }
}

export async function updateModule(id, { name }) {
  if (!HAS_SUPABASE) {
    const m = mock.modules.find(x => x.id === Number(id));
    if (m) m.name = name;
    return ok(true);
  }
  try {
    return await withTimeout(supabase.from('modules').update({ name }).eq('id', id), 'updateModule');
  } catch (e) { return { data: null, error: e }; }
}

export async function listProfessors() {
  if (!HAS_SUPABASE) return ok(mock.users.filter(u => u.role === 'professor'));
  try {
    return await withTimeout(supabase.from('profiles').select('*').eq('role', 'professor'), 'listProfessors');
  } catch (e) { return { data: null, error: e }; }
}

export async function getActiveLivestreamForModule(moduleId) {
  if (!HAS_SUPABASE) {
    const cutoff = liveCutoff();
    return ok(mock.livestreams.find(l =>
      l.module_id === Number(moduleId) &&
      l.room_name === `module-${moduleId}` &&
      l.status === 'live' &&
      (!l.started_at || l.started_at >= cutoff)
    ) || null);
  }
  try {
    const { data } = await withTimeout(
      supabase
        .from('livestreams')
        .select('*')
        .eq('module_id', moduleId)
        .eq('room_name', `module-${moduleId}`)
        .eq('status', 'live')
        .gte('started_at', liveCutoff())
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      'getActiveLivestream'
    );
    return ok(data);
  } catch (e) { return { data: null, error: e }; }
}

export async function listActiveLivestreams() {
  if (!HAS_SUPABASE) {
    const cutoff = liveCutoff();
    return ok(mock.livestreams.filter(l =>
      l.status === 'live' &&
      l.room_name === `module-${l.module_id}` &&
      (!l.started_at || l.started_at >= cutoff)
    ).map(l => ({
      ...l, module_name: mock.modules.find(m => m.id === l.module_id)?.name,
    })));
  }
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('livestreams')
        .select('*, modules(name), profiles:host_id(full_name)')
        .eq('status', 'live')
        .gte('started_at', liveCutoff()),
      'listActiveLivestreams'
    );
    if (error) return { data: null, error };
    return ok((data || []).filter(l => l.room_name === `module-${l.module_id}`));
  } catch (e) { return { data: null, error: e }; }
}

// chat
export async function listChat(livestreamId) {
  if (!HAS_SUPABASE) return ok([]);
  try {
    return await withTimeout(
      supabase
        .from('chat_messages')
        .select('*, profiles:sender_id(full_name)')
        .eq('livestream_id', livestreamId)
        .order('created_at', { ascending: true }),
      'listChat'
    );
  } catch (e) { return { data: null, error: e }; }
}

export async function sendChat(livestreamId, senderId, message) {
  if (!HAS_SUPABASE) return ok(true);
  try {
    return await withTimeout(supabase.from('chat_messages').insert({ livestream_id: livestreamId, sender_id: senderId, message }), 'sendChat');
  } catch (e) { return { data: null, error: e }; }
}

// ---------- Notifications ----------
const NOTIF_PREFS_KEY = 'lumen_notif_prefs';

function getNotifPrefs() {
  if (typeof window === 'undefined') return { live: true, courses: true };
  try {
    return JSON.parse(localStorage.getItem(NOTIF_PREFS_KEY) || '{"live":true,"courses":true}');
  } catch { return { live: true, courses: true }; }
}

function setNotifPrefs(prefs) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}

export function getNotificationSettings() {
  return getNotifPrefs();
}

export function setNotificationSettings(prefs) {
  setNotifPrefs(prefs);
}

export async function listRecentCourses(limit = 10) {
  if (!HAS_SUPABASE) {
    return ok(mock.courses.slice(0, limit).map(c => ({
      ...c,
      module_name: mock.modules.find(m => m.id === c.module_id)?.name || 'Module',
      professor_name: mock.modules.find(m => m.id === c.module_id)?.owner_name || 'Professor',
    })));
  }
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('courses')
        .select('*, modules(name), profiles:modules(owner_id(full_name))')
        .order('created_at', { ascending: false })
        .limit(limit),
      'listRecentCourses'
    );
    if (error) return { data: null, error };
    return ok((data || []).map(c => ({
      id: c.id,
      type: 'course',
      title: c.title,
      module_id: c.module_id,
      module_name: c.modules?.name,
      professor_name: c.profiles?.full_name,
      created_at: c.created_at,
    })));
  } catch (e) { return { data: null, error: e }; }
}

// Teaching requests
export async function createTeachingRequest(professorId, moduleId) {
  if (!HAS_SUPABASE) {
    mock.teaching_requests.push({ id: nextId(mock.teaching_requests), professor_id: professorId, module_id: moduleId, status: 'pending', created_at: new Date().toISOString() });
    return ok(true);
  }
  try {
    return await withTimeout(supabase.from('teaching_requests').insert({ professor_id: professorId, module_id: moduleId }), 'createTeachingRequest');
  } catch (e) { return { data: null, error: e }; }
}

export async function listTeachingRequests() {
  if (!HAS_SUPABASE) {
    return ok(mock.teaching_requests.map(r => ({
      ...r,
      professor_name: mock.users.find(u => u.id === r.professor_id)?.full_name,
      module_name: mock.modules.find(m => m.id === r.module_id)?.name,
    })));
  }
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('teaching_requests')
        .select('*, profiles:professor_id(full_name), modules(name)')
        .order('created_at', { ascending: false }),
      'listTeachingRequests'
    );
    if (error) return { data: null, error };
    return ok(data.map(r => ({
      ...r,
      professor_name: r.profiles?.full_name,
      module_name: r.modules?.name,
    })));
  } catch (e) { return { data: null, error: e }; }
}

export async function updateTeachingRequestStatus(requestId, status) {
  if (!HAS_SUPABASE) {
    const r = mock.teaching_requests.find(x => x.id === requestId);
    if (r) {
      r.status = status;
      if (status === 'approved') {
        const m = mock.modules.find(x => x.id === r.module_id);
        if (m) m.owner_id = r.professor_id;
      }
    }
    return ok(true);
  }
  try {
    const { data: req } = await supabase.from('teaching_requests').select('*').eq('id', requestId).single();
    if (status === 'approved' && req) {
      await supabase.from('module_teachers').insert({ module_id: req.module_id, professor_id: req.professor_id });
      const { data: mod } = await supabase.from('modules').select('owner_id').eq('id', req.module_id).single();
      if (!mod?.owner_id) {
        await supabase.from('modules').update({ owner_id: req.professor_id }).eq('id', req.module_id);
      }
    }
    return await withTimeout(supabase.from('teaching_requests').update({ status }).eq('id', requestId), 'updateTeachingRequestStatus');
  } catch (e) { return { data: null, error: e }; }
}

// Notifications
export async function addNotification({ user_id, title, message, type, link }) {
  if (!HAS_SUPABASE) {
    mock.notifications.unshift({ id: nextId(mock.notifications), user_id, title, message, type, link, is_read: false, created_at: new Date().toISOString() });
    return ok(true);
  }
  try {
    return await withTimeout(supabase.from('notifications').insert({ user_id, title, message, type, link }), 'addNotification');
  } catch (e) { return { data: null, error: e }; }
}

export async function listNotifications(userId) {
  if (!HAS_SUPABASE) {
    return ok(mock.notifications.filter(n => n.user_id === userId));
  }
  try {
    return await withTimeout(
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      'listNotifications'
    );
  } catch (e) { return { data: null, error: e }; }
}

export async function markNotificationRead(id) {
  if (!HAS_SUPABASE) {
    const n = mock.notifications.find(x => x.id === id);
    if (n) n.is_read = true;
    return ok(true);
  }
  try {
    return await withTimeout(supabase.from('notifications').update({ is_read: true }).eq('id', id), 'markNotificationRead');
  } catch (e) { return { data: null, error: e }; }
}

export async function listPostsByYear(yearCode) {
  if (!HAS_SUPABASE) {
    return ok(mock.posts.filter(p => !yearCode || p.year_code === yearCode || !p.year_code));
  }
  try {
    let q = supabase.from('posts').select('*, profiles:author_id(full_name)');
    if (yearCode) q = q.eq('year_code', yearCode);
    const result = await withTimeout(q.order('created_at', { ascending: false }), 'listPostsByYear');
    if (result.error) {
      console.error('[listPostsByYear] Supabase Error:', result.error);
    }
    return result;
  } catch (e) { return { data: null, error: e }; }
}

export async function createPost({ author_id, content, year_code, file_path = null }) {
  console.log('[createPost] Starting...', { author_id, year_code });
  
  if (!HAS_SUPABASE) {
    mock.posts.unshift({ id: nextId(mock.posts), author_id, content, year_code, file_path, created_at: new Date().toISOString() });
    return ok(true);
  }
  
  try {
    // Quick ping to see if Supabase is reachable
    const { error: pingErr } = await supabase.from('profiles').select('id').limit(1);
    if (pingErr) console.warn('[createPost] Supabase ping warning:', pingErr.message);

    console.log('[createPost] Executing insert...');
    // REMOVED TIMEOUT to see if it ever finishes or what error it gives
    const { data, error } = await supabase
      .from('posts')
      .insert({ author_id, content, year_code, file_path })
      .select();
    
    if (error) {
      console.error('[createPost] Supabase Error:', error);
      return { data: null, error };
    }
    
    console.log('[createPost] Success:', data);
    return ok(data);
  } catch (e) { 
    console.error('[createPost] Exception:', e);
    return { data: null, error: e }; 
  }
}

export async function deletePost(id) {
  if (!HAS_SUPABASE) {
    const idx = mock.posts.findIndex(p => p.id === id);
    if (idx !== -1) mock.posts.splice(idx, 1);
    return ok(true);
  }
  try {
    return await withTimeout(supabase.from('posts').delete().eq('id', id), 'deletePost');
  } catch (e) { return { data: null, error: e }; }
}

export async function reportPost(postId, reporterId) {
  if (!HAS_SUPABASE) {
    mock.reports.push({ id: nextId(mock.reports), post_id: postId, reporter_id: reporterId });
    return ok(true);
  }
  try {
    return await withTimeout(supabase.from('reports').insert({ post_id: postId, reporter_id: reporterId }), 'reportPost');
  } catch (e) { return { data: null, error: e }; }
}

export async function listReports() {
  if (!HAS_SUPABASE) {
    const grouped = {};
    mock.reports.forEach(r => { grouped[r.post_id] = (grouped[r.post_id] || 0) + 1; });
    return ok(Object.entries(grouped).map(([pid, count]) => {
      const p = mock.posts.find(x => x.id === Number(pid));
      return p ? { ...p, count } : null;
    }).filter(Boolean));
  }
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('reports')
        .select('post_id, posts(*, profiles:author_id(full_name))'),
      'listReports'
    );
    if (error) return { data: null, error };
    const grouped = {};
    (data || []).forEach(r => {
      if (!r.posts) return;
      const k = r.post_id;
      if (!grouped[k]) grouped[k] = { ...r.posts, count: 0, author_name: r.posts.profiles?.full_name };
      grouped[k].count += 1;
    });
    return ok(Object.values(grouped));
  } catch (e) { return { data: null, error: e }; }
}

export async function setCommunityAdmin(userId, is_community_admin) {
  if (!HAS_SUPABASE) {
    const u = mock.users.find(x => x.id === userId);
    if (u) u.is_community_admin = is_community_admin;
    return ok(true);
  }
  try {
    return await withTimeout(supabase.from('profiles').update({ is_community_admin }).eq('id', userId), 'setCommunityAdmin');
  } catch (e) { return { data: null, error: e }; }
}

export async function listModulesWithRequests(profId) {
  if (!HAS_SUPABASE) {
    return ok(mock.modules.map(m => ({
      ...m,
      request_status: mock.teaching_requests.find(r => r.module_id === m.id && r.professor_id === profId)?.status
    })));
  }
  try {
    const { data: mods } = await supabase.from('modules').select('*, semesters(label)');
    const { data: reqs } = await supabase.from('teaching_requests').select('*').eq('professor_id', profId);
    return ok(mods.map(m => ({
      ...m,
      semester_label: m.semesters?.label,
      request_status: reqs.find(r => r.module_id === m.id)?.status
    })));
  } catch (e) { return { data: null, error: e }; }
}

export async function notifyYear(yearCode, { title, message, type, link }) {
  if (!HAS_SUPABASE) return ok(true);
  try {
    const { data: students } = await supabase.from('profiles').select('id').eq('year_code', yearCode).eq('role', 'student');
    if (!students?.length) return ok(true);
    
    const notifs = students.map(s => ({
      user_id: s.id,
      title,
      message,
      type,
      link
    }));
    
    return await withTimeout(supabase.from('notifications').insert(notifs), 'notifyYear');
  } catch (e) { return { data: null, error: e }; }
}

