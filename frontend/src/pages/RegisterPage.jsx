import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import './AuthPage.css';

export default function RegisterPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '' });
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const data = await api.post('/auth/register', form);
      login(data);
      navigate('/');
    } catch (err) {
      toast.error(err.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo font-display">SplitEasy</div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Start splitting expenses with your friends</p>
        <form onSubmit={submit}>
          <div className="field">
            <label className="label">Display Name</label>
            <input className="input" type="text" placeholder="Vivek Singh" value={form.displayName}
              onChange={update('displayName')} required />
          </div>
          <div className="field">
            <label className="label">Username</label>
            <input className="input" type="text" placeholder="vivek" value={form.username}
              onChange={update('username')} required pattern="[a-z0-9_]+" title="lowercase letters, numbers, underscores" />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email}
              onChange={update('email')} required />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="min 6 characters" value={form.password}
              onChange={update('password')} required minLength={6} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
