# DECP Integration Tests

This folder contains integration tests that verify the external services and local running services are correctly configured and accessible.

## Prerequisites

- Node.js 18+
- Internet access (for Auth0, MongoDB Atlas, Upstash Redis, Cloudflare R2 tests)

## Setup

```bash
cd tests
npm install
```

## Running Tests

### All external service tests (no local services needed)
```bash
npm run test:external
```
This runs: Auth0, MongoDB Atlas, Upstash Redis, Cloudflare R2 tests

### Service health tests (requires all 8 services running locally)
```bash
# First start all services in separate terminals:
cd ../services/notification-service && npm run start:dev  # start this FIRST
cd ../services/user-service && npm run start:dev
cd ../services/feed-service && npm run start:dev
cd ../services/job-service && npm run start:dev
cd ../services/event-service && npm run start:dev
cd ../services/research-service && npm run start:dev
cd ../services/analytics-service && npm run start:dev
cd ../services/messaging-service && npm run start:dev

# Then run health tests:
npm run test:health
```

### Run all tests
```bash
npm test
```

## Test Files

| File | What it tests | Needs services? |
|------|---------------|-----------------|
| `integration/auth0.test.js` | Auth0 JWKS endpoint, OpenID config | ❌ No |
| `integration/mongodb.test.js` | MongoDB Atlas connection, ping, all service .env files | ❌ No |
| `integration/redis.test.js` | Upstash Redis connect, SET/GET/DEL round-trip | ❌ No |
| `integration/r2.test.js` | Cloudflare R2 bucket access, upload/delete | ❌ No |
| `integration/services-health.test.js` | All 8 service /api/v1/health endpoints | ✅ Yes |

## Expected Results

All external tests should pass without any local services running.  
The health test gracefully skips services that are not running (does not fail).

## Service Ports

| Service | Port |
|---------|------|
| user-service | 3001 |
| feed-service | 3002 |
| analytics-service | 3003 |
| event-service | 3004 |
| job-service | 3005 |
| notification-service | 3006 |
| messaging-service | 3007 |
| research-service | 3008 |
| web app | 5173 |
