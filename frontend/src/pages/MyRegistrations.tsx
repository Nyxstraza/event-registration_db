import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDate } from '../api';

interface RegistrationItem {
  id: number;
  event_id: number;
  title: string;
  event_date: string;
  status: string;
  full_name: string;
  contact: string;
  reason: string;
}

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const data = await api<RegistrationItem[]>('/my-registrations');
      setRegistrations(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel/delete this registration?')) {
      return;
    }

    try {
      // Call backend API to delete the registration
      await api(`/registrations/${id}`, 'DELETE');
      
      // Update local state to instantly remove it from the UI
      setRegistrations(registrations.filter((reg) => reg.id !== id));
    } catch (err) {
      alert((err as Error).message || 'Failed to delete registration.');
    }
  };

  if (loading) return <p>Loading your registrations...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="narrow">
      <h1>My Event Registrations</h1>
      {registrations.length === 0 ? (
        <p>You have not registered for any events yet. <Link to="/">Browse events</Link></p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {registrations.map((reg) => (
            <div key={reg.id} className="card-box" style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
              <h3>{reg.title}</h3>
              <p className="muted">Event Date: {fmtDate(reg.event_date)}</p>
              <p><strong>Status:</strong> {reg.status}</p>
              <p><strong>Full Name:</strong> {reg.full_name}</p>
              <p><strong>Contact:</strong> {reg.contact}</p>
              {reg.reason && <p><strong>Reason:</strong> {reg.reason}</p>}
              
              <button 
                onClick={() => handleDelete(reg.id)} 
                style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', marginTop: '8px' }}
              >
                Cancel Registration
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}