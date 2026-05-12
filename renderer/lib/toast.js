// Tiny pub/sub toast system. No deps.
let listeners = [];
let counter = 0;

export function toast(message, opts = {}) {
  const t = {
    id: ++counter,
    message,
    kind: opts.kind || 'info', // info | success | error
    duration: opts.duration ?? 3200,
  };
  listeners.forEach(fn => fn({ type: 'add', toast: t }));
  if (t.duration > 0) {
    setTimeout(() => {
      listeners.forEach(fn => fn({ type: 'remove', id: t.id }));
    }, t.duration);
  }
  return t.id;
}

toast.success = (m, o = {}) => toast(m, { ...o, kind: 'success' });
toast.error = (m, o = {}) => toast(m, { ...o, kind: 'error' });
toast.info = (m, o = {}) => toast(m, { ...o, kind: 'info' });

export function subscribe(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}

export function dismiss(id) {
  listeners.forEach(fn => fn({ type: 'remove', id }));
}
