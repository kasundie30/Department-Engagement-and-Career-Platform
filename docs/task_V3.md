# Implementation Plan V3 — Task Checklist

**Project**: Department Engagement and Career Platform (DECP)
**Phase**: Verification, Integration Testing & Local Run
**Created**: March 20, 2026

---

## Phase 1: Audit & Fix Known Issues

- [x] Read all existing .env files and verify credentials
- [x] Fix messaging-service default port (main.ts: 3000 → 3007)

---

## Phase 2: Create /tests Folder with Integration Tests

- [x] Create `tests/` folder at project root
- [x] Create [tests/package.json](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/tests/package.json) with jest + dotenv + axios
- [x] Create [tests/jest.config.js](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/tests/jest.config.js)
- [x] Create [tests/utils/env-loader.js](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/tests/utils/env-loader.js) — loads .env from each service
- [x] Create [tests/integration/auth0.test.js](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/tests/integration/auth0.test.js) — tests JWKS endpoint reachability
- [x] Create [tests/integration/mongodb.test.js](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/tests/integration/mongodb.test.js) — tests MongoDB Atlas connection
- [x] Create [tests/integration/redis.test.js](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/tests/integration/redis.test.js) — tests Upstash Redis connection
- [x] Create [tests/integration/r2.test.js](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/tests/integration/r2.test.js) — tests Cloudflare R2 connectivity
- [x] Create [tests/integration/services-health.test.js](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/tests/integration/services-health.test.js) — tests health endpoint of each running service
- [x] Create `tests/integration/messaging-port.test.js` — validates messaging-service port config
- [x] Create [tests/README.md](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/tests/README.md) — how to run tests

---

## Phase 3: Fix Code Bugs

- [x] Fix [services/messaging-service/src/main.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/messaging-service/src/main.ts) port default (3000 → 3007)
- [x] Verify [services/job-service/src/main.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/job-service/src/main.ts) uses PORT=3005 correctly

---

## Phase 4: Run Tests

- [x] Install deps in tests/: `npm install`
- [x] Run integration tests: `npm test`
- [x] Fix any failures until all pass

---

## Phase 5: Run All Services Locally

- [x] Start notification-service (port 3006)
- [x] Start user-service (port 3001)
- [x] Start feed-service (port 3002)
- [x] Start job-service (port 3005)
- [x] Start event-service (port 3004)
- [x] Start research-service (port 3008)
- [x] Start analytics-service (port 3003)
- [x] Start messaging-service (port 3007)
- [x] Start web app (port 5173)
- [x] Run health check tests against running services (Skipped by user request after starting)

---

## Phase 6: Document Results

- [x] Write walkthrough.md with test results and service status
