# Local Development Setup Guide

**Project**: Department Engagement and Career Platform (DECP)
**Status**: Complete Phase 1 (External Services Configured)
**Tested On**: Windows 11 with Node.js 18+
**Last Updated**: March 20, 2026

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Service Configuration](#service-configuration)
4. [Running Services Locally](#running-services-locally)
5. [Running Web App Locally](#running-web-app-locally)
6. [Testing Connectivity](#testing-connectivity)
7. [Troubleshooting](#troubleshooting)
8. [Service Architecture](#service-architecture)

---

## Prerequisites

### Required Software

- **Node.js**: 18.0.0 or higher
  ```bash
  node --version  # Verify: v18.x.x or higher
  ```

- **npm**: 9.0.0 or higher (comes with Node.js)
  ```bash
  npm --version  # Verify: 9.x.x or higher
  ```

- **Git**: For version control
  ```bash
  git --version
  ```

### Required Credentials & Access

You should have from Phase 1:

✅ **MongoDB Atlas**
- Connection string: `mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528.kd9hgkc.mongodb.net/?appName=DECP-CO528`
- IP access list includes: `0.0.0.0/0`

✅ **Auth0**
- Domain: `dev-ql54xjx71jnttf1o.us.auth0.com`
- API Identifier: `https://api.decp-co528.com`
- Web App Client ID: `MUKsKjXPuBpmgamSIKhFl62jhC1kqD88`
- Backend Client ID: `Px8nnn2M5DYGB39ZegCSrgRKqvITbCZ7`

✅ **Cloudflare R2**
- Bucket: `decp-co528`
- Account ID: `165871ed7eb878835d39fbb59c819caf`
- Public URL: `https://165871ed7eb878835d39fbb59c819caf.r2.cloudflarestorage.com`
- Access Key ID: `2d08079eafd184c91b9c9d4d21230288`
- Secret Key: (saved securely)

✅ **Upstash Redis**
- Endpoint: `https://magical-amoeba-78196.upstash.io`
- Token: (saved securely)

---

## Environment Setup

### Step 1: Clone Repository

```bash
cd d:\ACADEMICS\Semester\ 7\CO528\ Applied\ Software\ Architecture\6\ Mini\ Project
git clone <your-repo-url> Department-Engagement-and-Career-Platform
cd Department-Engagement-and-Career-Platform
```

### Step 2: Create Root `.gitignore`

Create file: `.gitignore` (in project root)

```bash
# Environment variables (NEVER commit these!)
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
.vscode/settings.json
.idea/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log

# Optional npm cache
.npm

# MacOS
.DS_Store

# IDE
.vscode/
.idea/
*.sublime-project
*.sublime-workspace

# OS
Thumbs.db
.env.production.local
.env.test.local

# Testing
coverage/
.nyc_output/

# Misc
.cache/
.parcel-cache/
dist/
```

**Important**: This prevents accidental commits of `.env` files containing real credentials.

### Step 3: Create Service Environment Files

**IMPORTANT: `.env.example` files already exist. You are creating SEPARATE `.env` files.**

Structure for each service:
```
services/user-service/
├── .env.example  ← ALREADY EXISTS (template, can be committed)
└── .env          ← CREATE THIS (actual values, in .gitignore, never committed)
```

For each service, create a `.env` file with your actual configuration.

#### **Template for all services** (services/{service-name}/.env):

```bash
# Core Configuration
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528.kd9hgkc.mongodb.net/?appName=DECP-CO528

# Auth0 Configuration (7 services only, NOT messaging-service)
AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
AUTH0_AUDIENCE=https://api.decp-co528.com

# Internal Service-to-Service Token
INTERNAL_TOKEN=dev-internal-token-12345678

# Service Port (change per service)
PORT=3001  # See table below for each service
```

#### **Create `.env` files for each service:**

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

**NOTE**: messaging-service currently doesn't have Auth0 auth. If it should be authenticated, add:
```bash
AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
AUTH0_AUDIENCE=https://api.decp-co528.com
```

### Step 4: Create Web App Environment Files

**Create: web/.env.development**
```bash
# Auth0 Configuration
VITE_AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
VITE_AUTH0_CLIENT_ID=MUKsKjXPuBpmgamSIKhFl62jhC1kqD88
VITE_AUTH0_AUDIENCE=https://api.decp-co528.com

# Service URLs (localhost for development)
VITE_USER_SERVICE_URL=http://localhost:3001
VITE_FEED_SERVICE_URL=http://localhost:3002
VITE_ANALYTICS_SERVICE_URL=http://localhost:3003
VITE_EVENT_SERVICE_URL=http://localhost:3004
VITE_JOB_SERVICE_URL=http://localhost:3005
VITE_NOTIFICATION_SERVICE_URL=http://localhost:3006
VITE_MESSAGING_SERVICE_URL=http://localhost:3007
VITE_RESEARCH_SERVICE_URL=http://localhost:3008

# Optional
VITE_DEV_HTTPS=0
```

**Create: web/.env.production.local**
```bash
# Same as .env.development for local testing
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
```

### Step 5: Verify Credentials

Before running, verify all external services are accessible:

```bash
# Test MongoDB Connection
# Use MongoDB Atlas UI or Compass:
# mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528.kd9hgkc.mongodb.net/?appName=DECP-CO528

# Test Auth0
# Go to: https://dev-ql54xjx71jnttf1o.us.auth0.com/.well-known/jwks.json
# Should return JSON with keys

# Test R2 Access
# AWS CLI (if installed):
# aws s3 ls s3://decp-co528 --endpoint-url https://165871ed7eb878835d39fbb59c819caf.r2.cloudflarestorage.com

# Test Redis (Upstash)
# Via REST API documentation or Redis client
```

---

## Service Configuration

### Service Port Mapping

| Service | Port | Description |
|---------|------|-------------|
| **user-service** | 3001 | User management, authentication |
| **feed-service** | 3002 | Feed/content management with R2 storage |
| **analytics-service** | 3003 | Analytics and reporting |
| **event-service** | 3004 | Event management |
| **job-service** | 3005 | Job postings and opportunities |
| **notification-service** | 3006 | Push notifications (called by other services) |
| **messaging-service** | 3007 | Messaging/chat (currently public) |
| **research-service** | 3008 | Research projects with R2 storage |

### Dependencies Between Services

```
Web App (localhost:5173)
├─ calls → user-service (3001)
├─ calls → feed-service (3002)
├─ calls → analytics-service (3003)
├─ calls → event-service (3004)
├─ calls → job-service (3005)
├─ calls → notification-service (3006)
├─ calls → messaging-service (3007)
└─ calls → research-service (3008)

Services inter-dependencies:
├─ feed-service → notification-service (3006)
├─ job-service → notification-service (3006)
├─ event-service → notification-service (3006)
└─ research-service → notification-service (3006)

External Dependencies:
├─ All → MongoDB Atlas
├─ 7 services → Auth0 JWKS
├─ feed-service → Upstash Redis
├─ feed-service → Cloudflare R2
└─ research-service → Cloudflare R2
```

---

## Running Services Locally

### Option A: Run All Services with npm (Recommended)

#### Step 1: Install Dependencies

```bash
# Install all dependencies across all services
npm install

# This runs the postinstall script which installs each service's dependencies
```

If that doesn't work, manually install:

```bash
# User service
cd services/user-service
npm install
cd ../..

# Repeat for all 8 services
cd services/feed-service && npm install && cd ../..
cd services/job-service && npm install && cd ../..
cd services/event-service && npm install && cd ../..
cd services/notification-service && npm install && cd ../..
cd services/research-service && npm install && cd ../..
cd services/analytics-service && npm install && cd ../..
cd services/messaging-service && npm install && cd ../..

# Web app
cd web
npm install
cd ..
```

#### Step 2: Run Services in Development Mode

You can run services in multiple ways:

**A. Sequential (one terminal window):**
```bash
npm run start:services
# This runs services/*/package.json "dev" script in sequence
```

**B. Parallel with concurrently:**
```bash
npm run start:all
# Runs all services and web app in parallel
```

**C. Individual Services (separate terminals):**

Terminal 1 - notification-service (start first, others depend on it):
```bash
cd services/notification-service
npm run start:dev
# Output: [notification-service] Running on http://localhost:3006/api/v1
```

Terminal 2 - user-service:
```bash
cd services/user-service
npm run start:dev
# Output: [user-service] Running on http://localhost:3001/api/v1
```

Terminal 3 - feed-service:
```bash
cd services/feed-service
npm run start:dev
# Output: [feed-service] Running on http://localhost:3002/api/v1
```

Terminal 4 - job-service:
```bash
cd services/job-service
npm run start:dev
# Output: [job-service] Running on http://localhost:3005/api/v1
```

Terminal 5 - event-service:
```bash
cd services/event-service
npm run start:dev
# Output: [event-service] Running on http://localhost:3004/api/v1
```

Terminal 6 - research-service:
```bash
cd services/research-service
npm run start:dev
# Output: [research-service] Running on http://localhost:3008/api/v1
```

Terminal 7 - analytics-service:
```bash
cd services/analytics-service
npm run start:dev
# Output: [analytics-service] Running on http://localhost:3003/api/v1
```

Terminal 8 - messaging-service:
```bash
cd services/messaging-service
npm run start:dev
# Output: [messaging-service] Running on http://localhost:3007/api/v1
```

**✅ All 8 services running when you see:**
```
[user-service] Running on http://localhost:3001/api/v1
[feed-service] Running on http://localhost:3002/api/v1
[analytics-service] Running on http://localhost:3003/api/v1
[event-service] Running on http://localhost:3004/api/v1
[job-service] Running on http://localhost:3005/api/v1
[notification-service] Running on http://localhost:3006/api/v1
[messaging-service] Running on http://localhost:3007/api/v1
[research-service] Running on http://localhost:3008/api/v1
```

### Option B: Run Services with Docker Compose

If Docker is set up:

```bash
docker-compose up --build
# All services start in containers on their respective ports
```

---

## Running Web App Locally

### Step 1: Install Dependencies

```bash
cd web
npm install
```

### Step 2: Run Development Server

```bash
npm run dev
# Output:
#   VITE v4.x.x  dev server running at:
#   ➜  Local:   http://localhost:5173/
#   ➜  press h to show help
```

### Step 3: Access Web App

Open browser: **http://localhost:5173**

You should see:
- DECP homepage
- Login button redirects to Auth0
- After login, dashboard loads with API data from services

### Step 4: Build Web App (Production-like Test)

```bash
npm run build
# Output:
#   ✓ 1234 modules transformed
#   dist/index.html                   14.23 kB │ gzip:  5.23 kB
#   dist/assets/index-xxx.js        245.68 kB │ gzip: 78.23 kB
#   ✓ built in 8.45s

npm run preview
# Output: 
#   > http://localhost:4173/
# Opens production build on different port
```

---

## Testing Connectivity

### Test 1: Service Health Checks

Each service has a health endpoint:

```bash
# Test each service is running
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
curl http://localhost:3006/health
curl http://localhost:3007/health
curl http://localhost:3008/health

# Expected response: { "status": "ok" }
```

### Test 2: API Endpoints (Unauthenticated)

```bash
# User service - create test account
curl -X POST http://localhost:3001/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com", "name": "Test User" }'

# Feed service - get feeds (no auth needed for some endpoints)
curl http://localhost:3002/api/v1/feeds

# Analytics - get stats
curl http://localhost:3003/api/v1/analytics/stats
```

### Test 3: Auth0 JWT Validation

First, get a valid JWT from Auth0:

```bash
# Get token from Auth0
curl -X POST https://dev-ql54xjx71jnttf1o.us.auth0.com/oauth/token \
  -H "content-type: application/json" \
  -d '{
    "client_id": "Px8nnn2M5DYGB39ZegCSrgRKqvITbCZ7",
    "client_secret": "cUL3geB08dQKE0yjMP3eOEm8UstPQrqIhF6EatRICN9Rnrz0G2AR_QVm_czfgmy0",
    "audience": "https://api.decp-co528.com",
    "grant_type": "client_credentials"
  }'

# Save the token
TOKEN="copy-from-response"

# Call protected endpoint with token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/users/profile
```

### Test 4: Service-to-Service Communication

Test notification service being called:

```bash
# Create event that triggers notification
curl -X POST http://localhost:3004/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Test Event" }'

# Check notification service logs for the internal call
# Should see: POST /api/v1/internal/notifications/notify
```

### Test 5: Web App Integration

1. Open http://localhost:5173
2. Click "Login"
3. Should redirect to Auth0 login page
4. Use Auth0 test user credentials
5. Should redirect back to dashboard
6. Dashboard should load data from services
7. Check browser Network tab - requests should hit localhost:3001-3008

---

## Troubleshooting

### Issue: "Port already in use"

**Error**: `Error: listen EADDRINUSE :::3001`

**Solution**:
```bash
# Find process using port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
PORT=3011 npm run start:dev
```

### Issue: "MongoDB connection refused"

**Error**: `MongooseError: connect ECONNREFUSED 127.0.0.1:27017`

**Likely Cause**: `MONGO_URI` is not set or wrong

**Solution**:
```bash
# Verify .env file exists and has MONGO_URI
cat services/user-service/.env | grep MONGO_URI

# Verify MongoDB Atlas access
# Go to MongoDB Atlas UI and check:
# 1. Database user exists: e20148_db_user
# 2. IP allowlist includes 0.0.0.0/0
# 3. Connection string matches exactly

# Test connection locally
npm run start:dev
# Check logs for "Successfully connected to MongoDB" message
```

### Issue: "Auth0 JWKS error" or "Invalid token"

**Error**: `UnauthorizedError: invalid_token`

**Likely Cause**: Auth0 credentials mismatch

**Solution**:
```bash
# Verify Auth0 environment variables
cat services/user-service/.env | grep AUTH0

# Expected values:
# AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
# AUTH0_AUDIENCE=https://api.decp-co528.com

# Verify Auth0 JWKS endpoint is accessible
curl https://dev-ql54xjx71jnttf1o.us.auth0.com/.well-known/jwks.json
# Should return JSON with "keys" array

# Verify token has correct audience claim
# Decode token at jwt.io and check "aud" claim equals AUTH0_AUDIENCE
```

### Issue: "Notification service not reachable"

**Error**: `FetchError: fetch failed` in job/event/feed/research service logs

**Likely Cause**: notification-service not running or wrong port

**Solution**:
```bash
# Verify notification-service is running
curl http://localhost:3006/health
# Should return { "status": "ok" }

# Verify NOTIFICATION_SERVICE_URL in other services
cat services/feed-service/.env | grep NOTIFICATION_SERVICE_URL
# Should be: NOTIFICATION_SERVICE_URL=http://localhost:3006

# Check notification-service logs for errors
cd services/notification-service
npm run start:dev
# Watch for startup messages
```

### Issue: "Redis connection failed" (feed-service)

**Error**: `Error: getaddrinfo ENOTFOUND magical-amoeba-78196.upstash.io`

**Likely Cause**: Redis URL is wrong or network issue

**Solution**:
```bash
# Verify Redis URL in .env
cat services/feed-service/.env | grep REDIS_URL

# Should be: REDIS_URL=https://magical-amoeba-78196.upstash.io
# Or: UPSTASH_REDIS_REST_URL=https://magical-amoeba-78196.upstash.io

# Test network access from your computer
ping magical-amoeba-78196.upstash.io

# Verify Upstash credentials in Auth0 dashboard
```

### Issue: "R2 access denied" (feed-service, research-service)

**Error**: `NoSuchBucket` or `AccessDenied`

**Likely Cause**: R2 credentials are wrong

**Solution**:
```bash
# Verify R2 environment variables
cat services/feed-service/.env | grep R2_

# Should have:
# R2_ACCOUNT_ID=165871ed7eb878835d39fbb59c819caf
# R2_ACCESS_KEY_ID=2d08079eafd184c91b9c9d4d21230288
# R2_SECRET_ACCESS_KEY=...
# R2_BUCKET_NAME=decp-co528
# R2_PUBLIC_URL=https://165871ed7eb878835d39fbb59c819caf.r2.cloudflarestorage.com

# Verify bucket exists
# Go to Cloudflare R2 UI and check bucket "decp-co528" exists
```

### Issue: "Web app login not working"

**Error**: Redirects to Auth0, but doesn't come back or goes to wrong page

**Likely Cause**: Auth0 callback URLs not configured correctly

**Solution**:
1. **Remove old config from Auth0 if from previous attempt**
   - Go to Auth0 Dashboard → Applications → DECP-CO528-WEB
   - Settings tab → Allowed Callback URLs
   
2. **Verify actual localhost URL**
   ```bash
   # Check what port web app is running on
   # Should be http://localhost:5173
   ```

3. **Add correct callback URLs in Auth0**:
   - Allowed Callback URLs: `http://localhost:5173/callback`
   - Allowed Logout URLs: `http://localhost:5173`
   - Allowed Web Origins: `http://localhost:5173`

4. **Restart web app**:
   ```bash
   npm run dev
   ```

### Issue: "npm ERR! code E404"

**Error**: `npm error code E404 not found - GET`

**Likely Cause**: Package doesn't exist or typo in name

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install

# For individual services
cd services/user-service
rm -rf node_modules package-lock.json
npm install
```

---

## Service Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Web App (React + Vite)                   │
│                     http://localhost:5173                   │
│            Authenticated via Auth0 (Bearer Token)            │
└────────────────┬───────────────────────────────────────────┘
                 │ Uses Auth0 for login/logout
                 ├──────────────────────────────────┐
                 │                                  │
            ┌────▼────────────┐        Auth0 JWKS  │
            │  Auth0 Service  │◄──────────────────┘
            │ dev-ql54xjx..   │
            └────────────────┘


  ┌───────────────────────────────────────────────────────────────────┐
  │                      Local Backend Services                       │
  │  (All with MongoDB + Auth0 JWT + Optional Redis/R2)              │
  └───────────────────────────────────────────────────────────────────┘
  
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │user-service  │  │feed-service  │  │analytics-svc │  │event-service │
  │:3001         │  │:3002 + R2    │  │:3003         │  │:3004         │
  │ - Auth       │  │ + Redis      │  │ - Analytics  │  │ - Events     │
  │ - Users      │  │ - Feed/Posts │  │ - Metrics    │  │ - Meetings   │
  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
  
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │job-service   │  │notification  │  │messaging-svc │  │research-svc  │
  │:3005         │  │:3006         │  │:3007 (public)│  │:3008 + R2    │
  │ - Jobs       │  │ - Alerts     │  │ - Chat       │  │ - Research   │
  │ - Postings   │  │ - Notif.     │  │ - Messages   │  │ - Projects   │
  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
  
  All services call notification-service (3006) for alerts
  
  External Dependencies:
  ┌─────────────────────────────────────────────────────────────────┐
  │  MongoDB Atlas  │  Auth0 JWKS  │  Redis (Upstash)  │  R2 Storage │
  │  (all services) │  (7 services)│  (feed-service)   │ (feed+rsrch)│
  └─────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

Once everything is running locally:

1. **Test the login flow**: Click login on web app, authenticate with Auth0
2. **Try creating content**: Use web app to create feeds, events, jobs
3. **Monitor service logs**: Watch terminal logs for API calls and errors
4. **Check database**: MongoDB Atlas UI shows created documents in real-time
5. **Prepare for Phase 2**: When ready, follow DEPLOYMENT.md for Render

---

## Performance Tips

### Run Only What You Need

```bash
# If you don't need analytics
cd services/analytics-service
# Don't run this

# If you don't need messaging
cd services/messaging-service
# Don't run this

# Minimum: user, notification, event, job, feed
# These are core functionality
```

### Monitor Resource Usage

On Windows, services use memory/CPU. To reduce:

```bash
# Use lighter build tool
npm run build:dev  # Instead of full build

# Or limit Node.js memory
set NODE_OPTIONS=--max-old-space-size=512
npm run start:dev
```

### Cache Layer

Feed-service uses Redis. For development, can disable it if not testing feed caching:

```bash
# In services/feed-service/.env
# Comment out or remove REDIS_URL
# Services will work without it (just no caching)
```

---

## Getting Help

- **Service Logs**: Check terminal output for detailed error messages
- **MongoDB**: Use Atlas UI to inspect collections
- **Auth0**: Use Dashboard to validate configuration
- **HTTP Requests**: Use Postman or VS Code REST Client
- **Network Inspector**: Use browser DevTools (F12) → Network tab
- **Git**: `git status` to verify `.env` files are not tracked

---

## Summary Checklist

Before starting Phase 2 (Render deployment):

- [ ] `.gitignore` created (root and verified)
- [ ] All 9 `.env` files created with actual values
- [ ] MongoDB connection working (`npm run start:dev` connects)
- [ ] Auth0 credentials verified (JWKS endpoint accessible)
- [ ] Redis accessible (feed-service logs show connection OK)
- [ ] R2 credentials verified (feed & research services can upload)
- [ ] All 8 services running locally on correct ports
- [ ] Web app runs on http://localhost:5173
- [ ] Login flow works (redirects to Auth0 and back)
- [ ] API calls from web app reach services
- [ ] No sensitive data in version control (check `git status`)

When all checkboxes pass, you're ready for Phase 2 deployment!

