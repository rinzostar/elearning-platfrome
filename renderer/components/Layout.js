import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from './Header';

export default function Layout({ children, toggleDarkMode, darkMode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { href: '/home', label: 'Home', icon: 'fa-home' },
    { href: '/browse', label: 'Courses', icon: 'fa-book-open' },
    { href: '/community', label: 'Community', icon: 'fa-users' },
    { href: '/profile', label: 'Profile', icon: 'fa-user-circle' },
  ];

  const isActive = (href) => {
    if (href === '/home') return router.pathname === '/' || router.pathname === '/home' || router.pathname === '/login';
    return router.pathname.startsWith(href);
  };

  if (!mounted) return null;

  return (
    <div className="app-container">
      <Header toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
      
      <main className="main-content">
        {children}
      </main>
      
      <nav className="bottom-nav">
        {navItems.map(item => (
          <Link 
            key={item.href} 
            href={item.href}
            className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
          >
            <i className={`fas ${item.icon} nav-icon`}></i>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}