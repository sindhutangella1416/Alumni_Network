import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart2, LogOut, Search, User, UserPlus, MessageCircle } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const read = () => {
      const raw = localStorage.getItem('alumni_user');
      setUser(raw ? JSON.parse(raw) : null);
    };
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, [location.pathname]);

  const isActive = (path) => (location.pathname === path ? 'active-link' : '');

  const handleLogout = () => {
    localStorage.removeItem('alumni_user');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="navbar" style={{
      backgroundColor: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="container flex-center" style={{ justifyContent: 'space-between', height: '4rem' }}>
        <Link to="/" className="logo flex-center" style={{ gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)' }}>
          <img src="/logo.png" alt="VMTW Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
          <span>VMTW<span className="text-gradient"> Alumni</span></span>
        </Link>
        <div className="nav-links flex-center" style={{ gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/directory" className={`nav-link ${isActive('/directory')}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 500 }}>
            <Search size={18} />
            Directory
          </Link>
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 500 }}>
            <BarChart2 size={18} />
            Analytics
          </Link>
          {user ? (
            <>
              <Link to="/chat" className={`nav-link ${isActive('/chat')}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 500 }}>
                <MessageCircle size={18} />
                Messages
              </Link>
              <Link to="/my-profile" className={`nav-link ${isActive('/my-profile')}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 500 }}>
                <User size={18} />
                My profile
              </Link>
              <button
                type="button"
                className="nav-link"
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
              >
                <LogOut size={18} />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`nav-link ${isActive('/login')}`} style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ gap: '0.5rem' }}>
                <UserPlus size={18} />
                Join VMTW
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
