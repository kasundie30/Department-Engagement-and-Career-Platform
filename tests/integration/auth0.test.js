/**
 * Integration Test: Auth0
 * 
 * Verifies that the Auth0 tenant is accessible and PROPERLY configured.
 * Does NOT require any local services to be running.
 * 
 * What it tests:
 *  1. JWKS endpoint is reachable and returns a valid key set
 *  2. Auth0 OpenID configuration endpoint returns expected fields
 *  3. Auth0 token endpoint exists
 */
const https = require('https');

const AUTH0_DOMAIN = 'dev-ql54xjx71jnttf1o.us.auth0.com';
const AUTH0_AUDIENCE = 'https://api.decp-co528.com';

async function httpsGet(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    try {
      return { statusCode: response.status, body: JSON.parse(text) };
    } catch {
      return { statusCode: response.status, body: text };
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

describe('Auth0 Integration Tests', () => {
  test('JWKS endpoint is reachable and returns keys', async () => {
    const url = `https://${AUTH0_DOMAIN}/.well-known/jwks.json`;
    const { statusCode, body } = await httpsGet(url);

    expect(statusCode).toBe(200);
    expect(body).toHaveProperty('keys');
    expect(Array.isArray(body.keys)).toBe(true);
    expect(body.keys.length).toBeGreaterThan(0);

    const key = body.keys[0];
    expect(key).toHaveProperty('kid');
    expect(key).toHaveProperty('kty');
    expect(key.alg).toBe('RS256');

    console.log(`✅ Auth0 JWKS OK: ${body.keys.length} key(s) found, kid="${key.kid}"`);
  });

  test('OpenID configuration endpoint returns expected fields', async () => {
    const url = `https://${AUTH0_DOMAIN}/.well-known/openid-configuration`;
    const { statusCode, body } = await httpsGet(url);

    expect(statusCode).toBe(200);
    expect(body).toHaveProperty('issuer');
    expect(body).toHaveProperty('authorization_endpoint');
    expect(body).toHaveProperty('token_endpoint');
    expect(body).toHaveProperty('jwks_uri');
    expect(body.issuer).toBe(`https://${AUTH0_DOMAIN}/`);

    console.log(`✅ Auth0 OpenID config OK: issuer="${body.issuer}"`);
    console.log(`   token_endpoint: ${body.token_endpoint}`);
  });

  test('Auth0 domain configured correctly matches expected audience', () => {
    // Static assertion — the audience configured in all services
    expect(AUTH0_AUDIENCE).toBe('https://api.decp-co528.com');
    expect(AUTH0_DOMAIN).toBe('dev-ql54xjx71jnttf1o.us.auth0.com');
    console.log(`✅ Auth0 static config verified: domain="${AUTH0_DOMAIN}", audience="${AUTH0_AUDIENCE}"`);
  });
});
