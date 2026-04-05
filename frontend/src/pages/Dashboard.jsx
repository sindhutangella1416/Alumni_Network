import React, { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS Components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        setFetchError('');
        const res = await fetch('http://127.0.0.1:8000/users');
        const data = await res.json();
        if (!cancelled) {
          setUsers(Array.isArray(data.users) ? data.users : []);
        }
      } catch (e) {
        if (!cancelled) {
          setUsers([]);
          setFetchError('Could not load dashboard data from backend.');
        }
      }
    }

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const roleCounts = useMemo(() => {
    const counts = {
      students: 0,
      alumni: 0,
      educators: 0,
      entrepreneurs: 0,
      other: 0,
    };

    users.forEach((user) => {
      const role = String(user.role || '').trim().toLowerCase();
      if (role === 'student') counts.students += 1;
      else if (role === 'alumni' || role === 'professional') counts.alumni += 1;
      else if (role === 'educator' || role === 'higher educator') counts.educators += 1;
      else if (role === 'entrepreneur') counts.entrepreneurs += 1;
      else counts.other += 1;
    });

    return counts;
  }, [users]);

  const roleChartData = {
    labels: ['Students', 'Alumni', 'Higher Educators', 'Entrepreneurs'],
    datasets: [
      {
        label: 'Registration Count',
        data: [
          roleCounts.students,
          roleCounts.alumni,
          roleCounts.educators,
          roleCounts.entrepreneurs,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#3b82f6',
        borderWidth: 1,
      },
    ],
  };

  const roleChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      },
    },
    scales: {
      y: {
        ticks: { color: 'var(--text-main)', stepSize: 1 },
        suggestedMax: Math.max(
          3,
          roleCounts.students,
          roleCounts.alumni,
          roleCounts.educators,
          roleCounts.entrepreneurs
        )
      },
      x: { ticks: { color: 'var(--text-main)' } }
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', margin: 0 }}>Dashboard</h2>
        <div style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <span className="text-muted" style={{ fontWeight: 500, marginRight: '0.5rem' }}>Total Registrations:</span>
          <span style={{ color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 700 }}>{users.length}</span>
        </div>
      </div>
      {fetchError && (
        <p className="text-muted" style={{ marginBottom: '1rem' }}>
          {fetchError}
        </p>
      )}

      <div className="dashboard-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem'
      }}>
        <div className="card glass-panel" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Bar data={roleChartData} options={roleChartOptions} />
          </div>
        </div>
        <div className="card glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ marginTop: 0 }}>Registrations by Field</h3>
          <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Students: {roleCounts.students}</p>
          <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Alumni/Professionals: {roleCounts.alumni}</p>
          <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Higher Educators: {roleCounts.educators}</p>
          <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Entrepreneurs: {roleCounts.entrepreneurs}</p>
          {roleCounts.other > 0 && (
            <p className="text-muted" style={{ marginBottom: 0 }}>Other: {roleCounts.other}</p>
          )}
        </div>
      </div>
    </div>
  );
}
