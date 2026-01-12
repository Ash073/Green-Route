import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { connectDB, disconnectDB } from '../db.js';

let mongoServer;
let tokens;

before(async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDB(uri, 'testdb');

  // Create a user and login
  const signup = await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Trip User', email: 'trip@example.com', password: 'password123' });
  tokens = { access: signup.body.accessToken };
});

after(async () => {
  await disconnectDB();
  if (mongoServer) await mongoServer.stop();
});

test('POST /api/trips/save should save a trip', async () => {
  const tripData = {
    origin: { name: 'A', coordinates: { lng: 72.8, lat: 19.0 } },
    destination: { name: 'B', coordinates: { lng: 73.0, lat: 19.1 } },
    selectedRoute: { distance: 5000, duration: 300, emission: 1.2, ecoScore: 80, mode: 'driving' },
    emissionSavings: { amount: 0.5, percentage: 10 }
  };

  const res = await request(app)
    .post('/api/trips/save')
    .set('Authorization', `Bearer ${tokens.access}`)
    .send(tripData);

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.trip && res.body.trip._id);
});

test('GET /api/trips/stats/:userId should return stats', async () => {
  // Get current user
  const me = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${tokens.access}`);

  const userId = me.body.user?._id;
  assert.ok(userId);

  const statsRes = await request(app)
    .get(`/api/trips/stats/${userId}`)
    .set('Authorization', `Bearer ${tokens.access}`);

  assert.equal(statsRes.status, 200);
  assert.equal(statsRes.body.success, true);
  assert.ok(typeof statsRes.body.stats.totalTrips === 'number');
});
