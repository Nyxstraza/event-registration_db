import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import EventPage from './pages/EventPage';
import MyRegistrations from './pages/MyRegistrations';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Admin from './pages/Admin';
import { useAuth } from './AuthContext';

export default function App() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events/:id" element={<EventPage />} />
          <Route path="/my-registrations" element={user ? <MyRegistrations /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}
