CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  event_date DATETIME NOT NULL,
  image_url VARCHAR(500),
  max_participants INT NOT NULL DEFAULT 50
);

CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  contact VARCHAR(100) NOT NULL,
  reason TEXT,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY one_per_event (event_id, user_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(300) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed sample events for local testing / the live demo
INSERT INTO events (title, description, event_date, image_url, max_participants) VALUES
  ('Annual Science Conference', 'Talks and project showcases from student researchers.', '2026-11-12 09:00:00', 'https://picsum.photos/seed/conference/600/300', 100),
  ('Career Guidance Seminar', 'Meet alumni and learn about career paths after graduation.', '2026-11-20 13:00:00', 'https://picsum.photos/seed/seminar/600/300', 50),
  ('Intramurals Opening', 'Opening ceremony and first games of the school intramurals.', '2026-12-02 08:00:00', 'https://picsum.photos/seed/sports/600/300', 200);
