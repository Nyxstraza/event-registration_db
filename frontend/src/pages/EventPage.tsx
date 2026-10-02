import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api, fmtDate } from '../api';
import { useAuth } from '../AuthContext';
import { EventItem } from '../types';

export default function EventPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate(); // Initialize navigate hook
  const [event, setEvent] = useState<EventItem | null>(null);
  const [form, setForm] = useState({ full_name: user?.name || '', contact: '', reason: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api<EventItem>(`/events/${id}`).then(setEvent).catch((e) => setError(e.message));
  }, [id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      await api(`/events/${id}/register`, 'POST', form);
      setMsg('Registration submitted. Wait for the admin to approve it; check My Event Registrations.');
      
      // Redirect to the home page after successful submission
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!event) return <p className={error ? 'error' : ''}>{error || 'Loading...'}</p>;

  return (
    <div className="narrow">
      <img className="banner" src={event.image_url} alt={event.title} />
      <h1>{event.title}</h1>
      <p className="muted">{fmtDate(event.event_date)} | {event.approved_count} / {event.max_participants} participants</p>
      <p>{event.description}</p>

      <div className="card-box">
        <h2>Registration Form</h2>
        {!user ? (
          <p>You need an account to register. <Link to="/signup">Create an account</Link> or <Link to="/login">log in</Link>.</p>
        ) : (
          <form onSubmit={submit}>
            <label>Full name</label>
            <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <label>Contact number or school email</label>
            <input required value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <label>Why do you want to join?</label>
            <textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            {error && <p className="error">{error}</p>}
            {msg && <p className="success">{msg}</p>}
            <button type="submit">Submit Registration</button>
          </form>
        )}
      </div>
    </div>
  );
}