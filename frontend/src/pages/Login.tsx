import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { User } from '../types';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await api<{ token: string; user: User }>('/login', 'POST', form);
      signIn(res.token, res.user);
      navigate(res.user.role === 'admin' ? '/admin' : '/');
    } catch (err) { setError((err as Error).message); }
  };

  return (
    <div className="narrow card-box">
      <h1>Login</h1>
      <form onSubmit={submit}>
        <label>Email</label>
        <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label>Password</label>
        <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
      <p>No account yet? <Link to="/signup">Sign up</Link></p>
    </div>
  );
}
