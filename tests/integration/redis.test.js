/**
 * Integration Test: Upstash Redis
 *
 * Verifies that the Upstash Redis instance is reachable and credentials are valid.
 * Loads REDIS_URL from services/feed-service/.env
 * Does NOT require any local services to be running.
 *
 * Uses the Upstash REST API (HTTPS) for verification — avoids Redis protocol
 * port 6380 which may be blocked by firewalls in some environments.
 * The service itself (feed-service) uses ioredis with graceful fallback built-in.
 */
const https = require('https');
const path = require('path');
const { loadEnv } = require('../utils/env-loader');

const envPath = path.resolve(__dirname, '../../services/feed-service/.env');

/**
 * Parse Upstash credentials from any supported URL format.
 */
function parseUpstashCredentials(url) {
  if (!url) return null;
  // rediss://default:PASSWORD@HOST:PORT
  if (url.startsWith('rediss://') || url.startsWith('redis://')) {
    const match = url.match(/^rediss?:\/\/(?:[^:]+:)?([^@]+)@([^:]+)(?::(\d+))?/);
    if (match) return { host: match[2], password: match[1] };
  }
  // https://PASSWORD@HOST
  if (url.startsWith('https://')) {
    const match = url.match(/^https:\/\/([^@]+)@(.+)/);
    if (match) return { host: match[2], password: match[1] };
    return { host: url.replace('https://', ''), password: null };
  }
  return null;
}

/**
 * Upstash REST API PING — uses HTTPS, no port 6380 required.
 * See: https://upstash.com/docs/redis/features/restapi
 */
function upstashRestRequest(host, password, command) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      path: `/${command}`,
      method: 'GET',
      timeout: 12000,
      headers: password ? { Authorization: `Bearer ${password}` } : {},
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ statusCode: res.statusCode, body: data }); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('REST request timed out')); });
    req.on('error', reject);
    req.end();
  });
}

describe('Upstash Redis Integration Tests', () => {
  let env;
  let creds;

  beforeAll(() => {
    env = loadEnv(envPath);
    expect(env.REDIS_URL).toBeDefined();
    creds = parseUpstashCredentials(env.REDIS_URL);
    const preview = env.REDIS_URL.replace(/:(.*?)@/, ':***@');
    console.log(`REDIS_URL: ${preview}`);
  });

  test('REDIS_URL is present in feed-service .env', () => {
    expect(env.REDIS_URL).toBeTruthy();
    console.log('✅ REDIS_URL present');
  });

  test('REDIS_URL contains Upstash host and credentials are parseable', () => {
    expect(creds).not.toBeNull();
    expect(creds.host).toBeTruthy();
    expect(creds.host).toContain('upstash.io');
    expect(creds.password).toBeTruthy();
    console.log(`✅ Upstash host: ${creds.host}`);
  });

  test('Upstash Redis credentials valid — REST API PING returns PONG', async () => {
    const { host, password } = creds;
    const { statusCode, body } = await upstashRestRequest(host, password, 'ping');

    console.log(`  REST PING → HTTP ${statusCode}: ${JSON.stringify(body)}`);
    expect(statusCode).toBe(200);
    // Upstash REST API returns: {"result":"PONG"}
    expect(body.result).toBe('PONG');
    console.log('✅ Upstash REST PING returned PONG — credentials valid');
  });

  test('Upstash Redis REST SET/GET/DEL round-trip works', async () => {
    const { host, password } = creds;
    const ts = Date.now();
    const key = `decp:test:${ts}`;
    const value = `integration-test-${ts}`;

    // SET key value EX 60
    const setRes = await upstashRestRequest(host, password, `set/${key}/${value}/EX/60`);
    console.log(`  SET → HTTP ${setRes.statusCode}: ${JSON.stringify(setRes.body)}`);
    expect(setRes.statusCode).toBe(200);
    expect(setRes.body.result).toBe('OK');

    // GET key
    const getRes = await upstashRestRequest(host, password, `get/${key}`);
    console.log(`  GET → HTTP ${getRes.statusCode}: ${JSON.stringify(getRes.body)}`);
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.result).toBe(value);

    // DEL key
    const delRes = await upstashRestRequest(host, password, `del/${key}`);
    console.log(`  DEL → HTTP ${delRes.statusCode}: ${JSON.stringify(delRes.body)}`);
    expect(delRes.statusCode).toBe(200);
    expect(delRes.body.result).toBe(1);

    console.log('✅ Upstash REST SET/GET/DEL round-trip complete');
  });
});
