import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [balances, setBalances] = useState({ totalOwed: 0, totalOwe: 0 });

  useEffect(() => {
    api.get('/groups').then(setGroups).catch(() => {});
    api.get('/expenses/my-balances').then(setBalances).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.displayName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand font-display">SplitEasy</div>

        <div className="sidebar-balance">
          {balances.totalOwe > 0 && (
            <div className="balance-item balance-owe">
              <span className="balance-label">You owe</span>
              <span className="balance-amount">₹{balances.totalOwe.toFixed(2)}</span>
            </div>
          )}
          {balances.totalOwed > 0 && (
            <div className="balance-item balance-owed">
              <span className="balance-label">You're owed</span>
              <span className="balance-amount">₹{balances.totalOwed.toFixed(2)}</span>
            </div>
          )}
          {balances.totalOwe === 0 && balances.totalOwed === 0 && (
            <div className="balance-item balance-clear">
              <span className="balance-label">All settled up</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span>⊞</span> Dashboard
          </NavLink>
          {groups.length > 0 && (
            <>
              <div className="nav-section-label">Groups</div>
              {groups.map(g => (
                <NavLink key={g.id} to={`/groups/${g.id}`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-dot" style={{ background: g.color }} />
                  {g.name}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar" style={{ background: user?.avatarColor }}>{initials}</div>
          <div className="sidebar-user">
            <div className="sidebar-username">{user?.displayName}</div>
            <div className="sidebar-handle">@{user?.username}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Out</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
