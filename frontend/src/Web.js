import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Registration from './pages/Registration.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard';
import Directory from './pages/Directory';
import MyProfile from './pages/MyProfile';
import Chat from './pages/Chat.jsx';

function App() {
  return (
    <Router>
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/my-profile" element={<MyProfile />} />
          </Routes>
        </main>
        <footer style={{ padding: '2rem 0', textAlign: 'center', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          <p className="text-muted">© {new Date().getFullYear()} Alumni Platform. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;