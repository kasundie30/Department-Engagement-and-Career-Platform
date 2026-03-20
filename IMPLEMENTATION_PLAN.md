# Implementation Plan: Local Development Setup

**Status**: Phase 1 Complete (External Services Configured)
**Date**: March 20, 2026
**Next Phase**: Phase 2 (Deploy to Render)

---

## Executive Summary

Based on the audit of your codebase and the external services you've already configured, there are **9 critical tasks** to complete before Phase 2 deployment:

1. ✅ Create `.gitignore` files to secure environment variables
2. ✅ Create `.env` files for local development (8 services + 1 web app)
3. ✅ Fix port mismatches in 2 services
4. ✅ Verify messaging-service auth configuration
5. ✅ Update web app configuration
6. ✅ Create local development guide
7. ✅ Verify all configured values match codebase expectations
8. ✅ Test local connectivity between services
9. ✅ Prepare for Render deployment

---

## Your Actual Configuration Values

### External Services Already Set Up

| Service | Configuration |
|---------|----------------|
| **MongoDB Atlas** | `mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528.kd9hgkc.mongodb.net/?appName=DECP-CO528` |
| **Auth0 Domain** | `dev-ql54xjx71jnttf1o.us.auth0.com` |
| **Auth0 API ID** | `https://api.decp-co528.com` |
| **Auth0 Web Client ID** | `MUKsKjXPuBpmgamSIKhFl62jhC1kqD88` |
| **Auth0 Backend Client ID** | `Px8nnn2M5DYGB39ZegCSrgRKqvITbCZ7` |
| **R2 Bucket** | `decp-co528` |
| **R2 Account ID** | `165871ed7eb878835d39fbb59c819caf` |
| **R2 Public URL** | `https://165871ed7eb878835d39fbb59c819caf.r2.cloudflarestorage.com` |
| **Redis (Upstash)** | `https://magical-amoeba-78196.upstash.io` |

---

## Task Breakdown

### Phase 1: Configuration & Setup (You Are Here)

#### Task 1: Create Root `.gitignore`
- **Priority**: 🔴 CRITICAL
- **Why**: Prevent accidental commits of `.env` files with real credentials
- **Files to Create**: `.gitignore` (root level)
- **Status**: ⏳ TODO

#### Task 2: Create `.env` Files for All Services
- **Priority**: 🔴 CRITICAL
- **Why**: Services need actual values to connect to MongoDB, Auth0, R2, Redis
- **For Each Service** (8 total):
  - `services/{service-name}/.env`
  - Copy from `.env.example` and fill with actual values
- **Values to Use**:
  - `MONGO_URI`: Your MongoDB connection string
  - `AUTH0_DOMAIN`: `dev-ql54xjx71jnttf1o.us.auth0.com`
  - `AUTH0_AUDIENCE`: `https://api.decp-co528.com`
  - `PORT`: Service-specific (see table below)
  - `INTERNAL_TOKEN`: Generate a strong random value (or use placeholder for dev)
  - Service-specific vars (REDIS_URL, R2_*, NOTIFICATION_SERVICE_URL)
- **Status**: ⏳ TODO

#### Task 3: Fix Service Port Mismatches
- **Priority**: 🟠 HIGH
- **Issues Found**:
  - `job-service`: `.env.example` has PORT=3005, but code defaults to 3003
  - `messaging-service`: `.env.example` has PORT=3007, but code defaults to 3000
- **Action**: Align `.env.example` or code to match expected ports
- **Recommended Ports**:
  - user-service: `3001`
  - feed-service: `3002`
  - analytics-service: `3003`
  - event-service: `3004`
  - job-service: `3005`
  - notification-service: `3006`
  - messaging-service: `3007`
  - research-service: `3008`
- **Status**: ⏳ TODO

#### Task 4: Verify Messaging-Service Authentication
- **Priority**: 🟡 MEDIUM
- **Issue**: messaging-service has no JWT strategy implemented
- **Action**: 
  - Check if messaging-service should be authenticated (like other 7 services)
  - If yes: Copy JWT strategy from user-service
  - If no: Document why it's public
- **Status**: ⏳ TODO

#### Task 5: Create Web App `.env` Files
- **Priority**: 🔴 CRITICAL
- **Files**: 
  - `web/.env.development` (for local npm run dev)
  - `web/.env.production.local` (for local npm run build)
- **Variables**:
  ```
  VITE_AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
  VITE_AUTH0_CLIENT_ID=MUKsKjXPuBpmgamSIKhFl62jhC1kqD88
  VITE_AUTH0_AUDIENCE=https://api.decp-co528.com
  VITE_USER_SERVICE_URL=http://localhost:3001
  VITE_FEED_SERVICE_URL=http://localhost:3002
  VITE_JOB_SERVICE_URL=http://localhost:3005
  VITE_EVENT_SERVICE_URL=http://localhost:3004
  VITE_NOTIFICATION_SERVICE_URL=http://localhost:3006
  VITE_RESEARCH_SERVICE_URL=http://localhost:3008
  VITE_ANALYTICS_SERVICE_URL=http://localhost:3003
  VITE_MESSAGING_SERVICE_URL=http://localhost:3007
  ```
- **Status**: ⏳ TODO

#### Task 6: Update `.env.example` Files with Real Values
- **Priority**: 🟡 MEDIUM
- **Why**: Other developers can see what values should look like
- **Action**: Update each `.env.example` with:
  - `MONGO_URI` pointing to your cluster (with sanitized password)
  - `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` with your actual values
  - Service-specific URLs
- **All files**: 
  - services/*/. env.example
  - web/.env.example
- **Status**: ⏳ TODO

#### Task 7: Document Configuration Sources
- **Priority**: 🟡 MEDIUM
- **Action**: Update docs to clearly state:
  - Where each value comes from (MongoDB Atlas, Auth0 dashboard, etc.)
  - How to retrieve each value
  - Which values are secrets (should never be committed)
- **File**: `LOCAL_SETUP.md` (created in next section)
- **Status**: ⏳ TODO

---

### Phase 2: Testing & Verification (Next)

#### Task 8: Test Local Service Connectivity
- **Priority**: 🔴 CRITICAL
- **What to Test**:
  - Each service connects to MongoDB
  - Each service validates Auth0 JWT tokens
  - Services that need R2/Redis can access them
  - Services can call notification-service
  - Web app can call all 8 services
- **How**: Follow LOCAL_SETUP.md testing section
- **Status**: ⏳ TODO

#### Task 9: Prepare for Render Deployment
- **Priority**: 🟢 LOW (but do before actual deployment)
- **Tasks**:
  - Push code with updated `.env.example` files to GitHub
  - Document which environment variables need to be set on Render
  - Create Render deployment checklist
- **Status**: ⏳ TODO

---

## File Changes Needed

### A. Create Files

```
✅ Create: .gitignore (root)
  └─ Exclude: .env, .env.*.local, .env.production, .env.development
  └─ Exclude: node_modules, dist, build, .DS_Store, etc.

✅ Create: services/user-service/.env
✅ Create: services/feed-service/.env
✅ Create: services/job-service/.env
✅ Create: services/event-service/.env
✅ Create: services/notification-service/.env
✅ Create: services/research-service/.env
✅ Create: services/analytics-service/.env
✅ Create: services/messaging-service/.env

✅ Create: web/.env.development
✅ Create: web/.env.production.local

✅ Create: LOCAL_SETUP.md (comprehensive local development guide)
✅ Create: ENV_VARIABLES_REFERENCE.md (mapping of vars to configs)
```

### B. Update Files

```
⏳ Update: services/job-service/.env.example
  └─ Change: PORT=3003 to PORT=3005

⏳ Update: services/messaging-service/.env.example
  └─ Change: PORT=3000 to PORT=3007

⏳ Update: All services/.env.example
  └─ Replace placeholder values with your actual config
  └─ Keep passwords sanitized or use realistic examples

⏳ Update: web/.env.example
  └─ Add missing VITE_BACKEND_URL and VITE_DEV_HTTPS
  └─ Update all service URLs to reference your config

⏳ Update: DEPLOYMENT.md
  └─ Reference your actual Auth0 API identifier: https://api.decp-co528.com
  └─ Add note that values in .env.example are template examples
```

### C. Optional Improvements

```
▪️ Clean up: feed-service/src/minio/ (MinIO code no longer used)
  └─ Remove minio.service.ts and related imports if confirmed unused

▪️ Add auth to: services/messaging-service/
  └─ Copy JWT strategy from user-service if required
```

---

## Execution Order

1. **First**: Create `.gitignore` to secure credentials
2. **Second**: Create all `.env` files with your actual values
3. **Third**: Fix port mismatches in `.env.example`
4. **Fourth**: Verify messaging-service auth (make decision)
5. **Fifth**: Create LOCAL_SETUP.md documentation
6. **Sixth**: Test locally that services start and connect
7. **Finally**: Update DEPLOYMENT.md before Phase 2

---

## Variables Reference Table

### Backend Service Variables

| Variable | Example | Services | Required |
|----------|---------|----------|----------|
| `NODE_ENV` | `development` | All | ✅ |
| `PORT` | `3000-3008` | All | ✅ |
| `MONGO_URI` | MongoDB connection string | All | ✅ |
| `AUTH0_DOMAIN` | `dev-ql54xjx71jnttf1o.us.auth0.com` | 7 services | ✅ (not messaging-service) |
| `AUTH0_AUDIENCE` | `https://api.decp-co528.com` | 7 services | ✅ |
| `INTERNAL_TOKEN` | Random secure string | All | ✅ |
| `NOTIFICATION_SERVICE_URL` | `http://localhost:3006` | feed, job, event, research | ✅ |
| `REDIS_URL` | Upstash Redis URL | feed-service | ✅ |
| `R2_ACCOUNT_ID` | Your Cloudflare account ID | feed, research | ✅ |
| `R2_ACCESS_KEY_ID` | R2 access key | feed, research | ✅ |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | feed, research | ✅ |
| `R2_BUCKET_NAME` | `decp-co528` | feed, research | ✅ |
| `R2_PUBLIC_URL` | R2 bucket public URL | feed, research | ✅ |

### Web App Variables

| Variable | Example | Usage | Required |
|----------|---------|-------|----------|
| `VITE_AUTH0_DOMAIN` | `dev-ql54xjx71jnttf1o.us.auth0.com` | Auth0 login | ✅ |
| `VITE_AUTH0_CLIENT_ID` | `MUKsKjXPuBpmgamSIKhFl62jhC1kqD88` | Auth0 login | ✅ |
| `VITE_AUTH0_AUDIENCE` | `https://api.decp-co528.com` | JWT validation | ✅ |
| `VITE_*_SERVICE_URL` | `http://localhost:3001` (8 total) | API calls | ✅ |
| `VITE_BACKEND_URL` | App root URL | SSO callback | ❌ |
| `VITE_DEV_HTTPS` | `0` or `1` | Enable HTTPS in dev | ❌ |

---

## Success Criteria

### Configuration Phase Complete When:
- [ ] `.gitignore` created and prevents `.env` commits
- [ ] All 9 `.env` files created with actual values
- [ ] All 8 services have correct PORT values
- [ ] Web app has both `.env.development` and `.env.production.local`
- [ ] All `.env.example` files updated to reference real config
- [ ] LOCAL_SETUP.md created and documented
- [ ] No hardcoded secrets in any `.env.example` files

### Testing Phase Complete When:
- [ ] User-service starts: `npm run start:dev` → "Running on http://localhost:3001"
- [ ] Notification-service starts on port 3006
- [ ] Feed-service connects to Redis
- [ ] Research-service connects to R2
- [ ] Web app starts: `npm run dev` → "http://localhost:5173"
- [ ] Web app login redirects to Auth0
- [ ] Web app logout returns to app
- [ ] API calls from web app reach services

---

## Estimated Effort

| Task | Effort | Notes |
|------|--------|-------|
| Create `.gitignore` | 15 min | Simple bash/powershell script |
| Create 9 `.env` files | 30 min | Copy-paste values, verify formatting |
| Fix port mismatches | 10 min | 2 file edits |
| Verify messaging-service | 10 min | Read code, make decision |
| Update `.env.example` files | 20 min | Replace placeholders |
| Create LOCAL_SETUP.md | 45 min | Comprehensive testing guide |
| Test locally | 30 min | Run services, verify connectivity |
| **Total** | **~2.5 hours** | Sequential, minimal dependencies |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Credentials leaked in git | 🔴 Critical | Use `.gitignore`, review commits |
| Port conflicts on localhost | 🟡 Medium | Use `lsof -i :PORT` to check |
| Services can't find each other | 🟡 Medium | Verify NOTIFICATION_SERVICE_URL in all services |
| Auth0 callback fails | 🔴 Critical | Update Auth0 dashboard callbacks immediately |
| Redis/R2 not accessible | 🟠 High | Verify credentials and IP allowlisting |

---

## Next Steps (After This Phase)

1. **Phase 2**: Deploy each service to Render
2. **Phase 3**: Deploy web app to Vercel
3. **Phase 4**: Configure production Auth0 callbacks
4. **Phase 5**: Set up error monitoring & scaling

---

## Questions to Answer Before Continuing

1. **Messaging-Service Auth**: Should it require Auth0 JWT tokens like other services?
2. **Internal Token**: What value should `INTERNAL_TOKEN` be? (can be auto-generated for dev)
3. **Production Secrets**: Will you use separate credentials for production, or rotate these?
4. **Redis**: Should feed-service use Upstash REST API or legacy Redis protocol?

---

## Resources

- **Local Setup Guide**: See `LOCAL_SETUP.md` (created next)
- **Environment Variables**: See `ENV_VARIABLES_REFERENCE.md` (created next)
- **Deployment Guide**: See `DEPLOYMENT.md` (Phase 2)
- **Auth0 Docs**: https://auth0.com/docs
- **Render Docs**: https://render.com/docs

