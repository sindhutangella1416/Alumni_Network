import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

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

export default function Registration() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [location, setLocation] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [major, setMajor] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [institution, setInstitution] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [hasPriorExperience, setHasPriorExperience] = useState(false);
  const [priorCompany, setPriorCompany] = useState('');
  const [priorJobTitle, setPriorJobTitle] = useState('');
  const [priorWorkYears, setPriorWorkYears] = useState('');
  const [priorWorkDescription, setPriorWorkDescription] = useState('');
  const [startupName, setStartupName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [role, setRole] = useState('');
  const [resumePdf, setResumePdf] = useState(null);
  const [idCardPdf, setIdCardPdf] = useState(null);
  const [workProofPdf, setWorkProofPdf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isPdfFile = (file) => file && String(file.name || '').toLowerCase().endsWith('.pdf');

  const handleOAuth = async (provider) => {
    const oauthEmail = window.prompt(`[Simulated OAuth Flow]\n\nEnter your ${provider} email account to continue:`, 'user@example.com');
    if (!oauthEmail || !oauthEmail.trim()) return;

    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(`https://alumni-network-ev8e.onrender.com/oauth-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider,
          email: oauthEmail.trim()
        })
      });
      
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      localStorage.setItem('alumni_user', JSON.stringify(data.user));
      setLoading(false);
      navigate('/my-profile');
    } catch (err) {
      setError('Unable to connect to backend. Is FastAPI running on port 8000?');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isPdfFile(resumePdf)) {
      setError('Resume must be a PDF file (.pdf).');
      setLoading(false);
      return;
    }

    if (role === 'student') {
      if (!rollNo.trim()) {
        setError('Roll number is required for students.');
        setLoading(false);
        return;
      }
      if (!isPdfFile(idCardPdf)) {
        setError('College ID card must be a PDF file (.pdf).');
        setLoading(false);
        return;
      }
    }

    if (role === 'alumni' || role === 'educator') {
      if (!isPdfFile(idCardPdf)) {
        setError('ID card / employment proof must be a PDF file (.pdf).');
        setLoading(false);
        return;
      }
    }

    if (role === 'educator') {
      if (!institution.trim() || !specialization.trim()) {
        setError('Current Academic Institution and Specialization are required.');
        setLoading(false);
        return;
      }
      if (hasPriorExperience) {
        if (!priorCompany.trim() || !priorJobTitle.trim() || !priorWorkYears.trim() || !priorWorkDescription.trim()) {
          setError('All prior work experience fields are required if you have prior experience.');
          setLoading(false);
          return;
        }
      }
    }

    if (role === 'entrepreneur') {
      if (!isPdfFile(workProofPdf)) {
        setError('Working proof must be a PDF file (.pdf).');
        setLoading(false);
        return;
      }
    }

    const roleMap = {
      student: 'Student',
      alumni: 'Alumni',
      educator: 'Higher Educator',
      entrepreneur: 'Entrepreneur',
    };

    let details = '';
    if (role === 'student') {
      details = `${major}${graduationYear ? `, Class of ${graduationYear}` : ''}`.trim();
    } else if (role === 'educator') {
      details = [specialization, institution].filter(Boolean).join(' · ');
    } else if (role === 'entrepreneur') {
      details = [startupName, businessDescription].filter(Boolean).join(' · ');
    }

    const fd = new FormData();
    fd.append('name', fullName);
    fd.append('email', email);
    fd.append('password', password);
    fd.append('role', roleMap[role] || role);
    fd.append('roll_no', role === 'student' ? rollNo : '');
    let priorExpStr = '';
    if (role === 'educator' && hasPriorExperience) {
      priorExpStr = `Prior Company: ${priorCompany}\nPrior Title: ${priorJobTitle}\nYears: ${priorWorkYears}\nDescription: ${priorWorkDescription}`;
    }

    fd.append('company', role === 'alumni' ? company : '');
    fd.append('position', role === 'alumni' ? position : '');
    fd.append('location', location);
    fd.append('details', details);
    fd.append('work_experience', role === 'educator' ? priorExpStr : '');
    fd.append('resume_file', resumePdf);

    if (role === 'student' || role === 'alumni' || role === 'educator') {
      fd.append('id_card_file', idCardPdf);
    }
    if (role === 'entrepreneur') {
      fd.append('proof_file', workProofPdf);
    }

    try {
      const res = await fetch('https://alumni-network-ev8e.onrender.com/register', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        let msg = data.error || 'Registration failed.';
        const d = data.detail;
        if (typeof d === 'string') msg = d;
        else if (Array.isArray(d) && d.length) {
          msg = d.map((x) => x.msg || x).filter(Boolean).join(' ');
        }
        setError(msg);
        setLoading(false);
        return;
      }
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      navigate('/login');
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
      <div className="card glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Join the Alumni Platform</h2>

        {loading && (
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', textAlign: 'center', fontWeight: 'bold' }}>
            Submitting registration…
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', textAlign: 'center', fontWeight: 'bold' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <button type="button" className="oauth-btn oauth-btn-google" onClick={() => handleOAuth('Google')}>
            <GoogleIcon /> Continue with Google
          </button>
          <button type="button" className="oauth-btn oauth-btn-linkedin" onClick={() => handleOAuth('LinkedIn')}>
            <LinkedinIcon /> Continue with LinkedIn
          </button>
          <button type="button" className="oauth-btn oauth-btn-github" onClick={() => handleOAuth('GitHub')}>
            <GithubIcon /> Continue with GitHub
          </button>
        </div>

        <div className="divider">or register with email</div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input type="text" className="input-field" required placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input type="email" className="input-field" required placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input type="password" className="input-field" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Location (optional)</label>
            <input type="text" className="input-field" placeholder="City, country" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Resume (PDF only)</label>
            <input
              key={`resume-${role}`}
              type="file"
              className="input-field"
              accept="application/pdf,.pdf"
              required
              style={{ padding: '0.5rem' }}
              onChange={(e) => setResumePdf(e.target.files?.[0] || null)}
            />
          </div>

          <div className="input-group" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <label className="input-label">I am registering as a...</label>
            <select
              className="input-field"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setIdCardPdf(null);
                setWorkProofPdf(null);
              }}
              required
            >
              <option value="" disabled>Select your role</option>
              <option value="student">Current Student</option>
              <option value="alumni">Alumni</option>
              <option value="educator">Higher Educator</option>
              <option value="entrepreneur">Entrepreneur</option>
            </select>
          </div>

          {role === 'student' && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div className="input-group">
                <label className="input-label">Roll No</label>
                <input type="text" className="input-field" required placeholder="e.g. 21P61A0501" value={rollNo} onChange={(e) => setRollNo(e.target.value)} autoComplete="off" />
              </div>
              <div className="input-group">
                <label className="input-label">College ID card (PDF only)</label>
                <input
                  key="student-id"
                  type="file"
                  className="input-field"
                  accept="application/pdf,.pdf"
                  required
                  style={{ padding: '0.5rem' }}
                  onChange={(e) => setIdCardPdf(e.target.files?.[0] || null)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Major / Course of Study</label>
                <input type="text" className="input-field" required placeholder="e.g. Computer Science" value={major} onChange={(e) => setMajor(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Expected Graduation Year</label>
                <input type="number" className="input-field" required min="2024" max="2035" placeholder="2026" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} />
              </div>
            </div>
          )}

          {role === 'alumni' && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div className="input-group">
                <label className="input-label">ID card / employment proof (PDF only)</label>
                <input
                  key="alumni-id"
                  type="file"
                  className="input-field"
                  accept="application/pdf,.pdf"
                  required
                  style={{ padding: '0.5rem' }}
                  onChange={(e) => setIdCardPdf(e.target.files?.[0] || null)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Current Company</label>
                <input type="text" className="input-field" required placeholder="Google, Startup Inc." value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Job Title</label>
                <input type="text" className="input-field" required placeholder="Software Engineer" value={position} onChange={(e) => setPosition(e.target.value)} />
              </div>
            </div>
          )}

          {role === 'educator' && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', backgroundColor: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <input type="checkbox" checked={hasPriorExperience} onChange={(e) => setHasPriorExperience(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} />
                  <strong>Any Prior Work Experience?</strong>
                </label>
              </div>

              {hasPriorExperience && (
                <div style={{ padding: '1.5rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(0,0,0,0.1)' }}>
                  <h4 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text)' }}>Prior Work Details</h4>
                  <div className="input-group">
                    <label className="input-label">Prior Company</label>
                    <input type="text" className="input-field" required placeholder="Previous Company Name" value={priorCompany} onChange={(e) => setPriorCompany(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Prior Job Title</label>
                    <input type="text" className="input-field" required placeholder="Previous Job Title" value={priorJobTitle} onChange={(e) => setPriorJobTitle(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Prior Work Experience (years)</label>
                    <input type="number" className="input-field" required placeholder="e.g. 5" min="0" value={priorWorkYears} onChange={(e) => setPriorWorkYears(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Prior Work Description</label>
                    <textarea className="input-field" rows={3} required placeholder="Briefly describe your prior work..." value={priorWorkDescription} onChange={(e) => setPriorWorkDescription(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Current Academic Institution</label>
                <input type="text" className="input-field" required placeholder="University of XYZ" value={institution} onChange={(e) => setInstitution(e.target.value)} />
              </div>

              <div className="input-group">
                <label className="input-label">ID card / employment proof (PDF only)</label>
                <input
                  key="educator-id"
                  type="file"
                  className="input-field"
                  accept="application/pdf,.pdf"
                  required
                  style={{ padding: '0.5rem' }}
                  onChange={(e) => setIdCardPdf(e.target.files?.[0] || null)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Specialization / Department</label>
                <input type="text" className="input-field" required placeholder="Department of Physics" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
              </div>
            </div>
          )}

          {role === 'entrepreneur' && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div className="input-group">
                <label className="input-label">Working proof (PDF only)</label>
                <p className="text-muted" style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Upload registration, GST, business license, or similar official proof (PDF).
                </p>
                <input
                  key="entrepreneur-proof"
                  type="file"
                  className="input-field"
                  accept="application/pdf,.pdf"
                  required
                  style={{ padding: '0.5rem' }}
                  onChange={(e) => setWorkProofPdf(e.target.files?.[0] || null)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Startup Name</label>
                <input type="text" className="input-field" required placeholder="Nexus Innovations" value={startupName} onChange={(e) => setStartupName(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Business Description</label>
                <textarea className="input-field" rows="3" required placeholder="Briefly describe what your startup does..." value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} />
              </div>
            </div>
          )}

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={loading}>
              Create Account
            </button>
          </div>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <span className="text-muted">Already have an account? </span>
          <Link to="/login" style={{ fontWeight: 600 }}>Log In</Link>
        </div>
      </div>
    </div>
  );
}
