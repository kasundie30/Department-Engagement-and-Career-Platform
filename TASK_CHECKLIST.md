# Task Execution Checklist

**Project**: Department Engagement and Career Platform (DECP)
**Phase**: Configuration & Local Setup (Phase 1)
**Created**: March 20, 2026
**Estimated Time**: ~2.5 hours

---

## ⚠️ CRITICAL CLARIFICATION: `.env` vs `.env.example`

**Question**: ".env.example already exists! Do I need to create .env again?"

**Answer**: YES! They are TWO DIFFERENT FILES.

| File | Exists? | You Create? | Has Real Values? | In Git? | Purpose |
|------|---------|-------------|-----------------|---------|---------|
| `.env.example` | ✅ Already exists | ❌ NO | ❌ Placeholder values | ✅ YES | Template showing variables needed |
| `.env` | ❌ Does not exist | ✅ YES | ✅ Your actual values | ❌ NO (.gitignore) | Your runtime config (never committed) |

**What to do**:
- ✅ Keep `.env.example` as-is (don't modify it)
- ✅ Create NEW `.env` file with your actual MongoDB URL, Auth0 domain, API keys
- ✅ `.gitignore` automatically prevents `.env` from being committed

**See**: [.ENV_CLARIFICATION.md](.ENV_CLARIFICATION.md) for detailed explanation

---

---

## Quick Start Commands

Copy and paste these commands to get started immediately:

### 1. Create Root .gitignore (5 min)
```bash
# From project root
cat > .gitignore << 'EOF'
# Environment variables (NEVER commit!)
.env
.env.local
.env.*.local
.env.development
.env.production
.env.test

# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build outputs
dist/
build/
.next/
out/
.vercel/

# Development
.DS_Store
Thumbs.db
*.swp
*.swo
*~

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.sublime-project

# Misc
.cache/
.parcel-cache/
coverage/
.nyc_output/
EOF
```

### 2. Create Service .env Files (20 min)

**Run from project root** (PowerShell on Windows):

```powershell
# TEMPLATE - Update values as needed for your config
$MONGO_URI = "mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528.kd9hgkc.mongodb.net/?appName=DECP-CO528"
$AUTH0_DOMAIN = "dev-ql54xjx71jnttf1o.us.auth0.com"
$AUTH0_AUDIENCE = "https://api.decp-co528.com"
$INTERNAL_TOKEN = "dev-internal-token-12345678"

# User Service (3001)
@"
NODE_ENV=development
PORT=3001
MONGO_URI=$MONGO_URI
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_AUDIENCE=$AUTH0_AUDIENCE
INTERNAL_TOKEN=$INTERNAL_TOKEN
"@ | Out-File -Encoding UTF8 services\user-service\.env

# Feed Service (3002)
@"
NODE_ENV=development
PORT=3002
MONGO_URI=$MONGO_URI
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_AUDIENCE=$AUTH0_AUDIENCE
INTERNAL_TOKEN=$INTERNAL_TOKEN
NOTIFICATION_SERVICE_URL=http://localhost:3006
REDIS_URL=https://gQAAAAAAATF0AAIncDJhMGNiNTkzOGQxMGQ0ZTkzYTUzYzFkNGM5MmVjNTM2NXAyNzgxOTY@magical-amoeba-78196.upstash.io
R2_ACCOUNT_ID=165871ed7eb878835d39fbb59c819caf
R2_ACCESS_KEY_ID=2d08079eafd184c91b9c9d4d21230288
R2_SECRET_ACCESS_KEY=e5db9224ce400e1b3eb39a09e5eb3e61092a95b423d7ec4dbd90bea90660d38a
R2_BUCKET_NAME=decp-co528
R2_PUBLIC_URL=https://165871ed7eb878835d39fbb59c819caf.r2.cloudflarestorage.com
"@ | Out-File -Encoding UTF8 services\feed-service\.env

# Job Service (3005)
@"
NODE_ENV=development
PORT=3005
MONGO_URI=$MONGO_URI
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_AUDIENCE=$AUTH0_AUDIENCE
INTERNAL_TOKEN=$INTERNAL_TOKEN
NOTIFICATION_SERVICE_URL=http://localhost:3006
"@ | Out-File -Encoding UTF8 services\job-service\.env

# Event Service (3004)
@"
NODE_ENV=development
PORT=3004
MONGO_URI=$MONGO_URI
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_AUDIENCE=$AUTH0_AUDIENCE
INTERNAL_TOKEN=$INTERNAL_TOKEN
NOTIFICATION_SERVICE_URL=http://localhost:3006
"@ | Out-File -Encoding UTF8 services\event-service\.env

# Notification Service (3006)
@"
NODE_ENV=development
PORT=3006
MONGO_URI=$MONGO_URI
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_AUDIENCE=$AUTH0_AUDIENCE
INTERNAL_TOKEN=$INTERNAL_TOKEN
"@ | Out-File -Encoding UTF8 services\notification-service\.env

# Research Service (3008)
@"
NODE_ENV=development
PORT=3008
MONGO_URI=$MONGO_URI
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_AUDIENCE=$AUTH0_AUDIENCE
INTERNAL_TOKEN=$INTERNAL_TOKEN
NOTIFICATION_SERVICE_URL=http://localhost:3006
R2_ACCOUNT_ID=165871ed7eb878835d39fbb59c819caf
R2_ACCESS_KEY_ID=2d08079eafd184c91b9c9d4d21230288
R2_SECRET_ACCESS_KEY=e5db9224ce400e1b3eb39a09e5eb3e61092a95b423d7ec4dbd90bea90660d38a
R2_BUCKET_NAME=decp-co528
R2_PUBLIC_URL=https://165871ed7eb878835d39fbb59c819caf.r2.cloudflarestorage.com
"@ | Out-File -Encoding UTF8 services\research-service\.env

# Analytics Service (3003)
@"
NODE_ENV=development
PORT=3003
MONGO_URI=$MONGO_URI
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_AUDIENCE=$AUTH0_AUDIENCE
INTERNAL_TOKEN=$INTERNAL_TOKEN
"@ | Out-File -Encoding UTF8 services\analytics-service\.env

# Messaging Service (3007)
@"
NODE_ENV=development
PORT=3007
MONGO_URI=$MONGO_URI
INTERNAL_TOKEN=$INTERNAL_TOKEN
"@ | Out-File -Encoding UTF8 services\messaging-service\.env

echo "✅ All service .env files created"
```

### 3. Create Web App .env Files (5 min)

```powershell
# Web App Development Environment
$webEnvDev = @"
VITE_AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
VITE_AUTH0_CLIENT_ID=MUKsKjXPuBpmgamSIKhFl62jhC1kqD88
VITE_AUTH0_AUDIENCE=https://api.decp-co528.com
VITE_USER_SERVICE_URL=http://localhost:3001
VITE_FEED_SERVICE_URL=http://localhost:3002
VITE_ANALYTICS_SERVICE_URL=http://localhost:3003
VITE_EVENT_SERVICE_URL=http://localhost:3004
VITE_JOB_SERVICE_URL=http://localhost:3005
VITE_NOTIFICATION_SERVICE_URL=http://localhost:3006
VITE_MESSAGING_SERVICE_URL=http://localhost:3007
VITE_RESEARCH_SERVICE_URL=http://localhost:3008
VITE_DEV_HTTPS=0
"@

$webEnvDev | Out-File -Encoding UTF8 web\.env.development
$webEnvDev | Out-File -Encoding UTF8 web\.env.production.local

echo "✅ Web app .env files created"
```

### 4. Install Dependencies (20 min)

```bash
# Install all service dependencies
npm install

# Or manually
cd services/user-service && npm install && cd ../..
cd services/feed-service && npm install && cd ../..
cd services/job-service && npm install && cd ../..
cd services/event-service && npm install && cd ../..
cd services/notification-service && npm install && cd ../..
cd services/research-service && npm install && cd ../..
cd services/analytics-service && npm install && cd ../..
cd services/messaging-service && npm install && cd ../..
cd web && npm install && cd ..
```

### 5. Verify Configuration (10 min)

```bash
# Verify MongoDB connection
# Go to: https://cloud.mongodb.com/
# Click on your cluster DECP-CO528
# Should show: "Connected" message

# Verify Auth0 is accessible
curl https://dev-ql54xjx71jnttf1o.us.auth0.com/.well-known/jwks.json
# Should return JSON with "keys" array

# Verify all .env files exist
ls services/*/.env
ls web/.env.development
ls web/.env.production.local
```

---

## Detailed Task Checklist

### ✅ Task 1: Create Root `.gitignore`

**Purpose**: Prevent accidental commits of `.env` files with credentials

**Steps**:
- [ ] Create `.gitignore` file in project root
- [ ] Add all `.env*` patterns to exclude files
- [ ] Add `node_modules/`, `dist/`, `build/` to exclude build artifacts
- [ ] Verify file was created: `ls -la .gitignore`

**Verify**:
```bash
git status
# Should show ".gitignore" file but NOT any .env files
```

---

### ✅ Task 2: Create Service Environment Files

**Purpose**: Configure 8 backend services with database, auth, storage credentials

**IMPORTANT CLARIFICATION:**
- `.env.example` files **already exist** in each service (these are templates showing what variables are needed)
- You need to **CREATE NEW `.env` files** (separate actual configuration files with your real values)
- `.gitignore` will prevent `.env` files from being committed (keeping secrets safe)
- `.env.example` files CAN be safely committed (they have placeholder values)

**File structure after you're done:**
```
services/user-service/
├── .env.example       ← Already exists (template in git)
└── .env               ← CREATE THIS (your actual secrets, in .gitignore)
```

**For Each Service** (8 total):

| Service | Port | Special Vars | Status |
|---------|------|--------------|--------|
| user-service | 3001 | None | ⏳ |
| feed-service | 3002 | REDIS_URL, R2_* | ⏳ |
| job-service | 3005 | NOTIFICATION_SERVICE_URL | ⏳ |
| event-service | 3004 | NOTIFICATION_SERVICE_URL | ⏳ |
| notification-service | 3006 | None | ⏳ |
| research-service | 3008 | NOTIFICATION_SERVICE_URL, R2_* | ⏳ |
| analytics-service | 3003 | None | ⏳ |
| messaging-service | 3007 | None (no Auth0) | ⏳ |

**For Each Service**:
- [ ] Create `services/{service}/.env` file
- [ ] Add all variables from `.env.example`
- [ ] Fill in actual values:
  - MONGO_URI: `mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528...`
  - AUTH0_DOMAIN: `dev-ql54xjx71jnttf1o.us.auth0.com`
  - AUTH0_AUDIENCE: `https://api.decp-co528.com`
  - PORT: Service-specific (see table)
  - NOTIFICATION_SERVICE_URL: `http://localhost:3006` (if needed)
  - R2_*: Values from Cloudflare (if needed)
  - REDIS_URL: Upstash URL (if needed)

**Verify**:
```bash
# Check file exists and has values
cat services/user-service/.env | grep MONGO_URI
# Should output: MONGO_URI=mongodb+srv://...

# Verify all services have .env files
ls services/*/.env
# Should list 8 files
```

---

### ✅ Task 3: Create Web App Environment Files

**Purpose**: Configure React frontend with Auth0 and service URLs

**Files to Create**:
- [ ] `web/.env.development` (for `npm run dev`)
- [ ] `web/.env.production.local` (for `npm run build && npm run preview`)

**Essential Variables**:
- [ ] VITE_AUTH0_DOMAIN=`dev-ql54xjx71jnttf1o.us.auth0.com`
- [ ] VITE_AUTH0_CLIENT_ID=`MUKsKjXPuBpmgamSIKhFl62jhC1kqD88`
- [ ] VITE_AUTH0_AUDIENCE=`https://api.decp-co528.com`
- [ ] VITE_USER_SERVICE_URL=`http://localhost:3001`
- [ ] VITE_FEED_SERVICE_URL=`http://localhost:3002`
- [ ] VITE_JOB_SERVICE_URL=`http://localhost:3005`
- [ ] VITE_EVENT_SERVICE_URL=`http://localhost:3004`
- [ ] VITE_NOTIFICATION_SERVICE_URL=`http://localhost:3006`
- [ ] VITE_RESEARCH_SERVICE_URL=`http://localhost:3008`
- [ ] VITE_ANALYTICS_SERVICE_URL=`http://localhost:3003`
- [ ] VITE_MESSAGING_SERVICE_URL=`http://localhost:3007`

**Verify**:
```bash
cat web/.env.development | grep VITE_AUTH0_DOMAIN
# Should output: VITE_AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
```

---

### ✅ Task 4: Fix Port Mismatches

**Issue**: Some services have mismatched port configurations

**For job-service (PORT 3005)**:
- [ ] Check `services/job-service/.env.example` - should have `PORT=3005`
- [ ] Check `services/job-service/src/main.ts` - verify it uses `process.env.PORT ?? 3005`
- [ ] If mismatch, edit `.env.example` to match actual service port

**For messaging-service (PORT 3007)**:
- [ ] Check `services/messaging-service/.env.example` - should have `PORT=3007`
- [ ] Check `services/messaging-service/src/main.ts` - verify it uses `process.env.PORT ?? 3007`
- [ ] If mismatch, edit `.env.example` to match actual service port

**Verify**:
```bash
# Check main.ts default ports match documentation
grep "process.env.PORT ??" services/job-service/src/main.ts
# Should show: 3005

grep "process.env.PORT ??" services/messaging-service/src/main.ts
# Should show: 3007
```

---

### ✅ Task 5: Install All Dependencies

**Purpose**: Download npm packages for all 9 services/apps

**Steps**:
- [ ] Run from project root: `npm install`
- [ ] Or manually install each service:
  - [ ] `cd services/user-service && npm install && cd ../..`
  - [ ] `cd services/feed-service && npm install && cd ../..`
  - [ ] `cd services/job-service && npm install && cd ../..`
  - [ ] `cd services/event-service && npm install && cd ../..`
  - [ ] `cd services/notification-service && npm install && cd ../..`
  - [ ] `cd services/research-service && npm install && cd ../..`
  - [ ] `cd services/analytics-service && npm install && cd ../..`
  - [ ] `cd services/messaging-service && npm install && cd ../..`
  - [ ] `cd web && npm install && cd ..`

**Verify**:
```bash
# Check node_modules exists
ls node_modules | head
# Should list packages

# Verify services have dependencies
ls services/user-service/node_modules | head
# Should list packages
```

---

### ✅ Task 6: Update .env.example Files

**Purpose**: Document what values should be used (without secrets)

**For Each Service**:
- [ ] Update `services/{service}/.env.example`
- [ ] Replace placeholder `miniproject` references with `decp` (your project name)
- [ ] Update Auth0_AUDIENCE to `https://api.decp-co528.com`
- [ ] Update MongoDB example to show actual format (keep password sanitized)
- [ ] Update service URLs to reflect correct ports

**Example (keep secrets out)**:
```bash
# BEFORE:
AUTH0_AUDIENCE=https://api.miniproject.com

# AFTER:
AUTH0_AUDIENCE=https://api.decp-co528.com

# BEFORE:
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/miniproject_db

# AFTER:
MONGO_URI=mongodb+srv://e20148_db_user:***PASSWORD***@decp-co528.kd9hgkc.mongodb.net/?appName=DECP-CO528
```

**Verify**:
```bash
# Check .env.example files are updated
grep "api.decp-co528.com" services/*/. env.example
# Should find in all 8 services
```

---

### ✅ Task 7: Test Local Service Startup

**Purpose**: Verify each service can start and connect to MongoDB/Auth0

**For Each Service** (open separate terminal):

```bash
cd services/user-service
npm run start:dev
# Expected output:
# [user-service] Running on http://localhost:3001/api/v1
```

**Expected Success Indicators**:
- [ ] Service logs "Running on http://localhost:PORT"
- [ ] No "MongoDB connection failed" errors
- [ ] No "AUTH0_DOMAIN not found" errors
- [ ] Service responds to: `curl http://localhost:PORT/health`

**Common Issues & Fixes**:
- "Port already in use" → Run on different port: `PORT=3011 npm run start:dev`
- "MongoDB connection refused" → Verify MONGO_URI in .env
- "AUTH0 error" → Verify AUTH0_DOMAIN and AUTH0_AUDIENCE

---

### ✅ Task 8: Test Web App Startup

**Purpose**: Verify React frontend starts and can reach backend

**Steps**:
```bash
cd web
npm run dev
# Expected output:
# VITE v4.x.x  dev server running at:
# ➜  Local:   http://localhost:5173/
```

**Expected Success Indicators**:
- [ ] Web server starts on http://localhost:5173
- [ ] Browser renders home page
- [ ] Login button visible
- [ ] No errors in console (F12)

**Test Login Flow**:
- [ ] Click Login button
- [ ] Redirected to Auth0 login page
- [ ] Can see Auth0 domain in URL: `dev-ql54xjx71jnttf1o.us.auth0.com`
- [ ] After login, redirected back to app

---

### ✅ Task 9: Verify Security (No Committed Secrets)

**Purpose**: Ensure `.env` files are NOT tracked by Git

**Steps**:
```bash
git status
# Should NOT show any .env files

git log --oneline | head
# Should NOT have commits like "Add .env files"

# If .env was already committed, run:
git rm --cached services/*/.env
git rm --cached web/.env.*
git commit -m "Remove .env files from tracking"
git push origin main
```

**Verify**:
- [ ] `.gitignore` exists at root
- [ ] `.gitignore` contains `.env` patterns
- [ ] `git status` shows no `.env` files
- [ ] All `.env` files have `ACTUAL VALUES` (not placeholders)

---

## Success Checklist (Phase 1 Complete)

When ALL of the following are true, Phase 1 is complete:

### Configuration
- [ ] Root `.gitignore` created
- [ ] 8 service `.env` files created with actual values
- [ ] 2 web app `.env` files created
- [ ] All `.env.example` files updated to match actual config
- [ ] All values are correct (copy-pasted from "Setting up external services.txt")

### Dependencies
- [ ] `npm install` completed without errors
- [ ] `node_modules` exists in root and all service directories
- [ ] `package-lock.json` exists in all services

### Local Testing
- [ ] **notification-service** starts on port 3006 successfully
- [ ] **user-service** starts on port 3001 successfully
- [ ] **feed-service** starts on port 3002 successfully
- [ ] **job-service** starts on port 3005 successfully
- [ ] **event-service** starts on port 3004 successfully
- [ ] **research-service** starts on port 3008 successfully
- [ ] **analytics-service** starts on port 3003 successfully
- [ ] **messaging-service** starts on port 3007 successfully
- [ ] **web app** starts on port 5173 successfully

### Connectivity Tests
- [ ] Each service responds to: `curl http://localhost:PORT/health`
- [ ] Web app login redirects to Auth0
- [ ] Web app login callback returns to app

### Security
- [ ] No `.env` files show in `git status`
- [ ] No passwords visible in any committed files
- [ ] `.gitignore` is properly configured

---

## Time Estimate

| Task | Duration | Status |
|------|----------|--------|
| Create `.gitignore` | 5 min | ⏳ |
| Create 9 `.env` files | 20 min | ⏳ |
| Install dependencies | 15 min | ⏳ |
| Update `.env.example` files | 15 min | ⏳ |
| Test service startup | 20 min | ⏳ |
| Test web app | 10 min | ⏳ |
| Verify security | 5 min | ⏳ |
| **TOTAL** | **~90 minutes** | ⏳ |

---

## Next Steps (When Phase 1 Complete)

1. ✅ All local services running
2. ⏳ **Phase 2**: Deploy services to Render
3. ⏳ **Phase 3**: Deploy web app to Vercel
4. ⏳ **Phase 4**: Configure production Auth0 callbacks
5. ⏳ **Phase 5**: Set up monitoring and error tracking

See [DEPLOYMENT.md](DEPLOYMENT.md) for Phase 2 instructions.

---

## Quick Reference

### Service Ports

```
3001 = User Service
3002 = Feed Service
3003 = Analytics Service
3004 = Event Service
3005 = Job Service
3006 = Notification Service
3007 = Messaging Service
3008 = Research Service
5173 = Web App (React)
```

### Key Environment Variables

| What | Value |
|------|-------|
| MongoDB | `mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528.kd9hgkc.mongodb.net` |
| Auth0 Domain | `dev-ql54xjx71jnttf1o.us.auth0.com` |
| Auth0 API ID | `https://api.decp-co528.com` |
| Auth0 Web Client | `MUKsKjXPuBpmgamSIKhFl62jhC1kqD88` |
| R2 Account | `165871ed7eb878835d39fbb59c819caf` |
| Redis | `https://magical-amoeba-78196.upstash.io` |

### Helpful Commands

```bash
# Start all services
npm run start:all

# Build web app
cd web && npm run build

# Test service connectivity
curl http://localhost:3001/health
curl http://localhost:5173

# Check port availability
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# View git staging
git status
```

