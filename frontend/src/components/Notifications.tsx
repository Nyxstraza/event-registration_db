import { useEffect, useState } from 'react';
import { api, fmtDate } from '../api';
import { Notice } from '../types';

export default function Notifications() {
  const [items, setItems] = useState<Notice[]>([]);

  useEffect(() => {
    api<Notice[]>('/notifications').then((data) => {
      setItems(data);
      if (data.some((n) => !n.is_read)) api('/notifications/read', 'POST');
    }).catch(() => {});
  }, []);

  return (
    <section className="card-box">
      <h2>Notifications</h2>
      {items.length === 0 && <p className="muted">No notifications.</p>}
      {items.map((n) => (
        <p key={n.id} className={n.is_read ? 'note' : 'note unread'}>
          {n.message} <span className="muted">{fmtDate(n.created_at)}</span>
        </p>
      ))}
    </section>
  );
}
