import Layout from '../../components/Layout';
import { useEffect, useState } from 'react';
import { listTeachingRequests, updateTeachingRequestStatus, addNotification } from '../../lib/db';
import { toast } from '../../lib/toast';
import Avatar from '../../components/Avatar';

export default function AdminRequests() {
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const refresh = async () => {
    const { data } = await listTeachingRequests();
    setReqs(data || []);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const handle = async (id, status, profId, modName) => {
    setBusy(id);
    try {
      await updateTeachingRequestStatus(id, status);
      await addNotification({
        user_id: profId,
        title: status === 'approved' ? 'Request Approved' : 'Request Declined',
        message: `Your request to teach "${modName}" has been ${status}.`,
        type: 'teaching_request',
        link: '/modules'
      });
      toast.success(`Request ${status}`);
      await refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const pending = reqs.filter(r => r.status === 'pending');
  const history = reqs.filter(r => r.status !== 'pending');

  return (
    <Layout>
      <div className="page-header">
        <div className="crumb">Administration</div>
        <h1>Teaching Requests</h1>
        <p className="sub">Manage professor access to subjects.</p>
      </div>

      {loading ? (
        <div className="skel" style={{ height: 200 }} />
      ) : (
        <>
          <section style={{ marginBottom: 30 }}>
            <h3>Pending Requests ({pending.length})</h3>
            <table className="table">
              <thead>
                <tr><th>Professor</th><th>Module</th><th>Requested</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 30, color: 'var(--ink-3)' }}>No pending requests.</td></tr>
                ) : pending.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <Avatar name={r.professor_name} id={r.professor_id} size={24} fontSize={10} />
                        {r.professor_name}
                      </div>
                    </td>
                    <td>{r.module_name}</td>
                    <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <button className="btn sm" onClick={() => handle(r.id, 'approved', r.professor_id, r.module_name)} disabled={busy === r.id}>Accept</button>
                        <button className="btn ghost sm danger" onClick={() => handle(r.id, 'declined', r.professor_id, r.module_name)} disabled={busy === r.id}>Decline</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {history.length > 0 && (
            <section>
              <h3 style={{ color: 'var(--ink-3)' }}>History</h3>
              <table className="table">
                <thead>
                  <tr><th>Professor</th><th>Module</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {history.map(r => (
                    <tr key={r.id}>
                      <td>{r.professor_name}</td>
                      <td>{r.module_name}</td>
                      <td>
                        <span className={`pill ${r.status === 'approved' ? 'success' : 'danger'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </Layout>
  );
}
