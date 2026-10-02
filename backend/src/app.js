const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('./db');

const SECRET = process.env.JWT_SECRET || 'dev-secret';
const app = express();
app.use(cors());
app.use(express.json());

// helpers
const h = (fn) => (req, res) => fn(req, res).catch((e) => { console.error(e); res.status(500).json({ error: 'Server error' }); });
const session = (u) => ({
  token: jwt.sign({ id: u.id, name: u.name, role: u.role }, SECRET, { expiresIn: '8h' }),
  user: { id: u.id, name: u.name, role: u.role },
});
const auth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET); next(); }
  catch { res.status(401).json({ error: 'Please log in first' }); }
};
const admin = (req, res, next) => (req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admins only' }));
const notify = (userId, message) => pool.query('INSERT INTO notifications(user_id,message) VALUES(?,?)', [userId, message]);
const notifyAdmins = (message) => pool.query("INSERT INTO notifications(user_id,message) SELECT id,? FROM users WHERE role='admin'", [message]);

const EVENT_SELECT = `SELECT e.*, (SELECT COUNT(*) FROM registrations r WHERE r.event_id=e.id AND r.status='approved') AS approved_count FROM events e`;

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ---- auth ----
app.post('/api/signup', h(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ error: 'Name, email and a password of at least 6 characters are required' });
  try {
    const [r] = await pool.query('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)', [name, email, await bcrypt.hash(password, 10)]);
    res.json(session({ id: r.insertId, name, role: 'user' }));
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email is already registered' });
    throw e;
  }
}));

app.post('/api/login', h(async (req, res) => {
  const { email, password } = req.body;
  const [[u]] = await pool.query('SELECT * FROM users WHERE email=?', [email]);
  if (!u || !(await bcrypt.compare(password || '', u.password_hash))) return res.status(401).json({ error: 'Wrong email or password' });
  res.json(session(u));
}));

// ---- events ----
app.get('/api/events', h(async (req, res) => {
  const [rows] = await pool.query(`${EVENT_SELECT} ORDER BY e.event_date`);
  res.json(rows);
}));

app.get('/api/events/:id', h(async (req, res) => {
  const [[row]] = await pool.query(`${EVENT_SELECT} WHERE e.id=?`, [req.params.id]);
  row ? res.json(row) : res.status(404).json({ error: 'Event not found' });
}));

const eventFields = (b) => [b.title, b.description || '', b.event_date, b.image_url || '', Number(b.max_participants) || 50];

app.post('/api/events', auth, admin, h(async (req, res) => {
  if (!req.body.title || !req.body.event_date) return res.status(400).json({ error: 'Title and date are required' });
  await pool.query('INSERT INTO events(title,description,event_date,image_url,max_participants) VALUES(?,?,?,?,?)', eventFields(req.body));
  res.json({ ok: true });
}));

app.put('/api/events/:id', auth, admin, h(async (req, res) => {
  await pool.query('UPDATE events SET title=?,description=?,event_date=?,image_url=?,max_participants=? WHERE id=?', [...eventFields(req.body), req.params.id]);
  res.json({ ok: true });
}));

app.delete('/api/events/:id', auth, admin, h(async (req, res) => {
  await pool.query('DELETE FROM events WHERE id=?', [req.params.id]);
  res.json({ ok: true });
}));

// ---- registrations (user) ----
app.post('/api/events/:id/register', auth, h(async (req, res) => {
  const { full_name, contact, reason } = req.body;
  if (!full_name || !contact) return res.status(400).json({ error: 'Full name and contact are required' });
  try {
    await pool.query('INSERT INTO registrations(event_id,user_id,full_name,contact,reason) VALUES(?,?,?,?,?)', [req.params.id, req.user.id, full_name, contact, reason || '']);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'You already registered for this event' });
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(404).json({ error: 'Event not found' });
    throw e;
  }
}));

app.get('/api/my-registrations', auth, h(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.status, r.created_at, e.id AS event_id, e.title, e.event_date
     FROM registrations r JOIN events e ON e.id=r.event_id WHERE r.user_id=? ORDER BY r.created_at DESC`, [req.user.id]);
  res.json(rows);
}));

// ---- notifications ----
app.get('/api/notifications', auth, h(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC, id DESC LIMIT 30', [req.user.id]);
  res.json(rows);
}));

app.post('/api/notifications/read', auth, h(async (req, res) => {
  await pool.query('UPDATE notifications SET is_read=1 WHERE user_id=?', [req.user.id]);
  res.json({ ok: true });
}));

// ---- admin ----
app.get('/api/admin/registrations', auth, admin, h(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.full_name, r.contact, r.reason, r.status, r.created_at, e.title AS event_title, u.email
     FROM registrations r JOIN events e ON e.id=r.event_id JOIN users u ON u.id=r.user_id ORDER BY r.created_at DESC`);
  res.json(rows);
}));

app.put('/api/admin/registrations/:id', auth, admin, h(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const [[reg]] = await pool.query(
    'SELECT r.*, e.title, e.max_participants FROM registrations r JOIN events e ON e.id=r.event_id WHERE r.id=?', [req.params.id]);
  if (!reg) return res.status(404).json({ error: 'Registration not found' });

  let final = status;
  let approvedCount = 0;
  if (status === 'approved' && reg.status !== 'approved') {
    const [[c]] = await pool.query("SELECT COUNT(*) n FROM registrations WHERE event_id=? AND status='approved'", [reg.event_id]);
    approvedCount = c.n;
    if (approvedCount >= reg.max_participants) final = 'rejected'; // event is full
  }
  await pool.query('UPDATE registrations SET status=? WHERE id=?', [final, reg.id]);

  if (final === 'approved') {
    await notify(reg.user_id, `Your registration for "${reg.title}" was approved.`);
    if (approvedCount + 1 >= reg.max_participants)
      await notifyAdmins(`"${reg.title}" has reached its maximum of ${reg.max_participants} participants.`);
  } else if (status === 'approved') {
    await notify(reg.user_id, `Your registration for "${reg.title}" was rejected because the event is full.`);
  } else {
    await notify(reg.user_id, `Your registration for "${reg.title}" was rejected.`);
  }
  res.json({ status: final, message: final !== status ? 'Event is full, registration was rejected' : 'Updated' });
}));

app.get('/api/admin/report', auth, admin, h(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT e.id, e.title, e.event_date, e.max_participants,
       COUNT(r.id) AS total,
       COALESCE(SUM(r.status='pending'),0) AS pending,
       COALESCE(SUM(r.status='approved'),0) AS approved,
       COALESCE(SUM(r.status='rejected'),0) AS rejected
     FROM events e LEFT JOIN registrations r ON r.event_id=e.id GROUP BY e.id ORDER BY e.event_date`);
  res.json(rows.map((r) => ({ ...r, total: Number(r.total), pending: Number(r.pending), approved: Number(r.approved), rejected: Number(r.rejected) })));
}));

// Delete a user's registration
app.delete('/api/registrations/:id', auth, h(async (req, res) => {
  const registrationId = req.params.id;
  
  // Ensure the registration belongs to the logged-in user
  const [result] = await pool.query(
    'DELETE FROM registrations WHERE id = ? AND user_id = ?',
    [registrationId, req.user.id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Registration not found or not authorized to delete' });
  }

  res.json({ ok: true });
}));

module.exports = app;
