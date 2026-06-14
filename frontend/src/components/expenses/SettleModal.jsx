import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

export default function SettleModal({ group, balances, currentUser, onClose, onSettled }) {
  const toast = useToast();
  const [form, setForm] = useState({ toId: '', amount: '', note: '' });
  const [loading, setLoading] = useState(false);

  const otherMembers = group.members.filter(m => m.userId !== currentUser.id).map(m => m.user);

  // Pre-fill if current user owes someone
  const myDebt = balances?.debts?.find(d => d.from.id === currentUser.id);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.toId || !form.amount) { toast.error('Fill all fields'); return; }
    setLoading(true);
    try {
      await api.post('/settlements', {
        groupId: group.id,
        toId: parseInt(form.toId),
        amount: parseFloat(form.amount),
        note: form.note,
      });
      toast.success('Payment recorded');
      onSettled();
    } catch (err) {
      toast.error(err.error || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Settle Up</h2>

        {myDebt && (
          <div style={{ padding: '12px 16px', background: '#f8717111', border: '1px solid #f8717133', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: 14 }}>
            You owe <strong>{myDebt.to.displayName}</strong> ₹{myDebt.amount.toFixed(2)}
            <button className="btn btn-sm" style={{ marginLeft: 12, background: 'var(--accent)', color: '#fff', padding: '4px 10px' }}
              onClick={() => setForm({ toId: myDebt.to.id, amount: myDebt.amount.toFixed(2), note: '' })}>
              Fill
            </button>
          </div>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label className="label">Paying to</label>
            <select className="input" value={form.toId} onChange={e => setForm({ ...form, toId: e.target.value })} required>
              <option value="">Select person</option>
              {otherMembers.map(m => (
                <option key={m.id} value={m.id}>{m.displayName}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Amount (₹)</label>
            <input className="input" type="number" min="0.01" step="0.01" placeholder="0.00"
              value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div className="field">
            <label className="label">Note (optional)</label>
            <input className="input" placeholder="Via UPI, cash…" value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Recording…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
