# Render + Vercel Deployment Plan (Revised)

## Summary of Decisions
| Concern | Solution |
|---|---|
| Auth | **Auth0** (free tier) replaces Keycloak everywhere |
| Object Storage | **Cloudflare R2** (S3-compatible) replaces MinIO |
| Cache | **Upstash Redis** (free tier) replaces local Redis |
| Database | **MongoDB Atlas** (one free cluster, shared) |
| Container | **No Docker** — Render native Node.js environment |

---

## Proposed Changes

### 1. Delete Docker Files (all 8 services)

Remove [Dockerfile](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/job-service/Dockerfile), [Dockerfile.deploy](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/research-service/Dockerfile.deploy), [.dockerignore](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/job-service/.dockerignore) from every service directory. Render will use native Node.js build instead.

---

### 2. Auth0 JWT Strategy — All 8 Services

#### MODIFY [src/auth/strategies/jwt.strategy.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/user-service/src/auth/strategies/jwt.strategy.ts) (all services)

Replace static `KEYCLOAK_PUBLIC_KEY` with dynamic Auth0 JWKS endpoint verification using `jwks-rsa`. New env vars needed per service:

| Env Var | Value |
|---|---|
| `AUTH0_DOMAIN` | `your-tenant.auth0.com` |
| `AUTH0_AUDIENCE` | API identifier from Auth0 dashboard |

#### MODIFY [package.json](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/web/package.json) (all 8 services) — add `jwks-rsa`

---

### 3. Internal Service URLs — feed, job, event, research services

Currently hardcoded Kubernetes DNS:
```
http://notification-service.miniproject.svc.cluster.local:3006/...
```

Replace with env var `NOTIFICATION_SERVICE_URL`. New env var per affected service:

| Env Var | Value |
|---|---|
| `NOTIFICATION_SERVICE_URL` | `https://<your-notification-service>.onrender.com` |

---

### 4. Cloudflare R2 — feed-service

#### DELETE [src/minio/minio.service.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/feed-service/src/minio/minio.service.ts)
#### NEW `src/r2/r2.service.ts` — AWS SDK v3 S3 client pointed at R2 endpoint

New env vars:
| Env Var | Value |
|---|---|
| `R2_ACCOUNT_ID` | From Cloudflare dashboard |
| `R2_ACCESS_KEY_ID` | R2 API token Access Key |
| `R2_SECRET_ACCESS_KEY` | R2 API token Secret Key |
| `R2_BUCKET_NAME` | Bucket name |
| `R2_PUBLIC_URL` | Public bucket URL (e.g. `https://pub-xxx.r2.dev`) |

#### MODIFY [feed.module.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/feed-service/src/feed/feed.module.ts) — MinioService → R2Service
#### MODIFY [feed-service/package.json](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/feed-service/package.json) — remove `minio`, add `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`

---

### 5. Cloudflare R2 — research-service

#### MODIFY [src/research/research.service.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/research-service/src/research/research.service.ts) — replace MinIO client with AWS SDK v3 S3 client
#### MODIFY [research-service/package.json](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/research-service/package.json) — remove `minio`, add `@aws-sdk/client-s3`

---

### 6. Web App — Auth0 Migration

#### MODIFY [web/package.json](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/web/package.json) — remove `keycloak-js`, add `@auth0/auth0-react`
#### REPLACE [web/src/lib/keycloak.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/web/src/lib/keycloak.ts) → `web/src/lib/auth0Config.ts`
#### REPLACE [web/src/contexts/AuthContext.tsx](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/web/src/contexts/AuthContext.tsx) — use `useAuth0` from @auth0/auth0-react
#### MODIFY [web/src/lib/axios.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/web/src/lib/axios.ts) — get token from Auth0 hook instead of Keycloak
#### MODIFY [web/src/main.tsx](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/web/src/main.tsx) — wrap with `Auth0Provider`

New web env vars:
| Env Var | Value |
|---|---|
| `VITE_AUTH0_DOMAIN` | `your-tenant.auth0.com` |
| `VITE_AUTH0_CLIENT_ID` | SPA client ID from Auth0 dashboard |
| `VITE_AUTH0_AUDIENCE` | API audience identifier |

---

### 7. Web App — Centralized Service URLs

#### NEW `web/src/config/services.ts`

Single source of truth for all 8 Render service URLs via `VITE_*` env vars.

#### MODIFY [web/src/lib/axios.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/web/src/lib/axios.ts)

Intercept requests matching `/api/v1/{service-name}/...`, extract the service name, look it up in `services.ts`, and prepend the correct Render base URL. No component changes needed.

#### MODIFY [web/vite.config.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/web/vite.config.ts) — remove Kubernetes ingress proxy config

#### NEW `web/.env.example` — document all 11 VITE_ env vars

---

### 8. Service `.env.example` Files — All 8 Services

One `.env.example` per service documenting required vars.

---

### 9. Documentation

#### NEW `docs/DEPLOYMENT.md`

Step-by-step guide: MongoDB Atlas → Auth0 → R2 → Upstash → Render (8 services) → Vercel (web).

---

## Verification Plan

### Build Test
```powershell
cd web && npm install && npm run build
```

### Render Health Check
After deploy, hit `GET https://<service>.onrender.com/api/v1/health` for each service.

### End-to-End
Open Vercel URL → Auth0 login redirect → dashboard loads data from Render services.
