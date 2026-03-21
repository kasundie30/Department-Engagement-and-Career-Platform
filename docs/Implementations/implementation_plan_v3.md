# Implementation Plan V3 — Verify, Test & Run Locally

**Project**: Department Engagement and Career Platform (DECP)  
**Date**: March 20, 2026  
**Scope**: Verify all external service integrations, fix bugs, create integration tests, run system locally

---

## Background

All external services have been configured across two previous phases:
- **MongoDB Atlas** cluster `DECP-CO528` exists and credentials are in all [.env](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/user-service/.env) files
- **Auth0** tenant `dev-ql54xjx71jnttf1o.us.auth0.com` with SPA + API configured
- **Upstash Redis** at `magical-amoeba-78196.upstash.io` configured in feed-service
- **Cloudflare R2** bucket `decp-co528` configured in feed-service + research-service
- All 8 service [.env](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/user-service/.env) files + web app [.env.development](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/web/.env.development) exist with real values
- Dependencies (`node_modules`) are installed in all services

## Known Issues Found

| Issue | Severity | Fix |
|-------|----------|-----|
| [messaging-service/src/main.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/messaging-service/src/main.ts) defaults to port `3000` instead of `3007` | HIGH | Change `3000` → `3007` |
| No `/tests` folder exists with integration tests | HIGH | Create `/tests` with full suite |
| Existing tests in services are just Hello World stubs | MEDIUM | Keep them, add proper ones in `/tests` |

---

## Proposed Changes

### Bug Fix

#### [MODIFY] [main.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/messaging-service/src/main.ts)
- Change default port fallback `3000` → `3007`

---

### New `/tests` Folder

#### [NEW] tests/package.json
- Dependencies: `jest`, `dotenv`, `axios`, `mongoose`, `ioredis`, `@aws-sdk/client-s3`
- Scripts: `test`, `test:verbose`

#### [NEW] tests/jest.config.js
- Configured for `*.test.js` files, 30s timeout (for external service calls)

#### [NEW] tests/utils/env-loader.js
- Helper to load [.env](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/user-service/.env) from a service directory path

#### [NEW] tests/integration/auth0.test.js
- Verifies Auth0 JWKS endpoint is reachable (`GET https://dev-ql54xjx71jnttf1o.us.auth0.com/.well-known/jwks.json`)
- Verifies response contains [keys](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/feed-service/src/redis/redis.service.ts#68-77) array
- Verifies token endpoint exists

#### [NEW] tests/integration/mongodb.test.js
- Loads `MONGO_URI` from [services/user-service/.env](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/user-service/.env)
- Connects to MongoDB Atlas using `mongoose`
- Verifies connect event fires within 10s
- Disconnects cleanly

#### [NEW] tests/integration/redis.test.js
- Loads `REDIS_URL` from [services/feed-service/.env](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/feed-service/.env)
- Connects to Upstash Redis using `ioredis`
- Performs `SET`, `GET`, `DEL` round-trip test
- Verifies round-trip works

#### [NEW] tests/integration/r2.test.js
- Loads R2 credentials from [services/feed-service/.env](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/feed-service/.env)
- Creates S3Client pointing to Cloudflare R2
- Lists objects in the `decp-co528` bucket using `ListObjectsV2Command`
- Verifies response is a valid S3 response

#### [NEW] tests/integration/services-health.test.js
- Hits `GET http://localhost:{PORT}/api/v1/health` for all 8 services
- Reports which services are up/down
- **Note**: Services must be running locally for this test

#### [NEW] tests/README.md
- Instructions for running all test suites

---

## Verification Plan

### Automated Tests

#### 1. Integration Tests (no running services needed)
```powershell
cd tests
npm install
npm test -- --testPathPattern="auth0|mongodb|redis|r2"
```
Expected: All 4 external service integration tests pass

#### 2. Port Config Test (static verification)
```powershell
cd tests
npm test -- --testPathPattern="port"
```
Expected: messaging-service main.ts verified to use port 3007

#### 3. Service Health Tests (requires running services)
```powershell
# In separate terminals, start all services first, then:
cd tests
npm test -- --testPathPattern="health"
```

### Manual Verification

#### Step 1: Start notification-service (required first as others depend on it)
```powershell
cd services/notification-service
npm run start:dev
# Expect: "[notification-service] Running on http://localhost:3006/api/v1"
```

#### Step 2: Start remaining services (each in its own terminal)
```powershell
cd services/user-service && npm run start:dev
cd services/feed-service && npm run start:dev
cd services/job-service && npm run start:dev
cd services/event-service && npm run start:dev
cd services/research-service && npm run start:dev
cd services/analytics-service && npm run start:dev
cd services/messaging-service && npm run start:dev
```

#### Step 3: Verify health endpoints
```powershell
Invoke-WebRequest http://localhost:3001/api/v1/health | Select-Object -ExpandProperty Content
Invoke-WebRequest http://localhost:3006/api/v1/health | Select-Object -ExpandProperty Content
```

#### Step 4: Start web app
```powershell
cd web
npm run dev
# Expect: Local: http://localhost:5173/
```

#### Step 5: Test Auth0 login in browser
- Open `http://localhost:5173`
- Click Login
- Should redirect to `dev-ql54xjx71jnttf1o.us.auth0.com`
