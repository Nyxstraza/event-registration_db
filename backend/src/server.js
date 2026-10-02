const app = require('./app');
const { initDb } = require('./db');

const port = process.env.PORT || 3000;

(async () => {
  for (let i = 0; i < 20; i++) { // wait for MySQL to come up
    try { await initDb(); break; }
    catch (e) { console.log('Waiting for database...', e.code || e.message); await new Promise((r) => setTimeout(r, 3000)); }
  }
  app.listen(port, () => console.log(`API running on port ${port}`));
})();
