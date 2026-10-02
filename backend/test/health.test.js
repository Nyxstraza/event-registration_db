const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

test('GET /api/health returns ok', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/health`);
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(await res.json(), { status: 'ok' });
  server.close();
});

test('protected route rejects anonymous users', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/my-registrations`);
  assert.strictEqual(res.status, 401);
  server.close();
});

test('unknown API route returns 404', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/not-found`);
  assert.strictEqual(res.status, 404);
  server.close();
});
