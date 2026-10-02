import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDate } from '../api';
import { EventItem } from '../types';

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api<EventItem[]>('/events').then(setEvents).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <h1>Upcoming School Events</h1>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {events.map((ev) => (
          <Link to={`/events/${ev.id}`} key={ev.id} className="event-card">
            <img src={ev.image_url} alt={ev.title} />
            <div className="event-body">
              <h3>{ev.title}</h3>
              <p className="muted">{fmtDate(ev.event_date)}</p>
              <p>{ev.description}</p>
              <p className="muted">{ev.approved_count} / {ev.max_participants} participants</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
