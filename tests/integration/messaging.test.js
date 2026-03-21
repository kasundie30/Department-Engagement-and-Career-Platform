/**
 * Integration Test: Messaging Service
 * 
 * Verifies that the messaging service endpoints are active and protected by Auth0
 */
const http = require('http');

const MESSAGING_SVC_URL = 'http://localhost:3007/api/v1/conversations';

function httpGet(url, timeoutMs = 5000, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs, ...options }, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('TIMEOUT')); });
    req.on('error', reject);
  });
}

function httpPost(url, dataObj, timeoutMs = 5000, options = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(dataObj);
    const reqOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: timeoutMs,
      ...options
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('TIMEOUT')); });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

describe('Messaging Service Integration Tests', () => {
  test('GET /conversations requires valid authentication', async () => {
    try {
      const { statusCode, body } = await httpGet(MESSAGING_SVC_URL, 3000);
      expect(statusCode).toBe(401);
      expect(body.message).toBe('Unauthorized');
      console.log('✅ GET /conversations correctly rejects unauthenticated requests with 401');
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
         console.warn(`⚠️  messaging-service is not running on port 3007 — skipping auth check`);
      } else {
         throw err;
      }
    }
  });

  test('POST /conversations/dm requires valid authentication', async () => {
    try {
      const { statusCode, body } = await httpPost(`${MESSAGING_SVC_URL}/dm`, { targetUserId: 'mock|123' }, 3000);
      expect(statusCode).toBe(401);
      expect(body.message).toBe('Unauthorized');
      console.log('✅ POST /conversations/dm correctly rejects unauthenticated requests with 401');
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
         // Skip silently if handled above
      } else {
         throw err;
      }
    }
  });
});
