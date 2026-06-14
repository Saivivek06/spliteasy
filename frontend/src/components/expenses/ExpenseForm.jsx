import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const SPLIT_TYPES = ['equal', 'unequal', 'percentage', 'share'];

export default function ExpenseForm({ group, currentUser, onClose, onCreated }) {
  const toast = useToast();
  const members = group.members.map(m => m.user);

  const [form, setForm] = useState({
    description: '',
    amount: '',
    splitType: 'equal',
    paidById: currentUser.id,
  });
  const [selectedMembers, setSelectedMembers] = useState(members.map(m => m.id));
  const [splitData, setSplitData] = useState({});
  const [loading, setLoading] = useState(false);

  const toggleMember = (id) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const updateSplitData = (userId, value) => {
    setSplitData(prev => ({ ...prev, [userId]: value }));
  };

  const getSplitLabel = () => {
    if (form.splitType === 'equal' || !form.amount || !selectedMembers.length) return null;
    const amt = parseFloat(form.amount) || 0;
    if (form.splitType === 'unequal') {
      const total = selectedMembers.reduce((s, id) => s + (parseFloat(splitData[id]) || 0), 0);
      const remaining = (amt - total).toFixed(2);
      return { text: `Remaining: ₹${remaining}`, ok: Math.abs(parseFloat(remaining)) < 0.01 };
    }
    if (form.splitType === 'percentage') {
      const total = selectedMembers.reduce((s, id) => s + (parseFloat(splitData[id]) || 0), 0);
      const remaining = (100 - total).toFixed(1);
      return { text: `Remaining: ${remaining}%`, ok: Math.abs(parseFloat(remaining)) < 0.01 };
    }
    if (form.splitType === 'share') {
      const total = selectedMembers.reduce((s, id) => s + (parseFloat(splitData[id]) || 1), 0);
      return { text: `Total shares: ${total}`, ok: true };
    }
  };

  const hint = getSplitLabel();

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedMembers.length) { toast.error('Select at least one member'); return; }
    if (hint && !hint.ok) { toast.error(hint.text); return; }
    setLoading(true);
    try {
      await api.post('/expenses', {
        groupId: group.id,
        description: form.description,
        amount: parseFloat(form.amount),
        splitType: form.splitType,
        paidById: parseInt(form.paidById),
        memberIds: selectedMembers,
        splitData,
      });
      toast.success('Expense added');
      onCreated();
    } catch (err) {
      toast.error(err.error || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Add Expense</h2>
        <form onSubmit={submit}>
          <div className="field">
            <label className="label">Description</label>
            <input className="input" placeholder="Dinner, Uber, Hotel…" value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="label">Amount (₹)</label>
              <input className="input" type="number" min="0.01" step="0.01" placeholder="0.00"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="field">
              <label className="label">Paid by</label>
              <select className="input" value={form.paidById}
                onChange={e => setForm({ ...form, paidById: e.target.value })}>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.id === currentUser.id ? 'You' : m.displayName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label className="label">Split Type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SPLIT_TYPES.map(t => (
                <button key={t} type="button"
                  className={`btn btn-sm ${form.splitType === t ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setForm({ ...form, splitType: t })}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="label">Split Among</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" checked={selectedMembers.includes(m.id)}
                    onChange={() => toggleMember(m.id)} id={`m-${m.id}`} />
                  <label htmlFor={`m-${m.id}`} style={{ flex: 1, fontSize: 14, cursor: 'pointer' }}>
                    <div className="avatar avatar-sm" style={{ background: m.avatarColor, display: 'inline-flex', marginRight: 8 }}>
                      {m.displayName[0]}
                    </div>
                    {m.id === currentUser.id ? 'You' : m.displayName}
                  </label>
                  {form.splitType !== 'equal' && selectedMembers.includes(m.id) && (
                    <input
                      className="input"
                      style={{ width: 100 }}
                      type="number"
                      min="0"
                      step={form.splitType === 'share' ? '1' : '0.01'}
                      placeholder={form.splitType === 'percentage' ? '%' : form.splitType === 'share' ? 'shares' : '₹'}
                      value={splitData[m.id] || ''}
                      onChange={e => updateSplitData(m.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
            {hint && (
              <div style={{ marginTop: 10, fontSize: 13, color: hint.ok ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                {hint.text}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding…' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
