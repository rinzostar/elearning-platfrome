import Layout from '../../components/Layout';
import { useEffect, useState } from 'react';
import { listUsers, setBanned, setCommunityAdmin } from '../../lib/db';
import { HAS_SUPABASE } from '../../lib/supabase';
import { toast } from '../../lib/toast';
import Avatar from '../../components/Avatar';

export default function AdminUsers() {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', role: 'student', dob: '', year_code: 'L1' });
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const { data } = await listUsers();
    setUsers(data || []);
  };
  useEffect(() => { refresh(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (HAS_SUPABASE) {
        const r = await fetch('/api/create-user', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const j = await r.json().catch(() => ({ error: 'Response parse failed' }));
        if (!j.ok) throw new Error(j.error || 'Failed to create user');
        toast.success(`Created. Password: ${j.password}`, { duration: 6000 });
      } else {
        users.unshift({
          id: 'mock-' + Date.now(),
          full_name: form.full_name, email: form.email, role: form.role, banned: false,
          dob: form.dob, year_code: form.year_code
        });
        setUsers([...users]);
        const suffix = form.role === 'professor' ? 'prof' : (form.role === 'admin' ? 'admin' : 'std');
        toast.success(`Demo: created. Password would be ${form.dob}_${suffix}`, { duration: 6000 });
      }
      setForm({ full_name: '', email: '', role: 'student', dob: '', year_code: 'L1' });
      await refresh();
      setOpen(false);
    } catch (err) { 
      console.error('Create user failed:', err);
      toast.error(err.message); 
    } finally {
      setBusy(false);
    }
  };

  const toggleCommunityAdmin = async (u) => {
    const newVal = !u.is_community_admin;
    await setCommunityAdmin(u.id, newVal);
    toast.success(newVal ? 'Promoted to Community Admin' : 'Demoted from Community Admin');
    await refresh();
  };

  const toggleBan = async (u) => {
    if (!u.banned && !confirm(`Ban ${u.full_name}?`)) return;
    await setBanned(u.id, !u.banned);
    toast.success(u.banned ? 'User unbanned' : 'User banned');
    await refresh();
  };

  const filtered = users.filter(u =>
    !q ||
    u.full_name?.toLowerCase().includes(q.toLowerCase()) ||
    u.email?.toLowerCase().includes(q.toLowerCase())
  );

  const suffix = form.role === 'professor' ? 'prof' : (form.role === 'admin' ? 'admin' : 'std');

  return (
    <Layout>
      <div className="page-header">
        <div className="crumb">Administration</div>
        <div className="row between">
          <div>
            <h1>Users</h1>
            <p className="sub">{users.length} accounts · {users.filter(u => u.banned).length} banned</p>
          </div>
          <div className="row">
            <input
              className="input"
              placeholder="Search…"
              value={q} onChange={(e) => setQ(e.target.value)}
              style={{ width: 200 }}
            />
            <button className="btn" onClick={() => setOpen(!open)}>{open ? 'Cancel' : '+ New user'}</button>
          </div>
        </div>
      </div>

      {open && (
        <form className="card" style={{ marginBottom: 18 }} onSubmit={create}>
          <h3 style={{ marginBottom: 12 }}>Create account</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Full name</label>
              <input className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Role</label>
              <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="student">Student</option>
                <option value="professor">Professor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {form.role === 'student' && (
              <div className="field">
                <label>Year / Level</label>
                <select className="select" value={form.year_code} onChange={(e) => setForm({ ...form, year_code: e.target.value })}>
                  <option value="L1">L1 (Year 1)</option>
                  <option value="L2">L2 (Year 2)</option>
                  <option value="L3">L3 (Year 3)</option>
                  <option value="M1">M1 (Master 1)</option>
                  <option value="M2">M2 (Master 2)</option>
                </select>
              </div>
            )}
            <div className="field">
              <label>Date of birth (dd/mm/yyyy)</label>
              <input className="input" placeholder="01/01/2000" required value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>
            Password will be <span className="kbd">{form.dob || 'dd/mm/yyyy'}_{suffix}</span>
          </p>
          <div className="row">
            <button className="btn" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create'}</button>
            <button className="btn ghost" type="button" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}

      <table className="table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: 30 }}>No users found.</td></tr>
          ) : filtered.map(u => (
            <tr key={u.id}>
              <td>
                <div className="row" style={{ gap: 10 }}>
                  <Avatar name={u.full_name} id={u.id} size={28} fontSize={11} />
                  <div>
                    {u.full_name}
                    {u.is_community_admin && <div style={{ fontSize: 10, color: 'var(--brand)' }}>Community Admin ({u.year_code})</div>}
                  </div>
                </div>
              </td>
              <td style={{ color: 'var(--ink-3)' }}>{u.email}</td>
              <td>
                <span className="pill">{u.role}</span>
                {u.role === 'student' && u.year_code && <span className="pill" style={{ marginLeft: 4 }}>{u.year_code}</span>}
              </td>
              <td>
                {u.banned
                  ? <span className="pill" style={{ background: '#fee2e2', color: 'var(--danger)' }}>Banned</span>
                  : <span className="pill">Active</span>}
              </td>
              <td style={{ textAlign: 'right' }}>
                <div className="row end" style={{ gap: 6 }}>
                  {u.role === 'student' && (
                    <button className={`btn sm ${u.is_community_admin ? 'brand' : 'ghost'}`} onClick={() => toggleCommunityAdmin(u)}>
                      {u.is_community_admin ? '★ Admin' : '☆ Make Admin'}
                    </button>
                  )}
                  <button className="btn danger sm" onClick={() => toggleBan(u)}>
                    {u.banned ? 'Unban' : 'Ban'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}
