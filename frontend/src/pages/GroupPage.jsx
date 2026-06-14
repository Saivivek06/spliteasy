import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import ExpenseForm from '../components/expenses/ExpenseForm';
import SettleModal from '../components/expenses/SettleModal';
import './GroupPage.css';

const tabs = ['Expenses', 'Balances', 'Settlements', 'Members'];

export default function GroupPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [activeTab, setActiveTab] = useState('Expenses');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [g, e, b, s] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/expenses/group/${id}`),
        api.get(`/groups/${id}/balances`),
        api.get(`/settlements/group/${id}`),
      ]);
      setGroup(g); setExpenses(e); setBalances(b); setSettlements(s);
    } catch {
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/groups/${id}/members`, { username: newUsername });
      toast.success('Member added');
      setNewUsername('');
      setShowAddMember(false);
      fetchAll();
    } catch (err) {
      toast.error(err.error || 'User not found');
    }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/groups/${id}/members/${userId}`);
      toast.success('Member removed');
      fetchAll();
    } catch (err) {
      toast.error(err.error || 'Failed to remove member');
    }
  };

  const deleteExpense = async (expId) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${expId}`);
      toast.success('Expense deleted');
      fetchAll();
    } catch (err) {
      toast.error(err.error || 'Failed to delete');
    }
  };

  const isAdmin = group?.members?.find(m => m.userId === user?.id)?.role === 'admin';

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!group) return <div>Group not found</div>;

  return (
    <div className="group-page">
      <div className="group-header">
        <div className="group-header-left">
          <div className="group-color-dot" style={{ background: group.color }} />
          <div>
            <h1 className="group-title font-display">{group.name}</h1>
            {group.description && <p className="group-desc">{group.description}</p>}
          </div>
        </div>
        <div className="group-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettleModal(true)}>Settle Up</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowExpenseForm(true)}>+ Add Expense</button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'Expenses' && (
        <div className="expense-list">
          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧾</div>
              <h3>No expenses yet</h3>
              <p>Add your first expense to start tracking</p>
            </div>
          ) : expenses.map(exp => (
            <div key={exp.id} className="expense-item" onClick={() => navigate(`/expenses/${exp.id}`)}>
              <div className="expense-icon">💸</div>
              <div className="expense-info">
                <div className="expense-desc">{exp.description}</div>
                <div className="expense-meta">
                  paid by <strong>{exp.paidBy.id === user.id ? 'you' : exp.paidBy.displayName}</strong>
                  · <span className="badge badge-purple">{exp.splitType}</span>
                  · {exp._count?.messages || 0} comments
                </div>
              </div>
              <div className="expense-right">
                <div className="expense-amount">₹{exp.amount.toFixed(2)}</div>
                {isAdmin || exp.paidById === user.id ? (
                  <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); deleteExpense(exp.id); }}>
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Balances' && balances && (
        <div className="balances-section">
          <h3 className="subsection-title">Member Balances</h3>
          <div className="balance-list">
            {balances.memberBalances.map(({ user: u, balance }) => (
              <div key={u.id} className="balance-row">
                <div className="avatar" style={{ background: u.avatarColor }}>{u.displayName[0]}</div>
                <span className="balance-name">{u.id === user.id ? 'You' : u.displayName}</span>
                <span className={`balance-val ${balance > 0 ? 'pos' : balance < 0 ? 'neg' : ''}`}>
                  {balance > 0 ? `+₹${balance.toFixed(2)}` : balance < 0 ? `-₹${Math.abs(balance).toFixed(2)}` : 'Settled'}
                </span>
              </div>
            ))}
          </div>

          {balances.debts.length > 0 && (
            <>
              <h3 className="subsection-title" style={{ marginTop: 28 }}>Who Owes Whom</h3>
              <div className="debt-list">
                {balances.debts.map((d, i) => (
                  <div key={i} className="debt-row">
                    <div className="avatar avatar-sm" style={{ background: d.from.avatarColor }}>{d.from.displayName[0]}</div>
                    <span>{d.from.id === user.id ? 'You' : d.from.displayName}</span>
                    <span className="debt-arrow">→</span>
                    <div className="avatar avatar-sm" style={{ background: d.to.avatarColor }}>{d.to.displayName[0]}</div>
                    <span>{d.to.id === user.id ? 'You' : d.to.displayName}</span>
                    <span className="debt-amount">₹{d.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {balances.debts.length === 0 && (
            <div className="settled-banner">✓ Everyone is settled up in this group!</div>
          )}
        </div>
      )}

      {activeTab === 'Settlements' && (
        <div className="settlement-list">
          {settlements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🤝</div>
              <h3>No settlements yet</h3>
              <p>Record payments when someone settles their debt</p>
            </div>
          ) : settlements.map(s => (
            <div key={s.id} className="settlement-item">
              <div className="avatar" style={{ background: s.from.avatarColor }}>{s.from.displayName[0]}</div>
              <div className="settlement-info">
                <strong>{s.from.id === user.id ? 'You' : s.from.displayName}</strong> paid{' '}
                <strong>{s.to.id === user.id ? 'you' : s.to.displayName}</strong>
                {s.note && <span className="settlement-note"> · {s.note}</span>}
              </div>
              <div className="settlement-amount">₹{s.amount.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Members' && (
        <div className="members-section">
          {isAdmin && (
            <div className="member-add-row">
              {showAddMember ? (
                <form onSubmit={addMember} className="add-member-form">
                  <input className="input" placeholder="Enter username" value={newUsername}
                    onChange={e => setNewUsername(e.target.value)} autoFocus />
                  <button type="submit" className="btn btn-primary btn-sm">Add</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddMember(false)}>Cancel</button>
                </form>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}>+ Add Member</button>
              )}
            </div>
          )}
          <div className="member-list">
            {group.members.map(m => (
              <div key={m.userId} className="member-row">
                <div className="avatar" style={{ background: m.user.avatarColor }}>{m.user.displayName[0]}</div>
                <div className="member-info">
                  <div className="member-name">{m.user.displayName} {m.userId === user.id && '(you)'}</div>
                  <div className="member-username">@{m.user.username}</div>
                </div>
                <span className={`badge ${m.role === 'admin' ? 'badge-purple' : 'badge-amber'}`}>{m.role}</span>
                {isAdmin && m.userId !== user.id && (
                  <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.userId)}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showExpenseForm && (
        <ExpenseForm
          group={group}
          currentUser={user}
          onClose={() => setShowExpenseForm(false)}
          onCreated={() => { fetchAll(); setShowExpenseForm(false); }}
        />
      )}

      {showSettleModal && (
        <SettleModal
          group={group}
          balances={balances}
          currentUser={user}
          onClose={() => setShowSettleModal(false)}
          onSettled={() => { fetchAll(); setShowSettleModal(false); }}
        />
      )}
    </div>
  );
}
