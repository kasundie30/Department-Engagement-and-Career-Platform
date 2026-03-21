# Deployment Guide: Render Services + Vercel Web App

This guide walks you through deploying the Department Engagement and Career Platform to production using Render for services and Vercel for the web frontend.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Phase 1: Set Up External Services](#phase-1-set-up-external-services)
3. [Phase 2: Deploy Services to Render](#phase-2-deploy-services-to-render)
4. [Phase 3: Deploy Web App to Vercel](#phase-3-deploy-web-app-to-vercel)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 18+ (for local testing)
- GitHub account (for repository linking)
- Render account (free tier: https://render.com)
- Vercel account (free tier: https://vercel.com)
- Auth0 account (free tier: https://auth0.com)
- Cloudflare account (for R2 object storage: https://cloudflare.com)
- Upstash account (for Redis: https://upstash.com)
- MongoDB Atlas account (free tier: https://www.mongodb.com/cloud/atlas)

---

## Phase 1: Set Up External Services

### 1.1 MongoDB Atlas (Database)

1. **Create a free cluster:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up / Log in
   - Click "Create Deployment" → Choose "Free" tier
   - Select a region close to your Render services (e.g., `us-east-1`)
   - Wait for cluster to be ready (~3 minutes)

2. **Create a database user:**
   - GO to "Security" → "Database Access" → "Add New Database User"
   - Username: `miniproject_user` (or your choice)
   - Password: Generate a strong password and save it
   - Privileges: "Read and write to any database"
   - Click "Add User"

3. **Add IP whitelist:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - For development: Use your current IP or `0.0.0.0/0` (allow all)
   - For production: Add only Render's IP range (see Render dashboard)

4. **Get connection string:**
   - Click "Connect" on your cluster
   - Choose "Drivers" → Node.js
   - Copy the connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/database`)
   - Save this for later; you'll use it for all 8 services

---

### 1.2 Auth0 (Authentication)

1. **Create Auth0 tenant:**
   - Go to [Auth0](https://auth0.com)
   - Sign up / Log in
   - Go to the Auth0 Dashboard
   - Note your **Domain** (e.g., `your-tenant.auth0.com`)

2. **Create API:**
   - Left sidebar: "Applications" → "APIs"
   - Click "Create API"
   - Name: `MiniProject API`
   - Identifier: `https://api.miniproject.com`
   - Signing Algorithm: `RS256`
   - Click "Create"

3. **Create SPA application (for web frontend):**
   - Left sidebar: "Applications" → "Applications"
   - Click "Create Application"
   - Name: `MiniProject Web`
   - Application Type: "Single Page Application"
   - Technology: "React"
   - Click "Create"

4. **Configure SPA application:**
   - On the SPA settings page, go to "Settings" tab
   - **Allowed Callback URLs:**
     ```
     http://localhost:5173/callback
     https://your-vercel-domain.vercel.app/callback
     ```
   - **Allowed Logout URLs:**
     ```
     http://localhost:5173
     https://your-vercel-domain.vercel.app
     ```
   - **Allowed Web Origins:**
     ```
     http://localhost:5173
     https://your-vercel-domain.vercel.app
     ```
   - Click "Save Changes"
   - Save the **Client ID** from the top of this page

5. **Create Machine-to-Machine application (for backend services to services):**
   - Left sidebar: "Applications" → "Applications"
   - Click "Create Application"
   - Name: `MiniProject Backend`
   - Application Type: "Machine to Machine Applications"
   - Click "Create"
   - In "Applications" tab, select the new M2M app
   - Save the **Client ID** and **Client Secret** (you may need these for service-to-service auth)

6. **Add roles to API (for RBAC):**
   - Left sidebar: "User Management" → "Roles"
   - Click "Create Role"
   - Name: `admin`
   - Description: `Administrator role`
   - Click "Create"
   - Repeat for other roles: `moderator`, `student`, `faculty`, etc.

---

### 1.3 Cloudflare R2 (Object Storage)

1. **Create R2 bucket:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Left sidebar: "R2"
   - Click "Create Bucket"
   - Name: `miniproject` (must be lowercase, globally unique)
   - Region: Default/Auto
   - Click "Create Bucket"

2. **Create R2 API token:**
   - Left sidebar: "R2" → "Settings"
   - Scroll to "API Tokens"
   - Click "Create API Token"
   - **Token Name:** `miniproject-render`
   - **Permissions:** "Object Read & Write"
   - **Bucket:** Select `miniproject`
   - **TTL:** Leave blank (never expires)
   - Click "Create API Token"
   - Save these values:
     - `Access Key ID`
     - `Secret Access Key`
     - **Account ID** (visible at top of R2 page, format: `xxxxxxxxxxxxxxxxxxxx`)

3. **Get public bucket URL:**
   - In R2 "Buckets", click on `miniproject`
   - Scroll to "Bucket details"
   - Copy the **S3 API URL** (format: `https://xxxxx.r2.cloudflarestorage.com`)
   - This will be your `R2_PUBLIC_URL` for the services

---

### 1.4 Upstash Redis (Cache & Message Queue)

1. **Create Redis database:**
   - Go to [Upstash Console](https://console.upstash.com/)
   - Click "Create Database"
   - **Name:** `miniproject-redis`
   - **Region:** Select US-East (or close to your Render region)
   - **Type:** Redis (not Kafka)
   - Click "Create"

2. **Get connection details:**
   - Click on your database
   - Copy these values from the "REST API" or "Redis" section:
     - **REDIS_URL** (format: `redis://default:password@host:port`)
     - Or if using Upstash REST API client, note the endpoint

---

## Phase 2: Deploy Services to Render

All 8 services are identical in deployment process. Repeat for each:
- `user-service` (port 3001)
- `analytics-service` (port 3003)
- `event-service` (port 3004)
- `feed-service` (port 3002)
- `job-service` (port 3005)
- `messaging-service` (port 3007)
- `notification-service` (port 3006)
- `research-service` (port 3008)

### 2.1 Deploy First Service (user-service) on Render

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment: Auth0, R2, Upstash"
   git push origin main
   ```

2. **Create Web Service on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New+" → "Web Service"
   - Choose "Deploy an existing repository"
   - Connect your GitHub repository
   - Click "Connect"

3. **Configure service:**
   - **Name:** `user-service`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node dist/main`
   - **Branch:** `main` (or your branch)

4. **Add environment variables:**
   - Scroll to "Environment Variables"
   - Click "Add from .env.example"
   - OR manually add:
     ```
     NODE_ENV=production
     PORT=3001
     MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/miniproject_db
     REDIS_URL=redis://default:password@host:port
     AUTH0_DOMAIN=your-tenant.auth0.com
     AUTH0_AUDIENCE=https://api.miniproject.com
     INTERNAL_TOKEN=miniproject-internal-auth-token
     ```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for build to complete (3-5 minutes)
   - Once live, you'll get a URL like: `https://user-service-xyz.onrender.com`

6. **Save the service URL:**
   - Copy the full URL (e.g., `https://user-service-abc123.onrender.com`)
   - Add to a checklist for later

### 2.2 Deploy Other Services

Repeat **2.1** for each remaining service. Key differences:

| Service | Port | Extra Env Vars |
|---------|------|---|
| `user-service` | 3001| |
| `analytics-service` | 3003 | |
| `event-service` | 3004 | `NOTIFICATION_SERVICE_URL` |
| `feed-service` | 3002 | `NOTIFICATION_SERVICE_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` |
| `job-service` | 3005 | `NOTIFICATION_SERVICE_URL` |
| `messaging-service` | 3007 | |
| `notification-service` | 3006 | |
| `research-service` | 3008 | `NOTIFICATION_SERVICE_URL`, `R2_*` vars |

**For services with `NOTIFICATION_SERVICE_URL`:** Deploy `notification-service` first, then add its URL when deploying the others.

---

## Phase 3: Deploy Web App to Render (Static Site)

Render is excellent for hosting React/Vite applications and uses their global CDN.

1. **Create Web Site on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New+" → **"Static Site"** (Do not choose Web Service)
   - Connect your GitHub repository

2. **Configure Static Site:**
   - **Name:** `miniproject-web`
   - **Build Command:** `cd web && npm install && npm run build`
   - **Publish Directory:** `web/dist`
   - **Branch:** `main`

3. **Add Environment Variables:**
   - Under "Advanced" → "Environment Variables", add all your `VITE_*` variables.
   ```
   VITE_AUTH0_DOMAIN=your-tenant.auth0.com
   VITE_AUTH0_CLIENT_ID=<spa-app-client-id-from-auth0>
   VITE_AUTH0_AUDIENCE=https://api.miniproject.com
   VITE_USER_SERVICE_URL=https://user-service-xyz.onrender.com
   VITE_FEED_SERVICE_URL=https://feed-service-xyz.onrender.com
   VITE_JOB_SERVICE_URL=https://job-service-xyz.onrender.com
   VITE_EVENT_SERVICE_URL=https://event-service-xyz.onrender.com
   VITE_NOTIFICATION_SERVICE_URL=https://notification-service-xyz.onrender.com
   VITE_RESEARCH_SERVICE_URL=https://research-service-xyz.onrender.com
   VITE_ANALYTICS_SERVICE_URL=https://analytics-service-xyz.onrender.com
   VITE_MESSAGING_SERVICE_URL=https://messaging-service-xyz.onrender.com
   ```

4. **Deploy & Add Redirect Rules (Important for React Router):**
   - Click "Create Static Site"
   - Once the deployment finishes, you will get a URL like `https://miniproject-web.onrender.com`
   - Go to the **Redirects/Rewrites** tab for this Static Site in Render.
   - Add a rule to support React Router:
     - **Source:** `/*`
     - **Destination:** `/index.html`
     - **Action:** `Rewrite`
   - Click "Save Changes"

5. **Configure Auth0 callback:**
   - Go back to Auth0 Dashboard → Applications → Your SPA
   - Update "Allowed Callback URLs" to include your Render URL:
     ```
     https://miniproject-web.onrender.com/callback
     ```
   - Update "Allowed Logout URLs":
     ```
     https://miniproject-web.onrender.com
     ```
   - Update "Allowed Web Origins":
     ```
     https://miniproject-web.onrender.com
     ```
   - Click "Save Changes"

---

## Post-Deployment Configuration

### 4.1 Update Auth0 Roles Claim

To properly pass roles from Auth0 to your services:

1. Go to Auth0 Dashboard → User Management → Roles
2. For each role (e.g., `admin`, `student`), note the role ID
3. Go to "Actions" → "Flows" → "Post-Login"
4. Create a new action:
   ```javascript
   exports.onExecutePostLogin = async (event, api) => {
     const namespace = event.client.metadata?.roles_namespace || 'https://api.miniproject.com/roles';
     const roles = (event.authorization?.roles || []).map(r => r.name);
     api.idToken.setCustomClaim(`${namespace}/roles`, roles);
     api.accessToken.setCustomClaim(`${namespace}/roles`, roles);
   };
   ```
5. Bind this Action to your SPA application

### 4.2 Test End-to-End

1. **Open your Render Web URL:** `https://your-domain.onrender.com`
2. **Click "Login"** → Should redirect to Auth0
3. **Log in with Auth0** → Should redirect back to your app
4. **Dashboard should load** → API calls should hit backend Render services
5. **Check browser DevTools (Network tab)** → Requests should go to `https://...-xyz.onrender.com/api/v1/...`

### 4.3 Set Up Error Monitoring (Optional)

Consider adding error tracking:
- [Sentry](https://sentry.io) for both backend and frontend
- [LogRocket](https://logrocket.com) for frontend replay

---

## Centralized Service URLs

All service URLs are configured in **one place** for easy updates:

### For Services:
- Edit respective `.env` files on Render backend dashboards

### For Web App:
- Edit environment variables on Render Static Site dashboard
- File: `web/src/config/services.ts` (contains fallback localhost URLs for development)

To update all service URLs:
1. On Render Static Site dashboard, click "Environment"
2. Update all `VITE_*_SERVICE_URL` variables with new Backend URLs
3. Trigger a manual deploy

---

## Troubleshooting

### Service won't build on Render
- **Symptom:** Build fails with "npm ERR! code E..."
- **Solution:** Check Render logs, ensure `package.json` and `package-lock.json` are in sync
  ```bash
  cd services/user-service
  npm install --legacy-peer-deps
  ```

### Services can't connect to MongoDB
- **Symptom:** `MongooseError: connect ECONNREFUSED`
- **Solution:** 
  - Verify `MONGO_URI` is correct in Render environment variables
  - In MongoDB Atlas, check IP whitelist includes `0.0.0.0/0` or Render's IPs
  - Test connection locally:
    ```bash
    npm run start:prod
    ```

### Auth0 login not redirecting back
- **Symptom:** Stuck on Auth0 login page
- **Solution:**
  - Verify Render Web URL is in Auth0 "Allowed Callback URLs"
  - Check `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENT_ID` in Render env vars
  - Clear browser cookies and cache, try again

### Services can't reach each other
- **Symptom:** Feed service can't send notifications (logs show connection refused)
- **Solution:**
  - On Render, go to service settings
  - Verify `NOTIFICATION_SERVICE_URL` environment variable is set correctly
  - Try pinging the notification service URL manually from another service's logs

### CORS errors in browser console
- **Symptom:** `Access to XMLHttpRequest ... has been blocked by CORS policy`
- **Solution:**
  - Ensure all services have proper CORS headers
  - In NestJS services, enable CORS in `main.ts`:
    ```typescript
    app.enableCors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
    });
    ```

### Render Health Check 404 Error (`Cannot GET /` or `Cannot HEAD /`)
- **Symptom:** In Render logs, you see `ERROR [AllExceptionsFilter] [HTTP 404] HEAD / - Error Trace: NotFoundException: Cannot HEAD /` immediately after deployment.
- **Why it happens:** Render's automated health checker pings the root URL (`/`) to see if the service is alive. Your NestJS apis are all prefixed with `/api/v1...`, so the root route returns a 404 Not Found. This is completely harmless and your app is actually running fine.
- **Solution:** 
  - Go to your Render Web Service settings.
  - Scroll down to **Advanced** → **Health Check Path**.
  - Change it from `/` to `/api/v1/health`. 
  - Render will now ping your actual health endpoint and you won't see those 404 logs.

---

## Master Checklist: Where to Make Changes for Deployment

When moving to production, here is the master list of everything you need to change across code and dashboards:

### 1. In Code (Repository)
There are almost NO hardcoded production values in the codebase. Everything is strictly environment-variable driven.
- **Code Change:** You do NOT need to change code to deploy. The architecture is ready.
- **CORS Config:** In each service's `main.ts`, ensure `app.enableCors()` allows your Front-End URL. (Already handled via `process.env.FRONTEND_URL || '*'` fallback).

### 2. Render Settings (Backend Dashboards)
For **every** service deployed (8 total), you must configure the "Environment Variables" tab in Render:
- Set `NODE_ENV` to `production`
- Set `MONGO_URI` to your MongoDB Atlas connection string (use the SAME string for all 8)
- Set `AUTH0_DOMAIN` to `dev-ql54xjx71jnttf1o.us.auth0.com`
- Set `AUTH0_AUDIENCE` to `https://api.decp-co528.com`
- Set `REDIS_URL` in `feed-service` to your Upstash URL `rediss://...`
- Set `R2_*` variables in `feed-service` and `research-service`
- Set `NOTIFICATION_SERVICE_URL` to your live Render notification-service URL where required
- Set **Health Check Path** under Advanced settings to `/api/v1/health`

### 3. Render Settings (Frontend Static Site Dashboard)
In the Render Dashboard for your `web` Static Site, go to **Environment** and add:
- `VITE_AUTH0_DOMAIN` = `dev-ql54xjx71jnttf1o.us.auth0.com`
- `VITE_AUTH0_CLIENT_ID` = `MUKsKjXPuBpmgamSIKhFl62jhC1kqD88`
- `VITE_AUTH0_AUDIENCE` = `https://api.decp-co528.com`
- **Crucial Step:** Create 8 variables mapping to your Render services:
  - `VITE_USER_SERVICE_URL` = `https://user-service-xxxx.onrender.com`
  - `VITE_FEED_SERVICE_URL` = `https://feed-service-xxxx.onrender.com`
  - `VITE_JOB_SERVICE_URL` = `https://job-service-xxxx.onrender.com`
  - (and so on for all 8 microservices)

### 4. Auth0 Dashboard Settings
- **Application URIs:** In your Auth0 SPA Application settings, add your Render Web domain (`https://miniproject-web.onrender.com`) to:
  - Allowed Callback URLs
  - Allowed Logout URLs
  - Allowed Web Origins

### 5. MongoDB Atlas Settings
- **Network Access:** Ensure your MongoDB Network Access IP Whitelist includes Render's IP addresses, or use `0.0.0.0/0` (Allow Access from Anywhere) if Render IPs are dynamic.

## Support & Resources

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Auth0 Docs:** https://auth0.com/docs
- **Cloudflare R2 Docs:** https://developers.cloudflare.com/r2/
- **Upstash Docs:** https://upstash.com/docs
- **NestJS Deployment:** https://docs.nestjs.com/deployment

