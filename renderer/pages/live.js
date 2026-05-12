import Layout from '../components/Layout';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import { supabase, HAS_SUPABASE } from '../lib/supabase';
import { listChat, sendChat, endLivestream } from '../lib/db';
import { toast } from '../lib/toast';
import Avatar from '../components/Avatar';

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;

export default function Live() {
  const router = useRouter();
  const { user } = useAuth();
  const livestreamId = router.query.id;
  const roomName = router.query.room;
  const isHost = user?.role === 'professor' || user?.role === 'admin';

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState(0);
  const bodyRef = useRef(null);
  const videoRef = useRef(null);
  const audioContainerRef = useRef(null);
  const roomRef = useRef(null);

  // ---- Chat (Supabase Realtime) ----
  useEffect(() => {
    if (!livestreamId) return;

    if (!HAS_SUPABASE) {
      setMessages([
        { id: 1, sender_name: 'Sara', message: 'Hello everyone!' },
        { id: 2, sender_name: 'Karim', message: 'Audio is clear ✅' },
      ]);
      return;
    }

    listChat(livestreamId).then(({ data }) => {
      setMessages((data || []).map(m => ({ ...m, sender_name: m.profiles?.full_name || 'User' })));
    });

    const ch = supabase
      .channel(`chat-${livestreamId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `livestream_id=eq.${livestreamId}`,
      }, async (payload) => {
        const m = payload.new;
        const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', m.sender_id).single();
        setMessages(prev => [...prev, { ...m, sender_name: prof?.full_name || 'User' }]);
      })
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [livestreamId]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  // ---- LiveKit room ----
  useEffect(() => {
    if (!user || !roomName || !LIVEKIT_URL) return;

    let cancelled = false;
    (async () => {
      try {
        const { Room, RoomEvent, Track } = await import('livekit-client');
        const tokenRes = await fetch('/api/livekit-token', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName, identity: user.id, name: user.name, isHost,
          }),
        });
        const { token, error } = await tokenRes.json();
        if (error) { toast.error(error); return; }

        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        const updateCount = () => setParticipants(room.numParticipants);
        room.on(RoomEvent.ParticipantConnected, updateCount);
        room.on(RoomEvent.ParticipantDisconnected, updateCount);

        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Video && videoRef.current) {
            track.attach(videoRef.current);
          } else if (track.kind === Track.Kind.Audio) {
            const el = track.attach();
            el.autoplay = true;
            audioContainerRef.current?.appendChild(el);
          }
        });

        room.on(RoomEvent.Disconnected, () => setConnected(false));

        await room.connect(LIVEKIT_URL, token);
        if (cancelled) { await room.disconnect(); return; }
        setConnected(true);
        updateCount();

        if (isHost) {
          await room.localParticipant.setCameraEnabled(true);
          await room.localParticipant.setMicrophoneEnabled(true);
          // attach own preview
          for (const pub of room.localParticipant.trackPublications.values()) {
            if (pub.track?.kind === Track.Kind.Video && videoRef.current) {
              pub.track.attach(videoRef.current);
            }
          }
        }
      } catch (e) {
        toast.error('LiveKit: ' + e.message);
      }
    })();

    return () => {
      cancelled = true;
      if (roomRef.current) roomRef.current.disconnect();
      if (audioContainerRef.current) audioContainerRef.current.innerHTML = '';
    };
  }, [user, roomName, isHost]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const msg = text.trim();
    setText('');
    if (HAS_SUPABASE) {
      const { error } = await sendChat(livestreamId, user.id, msg);
      if (error) toast.error(error.message);
    } else {
      setMessages(prev => [...prev, { id: Date.now(), sender_name: user.name || 'You', message: msg }]);
    }
  };

  const endSession = async () => {
    if (!confirm('End this live session for everyone?')) return;
    await endLivestream(livestreamId).catch(() => {});
    await fetch('/api/end-live', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ livestream_id: livestreamId }),
    }).catch(() => {});
    if (roomRef.current) await roomRef.current.disconnect();
    toast.success('Session ended');
    router.push('/home');
  };

  const leave = async () => {
    if (roomRef.current) await roomRef.current.disconnect();
    router.back();
  };

  return (
    <Layout>
      <div className="page-header">
        <div className="crumb">Live session</div>
        <div className="row between">
          <h1>{roomName ? roomName.replace(/^module-(\d+)-.*/, 'Module #$1') : 'Live'}</h1>
          <div className="row">
            <span className={`pill ${connected ? 'live' : ''}`}>{connected ? `Connected · ${participants}` : 'Connecting…'}</span>
            {isHost
              ? <button className="btn danger sm" onClick={endSession}>End session</button>
              : <button className="btn ghost sm" onClick={leave}>Leave</button>}
          </div>
        </div>
        <p className="sub">{isHost ? 'You are broadcasting' : 'You are watching'}</p>
      </div>

      <div className="live-wrap">
        <div className="video-stage">
          <span className="pill live live-badge">On air</span>
          {LIVEKIT_URL ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isHost}
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
            />
          ) : (
            <div>📹 Set NEXT_PUBLIC_LIVEKIT_URL to enable video</div>
          )}
          <div ref={audioContainerRef} style={{ display: 'none' }} />
        </div>

        <div className="chat">
          <div className="chat-head row between">
            <span>Live chat</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 400 }}>{messages.length} messages</span>
          </div>
          <div className="chat-body" ref={bodyRef}>
            {messages.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--ink-4)', textAlign: 'center', marginTop: 16 }}>
                Be the first to say hi
              </div>
            ) : messages.map((m, i) => (
              <div key={m.id || i} className="msg row" style={{ alignItems: 'flex-start', gap: 8 }}>
                <Avatar name={m.sender_name} id={m.sender_id || m.sender_name} size={24} fontSize={10} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="who">{m.sender_name}</div>
                  <div className="text">{m.message}</div>
                </div>
              </div>
            ))}
          </div>
          <form className="chat-input" onSubmit={send}>
            <input
              placeholder={user ? 'Send a message…' : 'Sign in to chat'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!user}
            />
            <button className="btn sm" type="submit" disabled={!text.trim()}>Send</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
