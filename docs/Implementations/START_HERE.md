# 🚀 START HERE - Quick Start Guide

**Status**: Phase 1 Complete ✅ | Ready for Local Development Setup
**Time to Complete**: ~90 minutes | **Difficulty**: Easy (mostly copying credentials)

---

## ⚠️ IMPORTANT: `.env` vs `.env.example` Files

Your project already has `.env.example` files (templates). You need to **CREATE SEPARATE `.env` files** with your actual values.

**See detailed explanation**: [.ENV_CLARIFICATION.md](.ENV_CLARIFICATION.md)

```
services/user-service/
├── .env.example  ← Already exists (template, can be committed)
└── .env          ← YOU CREATE THIS (actual values, never committed)
```

---

## What You Need to Do RIGHT NOW

### Step 1️⃣: Create Root `.gitignore` (5 minutes)

Copy this into a new file called `.gitignore` in your project root:

```bash
# Environment variables - NEVER COMMIT THESE
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

# IDE & OS
.vscode/
.idea/
.DS_Store
Thumbs.db
*.swp
*.swo
```

**Why**: Without this, you risk accidentally committing credentials to GitHub.

---

### Step 2️⃣: Create 9 `.env` Files (20 minutes)

**IMPORTANT CLARIFICATION:**
- `.env.example` files **already exist** in each service (template files, safe to commit)
- You need to **CREATE NEW `.env` files** (separate files with actual values, NOT committed to git)

**Each service should have:**
```
services/user-service/
├── .env.example  ← Already exists (template)
└── .env          ← YOU CREATE THIS (actual values)
```

Use your actual values from `docs/Setting up external services.txt`

**Your values** (copy these exactly):
```
MongoDB: mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528.kd9hgkc.mongodb.net/?appName=DECP-CO528
Auth0 Domain: dev-ql54xjx71jnttf1o.us.auth0.com
Auth0 API: https://api.decp-co528.com
R2 Account: 165871ed7eb878835d39fbb59c819caf
Redis: https://magical-amoeba-78196.upstash.io
```

**Create these 9 NEW files (DO NOT modify .env.example):**

**services/user-service/.env**
```bash
NODE_ENV=development
PORT=3001
MONGO_URI=mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528.kd9hgkc.mongodb.net/?appName=DECP-CO528
AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
AUTH0_AUDIENCE=https://api.decp-co528.com
INTERNAL_TOKEN=dev-internal-token-12345678
```

**services/feed-service/.env**
```bash
NODE_ENV=development
PORT=3002
MONGO_URI=mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528.kd9hgkc.mongodb.net/?appName=DECP-CO528
AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
AUTH0_AUDIENCE=https://api.decp-co528.com
INTERNAL_TOKEN=dev-internal-token-12345678
NOTIFICATION_SERVICE_URL=http://localhost:3006
REDIS_URL=https://gQAAAAAAATF0AAIncDJhMGNiNTkzOGQxMGQ0ZTkzYTUzYzFkNGM5MmVjNTM2NXAyNzgxOTY@magical-amoeba-78196.upstash.io
R2_ACCOUNT_ID=165871ed7eb878835d39fbb59c819caf
R2_ACCESS_KEY_ID=2d08079eafd184c91b9c9d4d21230288
R2_SECRET_ACCESS_KEY=e5db9224ce400e1b3eb39a09e5eb3e61092a95b423d7ec4dbd90bea90660d38a
R2_BUCKET_NAME=decp-co528
R2_PUBLIC_URL=https://165871ed7eb878835d39fbb59c819caf.r2.cloudflarestorage.com
```

**services/event-service/.env**
```bash
NODE_ENV=development
PORT=3004
MONGO_URI=mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528.kd9hgkc.mongodb.net/?appName=DECP-CO528
AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
AUTH0_AUDIENCE=https://api.decp-co528.com
INTERNAL_TOKEN=dev-internal-token-12345678
NOTIFICATION_SERVICE_URL=http://localhost:3006
```

**services/job-service/.env**
```bash
NODE_ENV=development
PORT=3005
MONGO_URI=mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528.kd9hgkc.mongodb.net/?appName=DECP-CO528
AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
AUTH0_AUDIENCE=https://api.decp-co528.com
INTERNAL_TOKEN=dev-internal-token-12345678
NOTIFICATION_SERVICE_URL=http://localhost:3006
```

**services/notification-service/.env**
```bash
NODE_ENV=development
PORT=3006
MONGO_URI=mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528.kd9hgkc.mongodb.net/?appName=DECP-CO528
AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
AUTH0_AUDIENCE=https://api.decp-co528.com
INTERNAL_TOKEN=dev-internal-token-12345678
```

**services/research-service/.env**
```bash
NODE_ENV=development
PORT=3008
MONGO_URI=mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528.kd9hgkc.mongodb.net/?appName=DECP-CO528
AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
AUTH0_AUDIENCE=https://api.decp-co528.com
INTERNAL_TOKEN=dev-internal-token-12345678
NOTIFICATION_SERVICE_URL=http://localhost:3006
R2_ACCOUNT_ID=165871ed7eb878835d39fbb59c819caf
R2_ACCESS_KEY_ID=2d08079eafd184c91b9c9d4d21230288
R2_SECRET_ACCESS_KEY=e5db9224ce400e1b3eb39a09e5eb3e61092a95b423d7ec4dbd90bea90660d38a
R2_BUCKET_NAME=decp-co528
R2_PUBLIC_URL=https://165871ed7eb878835d39fbb59c819caf.r2.cloudflarestorage.com
```

**services/analytics-service/.env**
```bash
NODE_ENV=development
PORT=3003
MONGO_URI=mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528.kd9hgkc.mongodb.net/?appName=DECP-CO528
AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
AUTH0_AUDIENCE=https://api.decp-co528.com
INTERNAL_TOKEN=dev-internal-token-12345678
```

**services/messaging-service/.env**
```bash
NODE_ENV=development
PORT=3007
MONGO_URI=mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528.kd9hgkc.mongodb.net/?appName=DECP-CO528
INTERNAL_TOKEN=dev-internal-token-12345678
```

**web/.env.development**
```bash
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
```

**web/.env.production.local** (same as above for local testing)

---

### Step 3️⃣: Install Dependencies (20 minutes)

```bash
cd d:\ACADEMICS\Semester\ 7\CO528\ Applied\ Software\ Architecture\6\ Mini\ Project\Department-Engagement-and-Career-Platform
npm install
```

---

### Step 4️⃣: Run Services (10 minutes each)

Open **8 separate terminal windows** and run:

**Terminal 1** - Notification Service (start first):
```bash
cd services/notification-service
npm run start:dev
# Should show: [notification-service] Running on http://localhost:3006/api/v1
```

**Terminal 2** - User Service:
```bash
cd services/user-service
npm run start:dev
# Should show: [user-service] Running on http://localhost:3001/api/v1
```

**Terminal 3** - Feed Service:
```bash
cd services/feed-service
npm run start:dev
# Should show: [feed-service] Running on http://localhost:3002/api/v1
```

**Terminal 4** - Analytics Service:
```bash
cd services/analytics-service
npm run start:dev
# Should show: [analytics-service] Running on http://localhost:3003/api/v1
```

**Terminal 5** - Event Service:
```bash
cd services/event-service
npm run start:dev
# Should show: [event-service] Running on http://localhost:3004/api/v1
```

**Terminal 6** - Job Service:
```bash
cd services/job-service
npm run start:dev
# Should show: [job-service] Running on http://localhost:3005/api/v1
```

**Terminal 7** - Research Service:
```bash
cd services/research-service
npm run start:dev
# Should show: [research-service] Running on http://localhost:3008/api/v1
```

**Terminal 8** - Messaging Service:
```bash
cd services/messaging-service
npm run start:dev
# Should show: [messaging-service] Running on http://localhost:3007/api/v1
```

---

### Step 5️⃣: Run Web App (new terminal)

```bash
cd web
npm run dev
# Should show: ➜  Local: http://localhost:5173/
```

Open browser: **http://localhost:5173**

Click **Login** → Should redirect to Auth0 → Login → Should come back to app

---

## Success = All 8 Services Running + Web App Works ✅

When you see this, Phase 1 is complete:

```
✅ http://localhost:3001 - User Service
✅ http://localhost:3002 - Feed Service
✅ http://localhost:3003 - Analytics Service
✅ http://localhost:3004 - Event Service
✅ http://localhost:3005 - Job Service
✅ http://localhost:3006 - Notification Service
✅ http://localhost:3007 - Messaging Service
✅ http://localhost:3008 - Research Service
✅ http://localhost:5173 - Web App (with Auth0 login working)
```

---

## If Something Goes Wrong

**"Port already in use"**
```bash
# Kill the process on that port
taskkill /PID <PID> /F
```

**"MongoDB connection failed"**
- Verify MongoDB URL in .env matches exactly
- Check MongoDB Atlas UI shows your user exists

**"Auth0 error"**
- Verify AUTH0_DOMAIN = dev-ql54xjx71jnttf1o.us.auth0.com
- Verify AUTH0_AUDIENCE = https://api.decp-co528.com

**"Web app login not working"**
- Check Auth0 Dashboard → Applications → DECP-CO528-WEB
- Verify "Allowed Callback URLs" includes: http://localhost:5173/callback
- Verify "Allowed Logout URLs" includes: http://localhost:5173

---

## For Detailed Help

| Need | See |
|------|-----|
| Step-by-step setup | [LOCAL_SETUP.md](LOCAL_SETUP.md) |
| Copy-paste commands | [TASK_CHECKLIST.md](TASK_CHECKLIST.md) |
| Complete strategy | [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) |
| Troubleshooting | [LOCAL_SETUP.md#troubleshooting](LOCAL_SETUP.md) |

---

## Answer to Your Original Questions

### Q1: Do I have to use the exact names from the guide?

**A**: YES for environment variables - they're hardcoded in the code. You CANNOT change:
- `MONGO_URI`
- `AUTH0_DOMAIN`
- `AUTH0_AUDIENCE`
- `PORT`
- etc.

The names are hardcoded in `src/*.ts` files and won't work if you change them. Only the **VALUES** can be different (your MongoDB URL, Auth0 domain, etc.)

### Q2: Where are configurations in the codebase?

**A**: 
- **service configuration**: `src/app.module.ts` (MongoDB)
- **Auth0 configuration**: `src/auth/strategies/jwt.strategy.ts` (all 7 services)
- **Port configuration**: `src/main.ts` (all services)
- **Web configuration**: `web/src/config/services.ts` (service URLs)

All reference `process.env.VARIABLE_NAME` - the values are in `.env` files.

### Q3: Has Auth0 quickstart code been included?

**A**: MOSTLY - The JWT validation strategy is implemented (Passport + jwks-rsa). 

**BUT**: You still need to manually set up Auth0 Actions (rules) in the Auth0 Dashboard to add roles claims. See [DEPLOYMENT.md section 4.1](DEPLOYMENT.md#41-update-auth0-roles-claim).

---

## Next After This Works

When all 8 services + web app run locally:

→ See [DEPLOYMENT.md](DEPLOYMENT.md) for **Phase 2: Deploy to Render**

Good luck! 🎉

