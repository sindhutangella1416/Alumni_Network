import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Mail, Briefcase, MapPin } from 'lucide-react';

const LinkedinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#0077b5" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.14 0 2.06.92 2.06 2.06 0 1.14-.92 2.06-2.06 2.06zm15.11 13.02h-3.56v-5.56c0-1.33-.03-3.03-1.85-3.03-1.85 0-2.13 1.45-2.13 2.94v5.65H9.36V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29z"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

const API = 'https://alumni-network-ev8e.onrender.com';

const fileHref = (path) => {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('uploads/')) return `${API}/${path}`;
  if (/^https?:\/\//i.test(path)) return path;
  return null;
};

const roleDisplayMap = {
  student: 'Student',
  alumni: 'Alumni',
  professional: 'Alumni',
  educator: 'Higher Educator',
  entrepreneur: 'Entrepreneur',
};

const getDisplayRole = (role) => roleDisplayMap[String(role || '').toLowerCase()] || role;

/** Background / details: work experience first, then profile details, then role line — never email. */
function directoryBackgroundText(u) {
  const wx = String(u.workExperience || '').trim();
  if (wx) return wx;
  const det = String(u.details || '').trim();
  if (det) return det;
  const job = [u.position, u.company].filter(Boolean).join(' · ');
  if (job) return job;
  return '';
}

function getCardSubtitle(u) {
  const role = String(u.role || '').toLowerCase();
  
  if (role === 'student') {
    return u.details ? u.details.split(',')[0].trim() : ''; 
  }
  if (role === 'educator' || role === 'higher educator' || role === 'higher education') {
    return u.details ? u.details.split('·')[0].trim() : '';
  }
  if (role === 'entrepreneur') {
    return u.details ? u.details.split('·')[0].trim() : '';
  }
  
  return u.company ? u.company.trim() : '';
}

function directoryContactEmail(u) {
  return String(u.email || '').trim() || '';
}

export default function Directory() {
  const navigate = useNavigate();
  const [nameQuery, setNameQuery] = useState('');
  const [roleQuery, setRoleQuery] = useState('');
  const [idQuery, setIdQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const [users, setUsers] = useState([]);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadUsers() {
      try {
        setFetchError('');
        const res = await fetch('https://alumni-network-ev8e.onrender.com/users');
        const data = await res.json();
        const list = data.users || [];
        if (!cancelled) {
          setUsers(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        if (!cancelled) {
          setFetchError('Failed to connect to server. Please try again.');
        }
      }
    }

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const directoryUsers = users;

  const filtered = directoryUsers.filter(u => {
    // 1. Search by Name
    const nameOk = !nameQuery.trim() || 
      String(u.name || '').toLowerCase().includes(nameQuery.toLowerCase().trim());
      
    // 2. Search by Role
    const rawRole = String(u.role || '').toLowerCase();
    const displayRole = getDisplayRole(u.role).toLowerCase();
    const qRole = roleQuery.toLowerCase().trim();
    // Allow matching against both internal role, display role, and mapping 'higher education' to 'educator'
    const roleOk = !qRole || 
      displayRole.includes(qRole) || 
      rawRole.includes(qRole) ||
      (rawRole === 'educator' && 'higher education'.includes(qRole));

    // 3. Search by ID
    let idOk = true;
    const qId = idQuery.trim();
    if (qId) {
      const isStudentOrEducator = rawRole === 'student' || rawRole === 'educator';
      if (!isStudentOrEducator) {
        idOk = false;
      } else {
        const idStr = String(u.rollNo || u.id || '').toLowerCase();
        idOk = idStr.includes(qId.toLowerCase());
      }
    }

    return nameOk && roleOk && idOk;
  });

  const hasActiveSearch = Boolean(nameQuery.trim() || roleQuery.trim() || idQuery.trim());

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <h2 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Alumni Directory</h2>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem', maxWidth: '1100px' }}>
        <div className="input-group" style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search style={{ position: 'absolute', top: '15px', left: '16px', color: 'var(--text-muted)' }} size={20} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by Name"
            aria-label="Search by Name"
            style={{ paddingLeft: '3rem', padding: '1rem 1rem 1rem 3rem', fontSize: '1.1rem' }}
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
          />
        </div>
        <div className="input-group" style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search style={{ position: 'absolute', top: '15px', left: '16px', color: 'var(--text-muted)' }} size={20} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by Role"
            aria-label="Search by Role"
            style={{ paddingLeft: '3rem', padding: '1rem 1rem 1rem 3rem', fontSize: '1.1rem' }}
            value={roleQuery}
            onChange={(e) => setRoleQuery(e.target.value)}
          />
        </div>
        <div className="input-group" style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search style={{ position: 'absolute', top: '15px', left: '16px', color: 'var(--text-muted)' }} size={20} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by ID"
            aria-label="Search by ID"
            style={{ paddingLeft: '3rem', padding: '1rem 1rem 1rem 3rem', fontSize: '1.1rem' }}
            value={idQuery}
            onChange={(e) => setIdQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>{hasActiveSearch ? 'Search Results' : 'All Registered Members'} <span className="text-muted" style={{ fontSize: '1rem', fontWeight: 'normal' }}>({filtered.length} total)</span></h3>
      </div>
      {fetchError && (
        <p className="text-muted" style={{ marginTop: '-0.5rem', marginBottom: '1.5rem' }}>
          {fetchError}
        </p>
      )}

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {filtered.map(user => (
          <div 
            key={user.id} 
            className="card glass-panel" 
            style={{ cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }} 
            onClick={() => setSelectedUser(user)}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
                  {user.profilePhoto ? (
                    <img src={fileHref(user.profilePhoto)} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', marginBottom: '0.5rem' }}>{user.name}</h3>
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '0.15rem 0.5rem', 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                    color: 'var(--primary)', 
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}>
                    {getDisplayRole(user.role)}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {getCardSubtitle(user) || 'Registered member'}
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '1rem', fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 500 }}>
              View Profile →
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted">No members found matching your search.</p>
        )}
      </div>

      {/* Profile Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', position: 'relative', padding: '2.5rem' }}>
            <button 
              onClick={() => setSelectedUser(null)} 
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', padding: '0.5rem', background: 'var(--background)', borderRadius: '50%' }}
            >
              <X size={20} color="var(--text-main)" />
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', overflow: 'hidden', flexShrink: 0 }}>
                  {selectedUser.profilePhoto ? (
                    <img src={fileHref(selectedUser.profilePhoto)} alt={selectedUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    selectedUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.75rem', marginBottom: '0.5rem' }}>{selectedUser.name}</h2>
                  <span style={{ 
                    display: 'inline-block', padding: '0.25rem 0.75rem', 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', 
                    borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600,
                  }}>
                    {getDisplayRole(selectedUser.role)}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {directoryBackgroundText(selectedUser) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: '50%' }}>
                    <Briefcase size={24} color="var(--primary)" />
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: '0.875rem' }}>Background / work experience</div>
                    <div style={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                      {directoryBackgroundText(selectedUser)}
                    </div>
                  </div>
                </div>
              )}
              {directoryContactEmail(selectedUser) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: '50%' }}>
                    <Mail size={24} color="var(--primary)" />
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: '0.875rem' }}>Contact (email)</div>
                    <div style={{ fontWeight: 500 }}>{directoryContactEmail(selectedUser) || 'N/A'}</div>
                  </div>
                </div>
              )}
              {selectedUser.location ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: '50%' }}>
                    <MapPin size={24} color="var(--primary)" />
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: '0.875rem' }}>Location</div>
                    <div style={{ fontWeight: 500 }}>{selectedUser.location}</div>
                  </div>
                </div>
              ) : null}
              {(selectedUser.linkedinUrl || selectedUser.githubUrl) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  {selectedUser.linkedinUrl && (
                    <a href={selectedUser.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#0077b5', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 500, transition: 'opacity 0.2s' }}>
                      <LinkedinIcon /> LinkedIn
                    </a>
                  )}
                  {selectedUser.githubUrl && (
                    <a href={selectedUser.githubUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#333', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 500, transition: 'opacity 0.2s' }}>
                      <GithubIcon /> GitHub
                    </a>
                  )}
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={async () => {
                  const partnerEmail = selectedUser.email;
                  const raw = localStorage.getItem('alumni_user');
                  if (!raw) {
                    navigate('/login');
                    return;
                  }
                  const me = JSON.parse(raw);
                  try {
                    await fetch('https://alumni-network-ev8e.onrender.com/connect', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        from_email: me.email,
                        to_email: partnerEmail,
                      }),
                    });
                  } catch {
                    /* ignore */
                  }
                  setSelectedUser(null);
                  navigate('/my-profile?tab=chat&with=' + encodeURIComponent(partnerEmail));
                }}
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
