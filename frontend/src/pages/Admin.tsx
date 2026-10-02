import { FormEvent, useEffect, useState } from 'react';
import { api, fmtDate } from '../api';
import Notifications from '../components/Notifications';
import { EventItem, Status } from '../types';

interface Reg { id: number; full_name: string; contact: string; reason: string; status: Status; event_title: string; email: string; }
interface ReportRow { id: number; title: string; event_date: string; max_participants: number; total: number; pending: number; approved: number; rejected: number; }
interface EventForm { id?: number; title: string; description: string; event_date: string; image_url: string; max_participants: number; }

const empty: EventForm = { title: '', description: '', event_date: '', image_url: '', max_participants: 50 };

export default function Admin() {
  const [tab, setTab] = useState<'events' | 'registrations' | 'report'>('events');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [regs, setRegs] = useState<Reg[]>([]);
  const [report, setReport] = useState<ReportRow[]>([]);
  const [form, setForm] = useState<EventForm>(empty);
  const [msg, setMsg] = useState('');

  const load = () => {
    api<EventItem[]>('/events').then(setEvents);
    api<Reg[]>('/admin/registrations').then(setRegs);
    api<ReportRow[]>('/admin/report').then(setReport);
  };
  useEffect(load, []);

  const saveEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (form.id) await api(`/events/${form.id}`, 'PUT', form);
    else await api('/events', 'POST', form);
    setForm(empty);
    load();
  };

  const editEvent = (ev: EventItem) =>
    setForm({ id: ev.id, title: ev.title, description: ev.description, event_date: ev.event_date.slice(0, 16).replace(' ', 'T'), image_url: ev.image_url, max_participants: ev.max_participants });

  const deleteEvent = async (id: number) => {
    if (!confirm('Delete this event and its registrations?')) return;
    await api(`/events/${id}`, 'DELETE');
    load();
  };

  const decide = async (id: number, status: 'approved' | 'rejected') => {
    const res = await api<{ message: string }>(`/admin/registrations/${id}`, 'PUT', { status });
    setMsg(res.message);
    load();
  };

  return (
    <>
      <h1>Admin Panel</h1>
      <Notifications />
      <div className="tabs">
        {(['events', 'registrations', 'report'] as const).map((t) => (
          <button key={t} className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>
            {t === 'events' ? 'Events' : t === 'registrations' ? 'Registrations' : 'Report'}
          </button>
        ))}
      </div>

      {tab === 'events' && (
        <>
          <form className="card-box" onSubmit={saveEvent}>
            <h2>{form.id ? 'Edit Event' : 'Add Event'}</h2>
            <label>Name</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <label>Date and time</label>
            <input type="datetime-local" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            <label>Image URL</label>
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <label>Maximum participants</label>
            <input type="number" min={1} required value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: Number(e.target.value) })} />
            <div className="row">
              <button type="submit">{form.id ? 'Update' : 'Add'}</button>
              {form.id && <button type="button" className="secondary" onClick={() => setForm(empty)}>Cancel</button>}
            </div>
          </form>
          <table>
            <thead><tr><th>Name</th><th>Date</th><th>Participants</th><th></th></tr></thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td>{ev.title}</td>
                  <td>{fmtDate(ev.event_date)}</td>
                  <td>{ev.approved_count} / {ev.max_participants}</td>
                  <td className="row">
                    <button className="secondary" onClick={() => editEvent(ev)}>Edit</button>
                    <button className="danger" onClick={() => deleteEvent(ev.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === 'registrations' && (
        <>
          {msg && <p className="success">{msg}</p>}
          <table>
            <thead><tr><th>Event</th><th>Name</th><th>Contact</th><th>Reason</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {regs.map((r) => (
                <tr key={r.id}>
                  <td>{r.event_title}</td>
                  <td>{r.full_name}<br /><span className="muted">{r.email}</span></td>
                  <td>{r.contact}</td>
                  <td>{r.reason}</td>
                  <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                  <td className="row">
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => decide(r.id, 'approved')}>Approve</button>
                        <button className="danger" onClick={() => decide(r.id, 'rejected')}>Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {regs.length === 0 && <tr><td colSpan={6} className="muted">No registrations yet.</td></tr>}
            </tbody>
          </table>
        </>
      )}

      {tab === 'report' && (
        <>
          <button className="secondary" onClick={() => window.print()}>Print Report</button>
          <table>
            <thead><tr><th>Event</th><th>Date</th><th>Max</th><th>Total</th><th>Pending</th><th>Approved</th><th>Rejected</th></tr></thead>
            <tbody>
              {report.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td><td>{fmtDate(r.event_date)}</td><td>{r.max_participants}</td>
                  <td>{r.total}</td><td>{r.pending}</td><td>{r.approved}</td><td>{r.rejected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
