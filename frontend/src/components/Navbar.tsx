import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const close = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-mark">SE</span>
          <span>School Events</span>
        </Link>

        <button className="menu-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? 'Close' : 'Menu'}
        </button>

        <nav className={open ? 'nav open' : 'nav'}>
          <div className="nav-links">
            {user && <NavLink to="/my-registrations" onClick={close}>My Event Registrations</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin" onClick={close}>Admin Panel</NavLink>}
          </div>

          <div className="nav-actions">
            <button
              className="switch"
              role="switch"
              aria-checked={dark}
              onClick={() => setDark(!dark)}
            >
              <span className="switch-track"><span className="switch-thumb" /></span>
              <span>Dark Mode</span>
            </button>

            {!user && <NavLink to="/login" className="nav-btn ghost" onClick={close}>Login</NavLink>}
            {!user && <NavLink to="/signup" className="nav-btn solid" onClick={close}>Sign Up</NavLink>}

            {user && (
              <div className="user-chip">
                <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="user-text">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">{user.role === 'admin' ? 'Administrator' : 'Student'}</span>
                </span>
              </div>
            )}
            {user && (
              <button className="nav-btn ghost" onClick={() => { close(); signOut(); navigate('/'); }}>
                Logout
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
