import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { connectDB, disconnectDB } from '../db.js';

let mongoServer;

before(async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDB(uri, 'testdb');
});

after(async () => {
  await disconnectDB();
  if (mongoServer) await mongoServer.stop();
});

test('POST /api/auth/signup should create a user and return tokens', async () => {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.user);
  assert.ok(res.body.accessToken);
  assert.ok(res.body.refreshToken);
});

test('POST /api/auth/login should login and return tokens', async () => {
  // Ensure user exists
  await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Tester', email: 'login@example.com', password: 'password123' });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'login@example.com', password: 'password123' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.accessToken);
  assert.ok(res.body.refreshToken);
});
