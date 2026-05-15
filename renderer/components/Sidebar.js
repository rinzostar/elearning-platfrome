import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';

const ICONS = {
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  courses: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  community: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-10V7a4 4 0 00-8 0v4M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75',
  profile: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h10a7 7 0 00-7-7z',
};

function Icon({ name }) {
  return (
    <div className="nav-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={ICONS[name]} />
      </svg>
    </div>
  );
}

export default function BottomNav() {
  const router = useRouter();
  const { user } = useAuth();
  
  const is = (p) => router.pathname === p || router.pathname.startsWith(p + '/');

  return (
    <nav className="bottom-nav">
      <Link href="/home" className={`nav-item ${is('/home') ? 'active' : ''}`}>
        <Icon name="home" />
        <span className="nav-label">Home</span>
      </Link>
      
      <Link href="/browse" className={`nav-item ${is('/browse') ? 'active' : ''}`}>
        <Icon name="courses" />
        <span className="nav-label">Courses</span>
      </Link>
      
      <Link href="/community" className={`nav-item ${is('/community') ? 'active' : ''}`}>
        <Icon name="community" />
        <span className="nav-label">Community</span>
      </Link>
      
      <Link href="/profile" className={`nav-item ${is('/profile') ? 'active' : ''}`}>
        <Icon name="profile" />
        <span className="nav-label">Profile</span>
      </Link>
    </nav>
  );
}
