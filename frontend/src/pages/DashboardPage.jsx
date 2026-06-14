import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import './DashboardPage.css';

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#14b8a6'];

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [balances, setBalances] = useState({ totalOwed: 0, totalOwe: 0 });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] });
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    api.get('/groups').then(setGroups).catch(() => {});
    api.get('/expenses/my-balances').then(setBalances).catch(() => {});
  };

  useEffect(() => { fetchData(); }, []);

  const createGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const group = await api.post('/groups', form);
      setGroups(g => [group, ...g]);
      toast.success(`Group "${group.name}" created`);
      setShowModal(false);
      setForm({ name: '', description: '', color: COLORS[0] });
      navigate(`/groups/${group.id}`);
    } catch (err) {
      toast.error(err.error || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.displayName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="font-display dashboard-title">Hey, {user?.displayName?.split(' ')[0]} 👋</h1>
          <p className="dashboard-sub">Here's your expense overview</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Group</button>
      </div>

      <div className="stats-row">
        <div className="stat-card stat-owe">
          <div className="stat-label">Total you owe</div>
          <div className="stat-value">₹{balances.totalOwe.toFixed(2)}</div>
        </div>
        <div className="stat-card stat-owed">
          <div className="stat-label">Total owed to you</div>
          <div className="stat-value">₹{balances.totalOwed.toFixed(2)}</div>
        </div>
        <div className="stat-card stat-net">
          <div className="stat-label">Net balance</div>
          <div className={`stat-value ${balances.totalOwed - balances.totalOwe >= 0 ? 'positive' : 'negative'}`}>
            ₹{Math.abs(balances.totalOwed - balances.totalOwe).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">Your Groups</h2>
        <span className="section-count">{groups.length}</span>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No groups yet</h3>
          <p>Create a group to start splitting expenses with friends</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create your first group</button>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map(g => (
            <div key={g.id} className="group-card" onClick={() => navigate(`/groups/${g.id}`)}>
              <div className="group-card-accent" style={{ background: g.color }} />
              <div className="group-card-body">
                <h3 className="group-card-name">{g.name}</h3>
                {g.description && <p className="group-card-desc">{g.description}</p>}
                <div className="group-card-meta">
                  <div className="group-avatars">
                    {g.members.slice(0, 4).map(m => (
                      <div key={m.userId} className="avatar avatar-sm group-avatar"
                        style={{ background: m.user.avatarColor }}
                        title={m.user.displayName}>
                        {m.user.displayName[0]}
                      </div>
                    ))}
                    {g.members.length > 4 && (
                      <div className="avatar avatar-sm group-avatar" style={{ background: 'var(--surface2)' }}>
                        +{g.members.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="group-expense-count">{g._count?.expenses || 0} expenses</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create Group</h2>
            <form onSubmit={createGroup}>
              <div className="field">
                <label className="label">Group Name</label>
                <input className="input" placeholder="Trip to Goa" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <label className="label">Description (optional)</label>
                <input className="input" placeholder="March 2025 trip" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="field">
                <label className="label">Color</label>
                <div className="color-picker">
                  {COLORS.map(c => (
                    <button key={c} type="button" className={`color-dot ${form.color === c ? 'selected' : ''}`}
                      style={{ background: c }} onClick={() => setForm({ ...form, color: c })} />
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating…' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
