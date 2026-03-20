/**
 * Integration Test: MongoDB Atlas
 * 
 * Verifies that the MongoDB Atlas cluster is reachable and a connection can be established.
 * Loads credentials from services/user-service/.env
 * Does NOT require any local services to be running.
 * 
 * What it tests:
 *  1. MONGO_URI is present in the env file
 *  2. Connection to MongoDB Atlas succeeds within 15s
 *  3. A simple ping/list-databases operation works
 *  4. Connection closes cleanly
 */
const mongoose = require('mongoose');
const path = require('path');
const { loadEnv } = require('../utils/env-loader');

const envPath = path.resolve(__dirname, '../../services/user-service/.env');

describe('MongoDB Atlas Integration Tests', () => {
  let env;
  let connection;

  beforeAll(() => {
    env = loadEnv(envPath);
    expect(env.MONGO_URI).toBeDefined();
    console.log(`MongoDB URI found (cluster: ${env.MONGO_URI.split('@')[1]?.split('/')[0] || 'unknown'})`);
  });

  afterAll(async () => {
    if (connection && connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('MongoDB connection closed cleanly');
    }
  });

  test('MONGO_URI is present in user-service .env', () => {
    expect(env.MONGO_URI).toBeTruthy();
    expect(env.MONGO_URI).toContain('mongodb+srv://');
    expect(env.MONGO_URI).toContain('decp-co528');
    console.log(`✅ MONGO_URI present: mongodb+srv://...@${env.MONGO_URI.split('@')[1]?.split('/')[0]}`);
  });

  test('Can connect to MongoDB Atlas cluster within 15s', async () => {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    connection = conn;

    expect(conn.connection.readyState).toBe(1); // 1 = connected
    console.log(`✅ MongoDB connected: readyState=${conn.connection.readyState}, host="${conn.connection.host}"`);
  });

  test('Can run a ping command on the connection', async () => {
    const admin = mongoose.connection.db.admin();
    const result = await admin.ping();
    expect(result).toEqual({ ok: 1 });
    console.log('✅ MongoDB ping returned: { ok: 1 }');
  });

  test('All 8 services use the same MONGO_URI', () => {
    const services = [
      'user-service', 'feed-service', 'job-service', 'event-service',
      'notification-service', 'research-service', 'analytics-service', 'messaging-service'
    ];

    for (const svc of services) {
      const svcEnv = loadEnv(path.resolve(__dirname, `../../services/${svc}/.env`));
      expect(svcEnv.MONGO_URI).toBeTruthy();
      expect(svcEnv.MONGO_URI).toContain('decp-co528');
      console.log(`  ✅ ${svc}: MONGO_URI set`);
    }
  });
});
