import '../styles/globals.css';
import { AuthProvider } from '../lib/auth';
import { HierarchyProvider } from '../lib/HierarchyContext';
import Toaster from '../components/Toaster';
import AdminPanel from '../components/AdminPanel';
import { useEffect, useState } from 'react';

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    const msg = e.message || '';
    if (msg.includes('clipboard') || msg.includes('image input') || msg.includes('does not support')) {
      e.preventDefault();
      return true;
    }
  });

  window.addEventListener('unhandledrejection', (e) => {
    const msg = e.reason?.message || e.reason || '';
    if (msg.includes('clipboard') || msg.includes('image input') || msg.includes('does not support')) {
      e.preventDefault();
    }
  });
}

if (typeof window !== 'undefined' && window.electronAPI) {
  const originalFetch = window.fetch;
  window.fetch = async (url, options) => {
    if (typeof url === 'string' && url.startsWith('/api/')) {
      const endpoint = url.replace('/api/', '');
      const body = options?.body ? JSON.parse(options.body) : {};
      
      let result;
      switch (endpoint) {
        case 'start-live': result = await window.electronAPI.startLive(body); break;
        case 'end-live': result = await window.electronAPI.endLive(body); break;
        case 'livekit-token': result = await window.electronAPI.getLivekitToken(body); break;
        case 'create-user': result = await window.electronAPI.createUser(body); break;
        case 'ai-course': result = await window.electronAPI.generateCourse(body); break;
        case 'ai-course-chat': result = await window.electronAPI.chatCourse(body); break;
        default: return originalFetch(url, options);
      }
      
      return new Response(JSON.stringify(result), {
        status: result.error ? 500 : 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return originalFetch(url, options);
  };
}

export default function App({ Component, pageProps }) {
  const [darkMode, setDarkMode] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) document.body.classList.add('dark-mode');
  }, []);

  const toggleDarkMode = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('darkMode', newVal);
    if (newVal) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  };

  return (
    <AuthProvider>
      <HierarchyProvider>
        <Component {...pageProps} toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
        <button className="admin-fab" onClick={() => setAdminOpen(o => !o)} title="Admin Panel">
          <i className="fas fa-cog"></i>
        </button>
        <AdminPanel isOpen={adminOpen} onClose={() => setAdminOpen(false)} />
        <Toaster />
      </HierarchyProvider>
    </AuthProvider>
  );
}