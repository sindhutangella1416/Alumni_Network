import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, User as UserIcon } from 'lucide-react';

const API = 'http://127.0.0.1:8000';

const ROLE_OPTIONS = [
  { value: 'Student', label: 'Student' },
  { value: 'Alumni', label: 'Alumni' },
  { value: 'Higher Educator', label: 'Higher Educator' },
  { value: 'Entrepreneur', label: 'Entrepreneur' },
];

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'student') return 'Student';
  if (value === 'alumni' || value === 'professional') return 'Alumni';
  if (value === 'educator' || value === 'higher educator') return 'Higher Educator';
  if (value === 'entrepreneur') return 'Entrepreneur';
  return role || '';
};

const fileHref = (path) => {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('uploads/')) return `${API}/${path}`;
  if (/^https?:\/\//i.test(path)) return path;
  return null;
};

const isValidUrl = (string) => {
  if (!string) return true; // empty string is fine
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export default function MyProfile() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    role: '',
    rollNo: '',
    company: '',
    position: '',
    location: '',
    resume: '',
    workExperience: '',
    linkedinUrl: '',
    githubUrl: '',
    profilePhoto: '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const email = session?.email;

  const loadProfile = useCallback(async (userEmail) => {
    try {
      const res = await fetch(`${API}/profile?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (!res.ok) {
        setProfileErr(data.detail || 'Failed to load profile from backend.');
        return;
      }
      if (data.error || !data.user) {
        setProfileErr(data.error || 'Profile data is not available from backend.');
        return;
      }
      const u = data.user;
      setProfile({
        ...u,
        role: normalizeRole(u.role),
      });
      const resumeRaw = u.resume || '';
      setForm({
        role: normalizeRole(u.role),
        rollNo: u.rollNo || '',
        company: u.company || '',
        position: u.position || '',
        location: u.location || '',
        resume: resumeRaw.startsWith('uploads/') ? '' : resumeRaw,
        workExperience: u.workExperience || '',
        linkedinUrl: u.linkedinUrl || '',
        githubUrl: u.githubUrl || '',
        profilePhoto: u.profilePhoto || '',
      });
    } catch {
      setProfileErr('Could not load profile. Is backend running?');
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem('alumni_user');
    if (!raw) {
      navigate('/login');
      return;
    }
    const u = JSON.parse(raw);
    setSession(u);
    setForm((prev) => ({ ...prev, role: normalizeRole(u.role) || prev.role || '' }));
  }, [navigate]);

  useEffect(() => {
    if (!email) return;
    loadProfile(email);
  }, [email, loadProfile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileErr('');
    setProfileMsg('');

    if (form.linkedinUrl && !isValidUrl(form.linkedinUrl)) {
      setProfileErr('Please enter a valid URL for LinkedIn');
      return;
    }
    if (form.githubUrl && !isValidUrl(form.githubUrl)) {
      setProfileErr('Please enter a valid URL for GitHub');
      return;
    }

    try {
      const res = await fetch(`${API}/profile?email=${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: form.role || undefined,
          rollNo: (normalizeRole(form.role) === 'Student' || normalizeRole(form.role) === 'Higher Educator') ? form.rollNo : undefined,
          company: form.company,
          position: form.position,
          location: form.location,
          ...(normalizeRole(form.role) === 'Higher Educator'
            ? { workExperience: form.workExperience.trim() }
            : {}),
          ...(form.resume.trim() ? { resume: form.resume.trim() } : {}),
          linkedinUrl: form.linkedinUrl,
          githubUrl: form.githubUrl,
          profilePhoto: form.profilePhoto,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setProfileErr(data.error);
        return;
      }
      setProfileMsg('Profile saved successfully.');
      if (data.user) {
        setProfile({ ...data.user, role: normalizeRole(data.user.role) });
        const next = {
          ...session,
          name: data.user.name,
          role: normalizeRole(data.user.role),
          rollNo: data.user.rollNo || session.rollNo || '',
        };
        localStorage.setItem('alumni_user', JSON.stringify(next));
        setSession(next);
      }
    } catch {
      setProfileErr('Could not save profile. Please check connection.');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setProfileErr('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API}/upload-image`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        setForm(prev => ({ ...prev, profilePhoto: data.url }));
        setProfileMsg('Photo uploaded. Make sure to click Save Changes.');
      } else {
        setProfileErr(data.detail || 'Failed to upload photo.');
      }
    } catch {
      setProfileErr('Upload failed. Check backend connection.');
    } finally {
      setUploadingImage(false);
    }
  };

  if (!session) return null;

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <UserIcon size={32} color="var(--primary)" />
        <h2 style={{ margin: 0, fontSize: '2rem' }}>My Profile</h2>
      </div>

      <div className="card glass-panel" style={{ padding: '2.5rem', borderRadius: '1rem' }}>
        <h3 style={{ marginTop: 0, borderBottom: '2px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
          {profile?.name || session?.name || 'User'} Information
        </h3>
        
        <p className="text-muted" style={{ marginBottom: '2rem', background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '8px' }}>
          Registered Account: <strong>{session.email}</strong>
        </p>

        {profileErr && <div style={{ color: 'var(--danger)', marginBottom: '1.5rem', fontWeight: 600 }}>{profileErr}</div>}
        {profileMsg && <div style={{ color: 'var(--success)', marginBottom: '1.5rem', fontWeight: 600 }}>{profileMsg}</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '1rem', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
            {form.profilePhoto ? (
               <img src={fileHref(form.profilePhoto)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
               (profile?.name || session?.name || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>Profile Photo</h3>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Upload a picture to personalize your directory presence.</p>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              {uploadingImage ? 'Uploading...' : 'Choose Image...'}
              <input type="file" hidden accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
            </label>
          </div>
        </div>

        <form onSubmit={handleSaveProfile}>
          <div className="input-group">
            <label className="input-label">Full name</label>
            <input type="text" className="input-field" value={profile?.name || ''} disabled style={{ opacity: 0.7 }} />
          </div>
          
          {(normalizeRole(form.role) === 'Student' || normalizeRole(form.role) === 'Higher Educator') && (
            <div className="input-group" style={{ animation: 'fadeIn 0.3s ease' }}>
              <label className="input-label">Roll No</label>
              <input 
                type="text" 
                className="input-field" 
                value={form.rollNo} 
                onChange={e => setForm({ ...form, rollNo: e.target.value })} 
                placeholder="e.g. 21P61A0501" 
              />
            </div>
          )}
          
          <div className="input-group">
            <label className="input-label">Role</label>
            <select
              className="input-field"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="">Select role</option>
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Company / Organization</label>
            <input
              type="text"
              className="input-field"
              placeholder="Company name"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Position / Title</label>
            <input
              type="text"
              className="input-field"
              placeholder="Your role at work"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Location (optional)</label>
            <input
              type="text"
              className="input-field"
              placeholder="City, country — leave blank if you prefer not to show"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <div className="input-group" style={{ flex: '1 1 250px', marginBottom: 0 }}>
              <label className="input-label">LinkedIn Profile URL</label>
              <input
                type="url"
                className="input-field"
                placeholder="https://linkedin.com/in/..."
                value={form.linkedinUrl}
                onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
              />
            </div>
            <div className="input-group" style={{ flex: '1 1 250px', marginBottom: 0 }}>
              <label className="input-label">GitHub Profile URL</label>
              <input
                type="url"
                className="input-field"
                placeholder="https://github.com/..."
                value={form.githubUrl}
                onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
              />
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 1rem 0' }}>Uploaded Documents</h4>
            
            {fileHref(profile?.resume) && (
              <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '150px', fontWeight: 600 }}>Resume:</span>
                <a href={fileHref(profile.resume)} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>View PDF Document</a>
              </div>
            )}
            {profile?.idCardFile && fileHref(profile.idCardFile) && (
              <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '150px', fontWeight: 600 }}>{normalizeRole(profile?.role) === 'Student' ? 'College ID:' : 'ID Proof:'}</span>
                <a href={fileHref(profile.idCardFile)} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>View PDF Document</a>
              </div>
            )}
            {profile?.workProofFile && fileHref(profile.workProofFile) && (
              <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '150px', fontWeight: 600 }}>Working Proof:</span>
                <a href={fileHref(profile.workProofFile)} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>View PDF Document</a>
              </div>
            )}
          </div>

          {normalizeRole(profile?.role) === 'Higher Educator' && (
            <div className="input-group">
              <label className="input-label">Prior work experience (before academia)</label>
              <textarea
                className="input-field"
                rows={4}
                placeholder="Describe any industry or prior roles"
                value={form.workExperience}
                onChange={(e) => setForm({ ...form, workExperience: e.target.value })}
              />
            </div>
          )}
          <div className="input-group">
            <label className="input-label">Resume link or notes (optional)</label>
            <textarea
              className="input-field"
              rows={4}
              placeholder="Optional: add a resume link or short note (does not replace your uploaded PDF unless you save a new link here)"
              value={form.resume}
              onChange={(e) => setForm({ ...form, resume: e.target.value })}
            />
          </div>
          <div style={{ textAlign: 'right', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
              <Save size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
