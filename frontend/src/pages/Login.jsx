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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.14 0 2.06.92 2.06 2.06 0 1.14-.92 2.06-2.06 2.06zm15.11 13.02h-3.56v-5.56c0-1.33-.03-3.03-1.85-3.03-1.85 0-2.13 1.45-2.13 2.94v5.65H9.36V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29z"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

export default function Login() {
  const [loginRole, setLoginRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleOAuth = async (provider) => {
    const oauthEmail = window.prompt(`[Simulated OAuth Flow]\n\nEnter your ${provider} email account to continue:`, 'user@example.com');
    if (!oauthEmail || !oauthEmail.trim()) return;

    setError('');
    setIsSubmitted(true);
    
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
        setIsSubmitted(false);
        return;
      }

      localStorage.setItem('alumni_user', JSON.stringify(data.user));
      setIsSubmitted(false);
      navigate('/my-profile');
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
      setIsSubmitted(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setIsSubmitted(true);

    if (loginRole === 'student' && !rollNo.trim()) {
      setError('Enter your roll number (same as on registration).');
      setIsSubmitted(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        email,
        password,
      });
      if (rollNo.trim()) {
        params.set('roll_no', rollNo.trim());
      }

      const res = await fetch(`https://alumni-network-ev8e.onrender.com/login?${params.toString()}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setIsSubmitted(false);
        return;
      }

      localStorage.setItem('alumni_user', JSON.stringify(data.user));
      setIsSubmitted(false);
      navigate('/my-profile');
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
      setIsSubmitted(false);
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem', maxWidth: '600px' }}>
      <div className="card glass-panel" style={{ padding: '2.5rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Welcome Back</h2>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Log in to your VMTW Alumni platform account.
        </p>

        {isSubmitted && !error && (
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', textAlign: 'center', fontWeight: 'bold' }}>
            Logging you in...
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

        <div className="divider">or continue with email</div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">I am logging in as a...</label>
            <select
              className="input-field"
              required
              value={loginRole}
              onChange={(e) => {
                setLoginRole(e.target.value);
                if (e.target.value !== 'student') {
                  setRollNo('');
                }
              }}
            >
              <option value="" disabled>Select your role</option>
              <option value="student">Current Student</option>
              <option value="alumni">Alumni</option>
              <option value="educator">Higher Educator</option>
              <option value="entrepreneur">Entrepreneur</option>
            </select>
          </div>

          {loginRole === 'student' && (
            <div className="input-group">
              <label className="input-label">Roll No</label>
              <input
                type="text"
                className="input-field"
                required
                placeholder="e.g. 21P61A0501"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                autoComplete="off"
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input type="email" className="input-field" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>

          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Password
              <button type="button" style={{ fontSize: '0.8rem', fontWeight: 'normal', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}>Forgot Password?</button>
            </label>
            <input type="password" className="input-field" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={isSubmitted}>
              Sign In
            </button>
          </div>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <span className="text-muted">Don't have an account yet? </span>
          <Link to="/register" style={{ fontWeight: 600 }}>Join VMTW</Link>
        </div>
      </div>
    </div>
  );
}
