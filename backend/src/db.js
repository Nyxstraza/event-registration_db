const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'event_registration',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

async function initDb() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  for (const stmt of sql.split(';').map((s) => s.trim()).filter(Boolean)) await pool.query(stmt);

  const email = process.env.ADMIN_EMAIL || 'admin@school.edu';
  const [admins] = await pool.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
  if (!admins.length) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES('Admin',?,?,'admin')", [email, hash]);
  }

  const [[{ n }]] = await pool.query('SELECT COUNT(*) n FROM events');
  if (n === 0) {
    await pool.query(
      'INSERT INTO events(title,description,event_date,image_url,max_participants) VALUES ?',
      [[
        ['Annual Science Conference', 'Talks and project showcases from student researchers.', '2026-11-12 09:00:00', 'https://picsum.photos/seed/conference/600/300', 100],
        ['Career Guidance Seminar', 'Meet alumni and learn about career paths after graduation.', '2026-11-20 13:00:00', 'https://picsum.photos/seed/seminar/600/300', 50],
        ['Intramurals Opening', 'Opening ceremony and first games of the school intramurals.', '2026-12-02 08:00:00', 'https://picsum.photos/seed/sports/600/300', 200],
      ]]
    );
  }
}

module.exports = { pool, initDb };
