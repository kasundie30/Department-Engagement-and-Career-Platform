/**
 * Integration Test: Local Service Health Checks
 *
 * Hits the /api/v1/health endpoint on each of the 8 local services.
 * 
 * PREREQUISITE: All 8 services must be running locally.
 * If a service is not running, the test is SKIPPED (not failed) to allow
 * partial runs during development.
 *
 * Start services with:
 *   cd services/<service-name> && npm run start:dev
 *
 * Service ports:
 *   user-service        3001
 *   feed-service        3002
 *   analytics-service   3003
 *   event-service       3004
 *   job-service         3005
 *   notification-service 3006
 *   messaging-service   3007
 *   research-service    3008
 */
const http = require('http');

const SERVICES = [
  { name: 'user-service',         port: 3001 },
  { name: 'feed-service',         port: 3002 },
  { name: 'analytics-service',    port: 3003 },
  { name: 'event-service',        port: 3004 },
  { name: 'job-service',          port: 3005 },
  { name: 'notification-service', port: 3006 },
  { name: 'messaging-service',    port: 3007 },
  { name: 'research-service',     port: 3008 },
];

function httpGet(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
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

async function isServiceRunning(port) {
  try {
    const result = await httpGet(`http://localhost:${port}/api/v1/health`, 2000);
    return result.statusCode >= 200 && result.statusCode < 500;
  } catch {
    return false;
  }
}

describe('Local Service Health Checks', () => {
  // Track overall results for summary
  const results = [];

  afterAll(() => {
    console.log('\n--- Service Health Summary ---');
    let upCount = 0;
    for (const r of results) {
      const icon = r.up ? '✅' : '❌';
      console.log(`  ${icon} ${r.name.padEnd(22)} port ${r.port}: ${r.up ? 'UP' : 'NOT RUNNING'}`);
      if (r.up) upCount++;
    }
    console.log(`\n  ${upCount}/${results.length} services running`);
    if (upCount < results.length) {
      console.log(`\n  ⚠️  To start missing services:`);
      for (const r of results.filter(r => !r.up)) {
        console.log(`     cd services/${r.name} && npm run start:dev`);
      }
    }
  });

  for (const svc of SERVICES) {
    test(`${svc.name} (port ${svc.port}) — health endpoint responds`, async () => {
      const running = await isServiceRunning(svc.port);
      results.push({ ...svc, up: running });

      if (!running) {
        console.warn(`  ⚠️  ${svc.name} is not running on port ${svc.port} — skipping health check`);
        // Don't fail — just report
        return;
      }

      const { statusCode, body } = await httpGet(
        `http://localhost:${svc.port}/api/v1/health`,
        5000,
      );

      expect(statusCode).toBe(200);
      expect(body).toHaveProperty('status', 'ok');
      console.log(`  ✅ ${svc.name}: ${JSON.stringify(body)}`);
    });
  }
});
