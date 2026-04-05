import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, TrendingUp, BookOpen } from 'lucide-react';

export default function Landing() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero" style={{
        padding: '6rem 1rem',
        textAlign: 'center',
        background: 'linear-gradient(to bottom, var(--surface), var(--background))'
      }}>
        <div className="container">
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', letterSpacing: '-0.025em' }}>
            Welcome to the <span className="text-gradient">VMTW Alumni Network</span>
          </h1>
          <p className="text-muted" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
            The exclusive platform for VMTW Students, Alumni, Higher Educators, and Entrepreneurs to Connect, Collaborate, and Grow Together.
          </p>
          <div className="hero-actions flex-center" style={{ gap: '1rem' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>Get Started</Link>
            <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>View Analytics</Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features container" style={{ padding: '5rem 1rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.25rem', marginBottom: '3rem' }}>Why Join Our Network?</h2>
        <div className="features-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem'
        }}>
          {features.map((feature, idx) => (
            <div key={idx} className="card feature-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p className="text-muted" style={{ marginTop: '0.5rem' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    icon: <Users size={32} />,
    title: "Alumni Directory",
    desc: "Find and connect with fellow alumni across various industries and regions."
  },
  {
    icon: <Briefcase size={32} />,
    title: "Career Opportunities",
    desc: "Discover job postings and career advice from seasoned professionals."
  },
  {
    icon: <TrendingUp size={32} />,
    title: "Entrepreneurship",
    desc: "Connect with founders and investors to accelerate your startup journey."
  },
  {
    icon: <BookOpen size={32} />,
    title: "Higher Education",
    desc: "Navigate post-graduate options with guidance from higher educators."
  }
];
