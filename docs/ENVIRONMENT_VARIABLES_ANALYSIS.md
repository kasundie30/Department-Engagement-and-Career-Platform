# Environment Variables & Configuration Analysis

## Executive Summary

All services access environment variables directly via `process.env` pattern. Auth0 is implemented in 7 out of 8 services. Environment variable names are **fixed and not flexible**—the code explicitly looks for specific names like `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, etc.

---

## 1. Environment Variable Usage Patterns

### Direct Access Pattern (All Services)
All services use direct `process.env` access instead of NestJS `ConfigService`:

```typescript
const port = process.env.PORT ?? 3001;
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/miniproject_db';
const domain = process.env.AUTH0_DOMAIN || '';
```

**Files affected:**
- `services/*/src/main.ts` — PORT retrieval
- `services/*/src/app.module.ts` — MONGO_URI configuration
- `services/*/src/auth/strategies/jwt.strategy.ts` — AUTH0_DOMAIN, AUTH0_AUDIENCE
- `services/*/src/**/*.service.ts` — Various service-specific env vars

---

## 2. Configuration Files Structure

### Backend Services (.env.example)

All 8 services follow the same .env.example structure:

```
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.miniproject.com

# Database
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/miniproject_db

# Server
PORT=3001
NODE_ENV=production

# Internal Service Token
INTERNAL_TOKEN=miniproject-internal-auth-token
```

**Service-Specific Extensions:**

- **feed-service, research-service** — Add R2 (Cloudflare) config:
  ```
  R2_ACCOUNT_ID=your-account-id
  R2_ACCESS_KEY_ID=your-access-key
  R2_SECRET_ACCESS_KEY=your-secret-key
  R2_BUCKET_NAME=miniproject
  R2_PUBLIC_URL=https://pub-xyz.r2.dev
  ```

- **feed-service** — Also supports MinIO (local development):
  ```
  MINIO_ENDPOINT=localhost
  MINIO_PORT=9000
  MINIO_USE_SSL=false
  MINIO_ACCESS_KEY=rootuser
  MINIO_SECRET_KEY=rootpassword123
  MINIO_BUCKET_NAME=miniproject
  ```

- **feed-service** — Redis cache:
  ```
  REDIS_URL=redis://default:password@host:port
  ```

- **All Services** — Notification service URL:
  ```
  NOTIFICATION_SERVICE_URL=http://localhost:3006
  ```

### Web Frontend (.env.example)

Uses VITE_ prefix for Vite runtime access:

```
# Auth0 Configuration
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-singlepage-app-client-id
VITE_AUTH0_AUDIENCE=https://api.miniproject.com

# Service URLs (update after deploying to Render)
VITE_USER_SERVICE_URL=https://user-service-xyz.onrender.com
VITE_FEED_SERVICE_URL=https://feed-service-xyz.onrender.com
VITE_JOB_SERVICE_URL=https://job-service-xyz.onrender.com
... (8 services total)
```

---

## 3. Auth0 Integration Status

### ✅ Services WITH Auth0 Implemented (7/8)

All these services import and use `AuthModule`:

| Service | Port | Files | JWT Guard Applied |
|---------|------|-------|-------------------|
| **user-service** | 3001 | [jwt.strategy.ts](services/user-service/src/auth/strategies/jwt.strategy.ts), [auth.module.ts](services/user-service/src/auth/auth.module.ts), [users.controller.ts](services/user-service/src/users/users.controller.ts) | ✅ Yes (class-level) |
| **job-service** | 3005 | [jwt.strategy.ts](services/job-service/src/auth/strategies/jwt.strategy.ts), [auth.module.ts](services/job-service/src/auth/auth.module.ts), [jobs.controller.ts](services/job-service/src/jobs/jobs.controller.ts) | ✅ Yes (class-level) |
| **event-service** | 3004 | [jwt.strategy.ts](services/event-service/src/auth/strategies/jwt.strategy.ts), [auth.module.ts](services/event-service/src/auth/auth.module.ts), [events.controller.ts](services/event-service/src/events/events.controller.ts) | ✅ Yes (class-level) |
| **feed-service** | 3002 | [jwt.strategy.ts](services/feed-service/src/auth/strategies/jwt.strategy.ts), [auth.module.ts](services/feed-service/src/auth/auth.module.ts), [feed.controller.ts](services/feed-service/src/feed/feed.controller.ts) | ✅ Yes (class-level) |
| **notification-service** | 3006 | [jwt.strategy.ts](services/notification-service/src/auth/strategies/jwt.strategy.ts), [auth.module.ts](services/notification-service/src/auth/auth.module.ts), [notifications.controller.ts](services/notification-service/src/notifications/notifications.controller.ts) | ✅ Yes (class-level) |
| **research-service** | 3008 | [jwt.strategy.ts](services/research-service/src/auth/strategies/jwt.strategy.ts), [auth.module.ts](services/research-service/src/auth/auth.module.ts), [research.controller.ts](services/research-service/src/research/research.controller.ts) | ✅ Yes (class-level) |
| **analytics-service** | 3003 | [jwt.strategy.ts](services/analytics-service/src/auth/strategies/jwt.strategy.ts), [auth.module.ts](services/analytics-service/src/auth/auth.module.ts), [analytics.controller.ts](services/analytics-service/src/analytics/analytics.controller.ts) | ✅ Yes (class-level) |

### ❌ Service WITHOUT Auth0 Implementation (1/8)

| Service | Port | Status |
|---------|------|--------|
| **messaging-service** | 3007/3000 | ❌ NO — Has `.env.example` with AUTH0 vars, but [app.module.ts](services/messaging-service/src/app.module.ts) does NOT import AuthModule |

**Location:** [services/messaging-service/src/app.module.ts](#)

---

## 4. Auth0 Integration Details

### JWT Strategy Implementation Pattern

All 7 services use identical pattern:

```typescript
// services/*/src/auth/strategies/jwt.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const domain = process.env.AUTH0_DOMAIN || '';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: process.env.AUTH0_AUDIENCE,
      issuer: domain ? `https://${domain}/` : undefined,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `https://${domain}/.well-known/jwks.json`,
      }),
    });
  }

  validate(payload: any) {
    const userId = payload.sub.split('|')[1] || 
                  `${payload.sub}@auth0.local`;
    
    // Extract roles from custom namespace claim
    const roles = payload[`${process.env.AUTH0_AUDIENCE}/roles`] || [];
    
    return { userId, email: payload.email, roles };
  }
}
```

**Key Implementation Points:**
- Uses `jwks-rsa` to fetch Auth0 public keys dynamically
- Configurable via `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` environment variables
- **Role claim naming is dynamic:** `${AUTH0_AUDIENCE}/roles` (e.g., `https://api.miniproject.com/roles`)
- All services use RS256 algorithm (asymmetric)

### Auth0 Roles Storage

Auth0 stores custom roles in a **namespace claim**. The current code expects:

```
payload['https://api.miniproject.com/roles'] = ['admin', 'professor']
```

This requires Auth0 Actions configuration to add roles claim to tokens. (See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for Post-Login Action setup)

### Guard Application

All authenticated services apply `@UseGuards(JwtAuthGuard)` at the **controller class level**:

```typescript
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)  // Protects all routes
export class UsersController { ... }
```

Additional role-based checks use `@UseGuards(RolesGuard)` at method level for specific endpoints.

---

## 5. Environment Variable Naming Flexibility

### ❌ NOT FLEXIBLE — Names Are Hardcoded

The code **directly references specific env var names**. Changing names requires code changes:

```typescript
// These are hardcoded lookups — cannot be renamed without code changes:
const domain = process.env.AUTH0_DOMAIN;         // Hardcoded
const audience = process.env.AUTH0_AUDIENCE;     // Hardcoded
const port = process.env.PORT;                   // Hardcoded
const mongoUri = process.env.MONGO_URI;          // Hardcoded
const redisUrl = process.env.REDIS_URL;          // Hardcoded
const r2AccountId = process.env.R2_ACCOUNT_ID;   // Hardcoded
```

**Hardcoded References in Each Service:**

| Env Var | Function | File Pattern |
|---------|----------|--------------|
| `AUTH0_DOMAIN` | JWT issuer validation | `*/src/auth/strategies/jwt.strategy.ts:17` |
| `AUTH0_AUDIENCE` | JWT audience validation + role claim naming | `*/src/auth/strategies/jwt.strategy.ts:21, 49` |
| `PORT` | Server startup port | `*/src/main.ts:12-16` |
| `MONGO_URI` | Database connection | `*/src/app.module.ts:15` |
| `REDIS_URL` | Cache connection (feed-service only) | `services/feed-service/src/redis/redis.service.ts:16` |
| `R2_ACCOUNT_ID` | Cloudflare R2 config | `services/feed-service/src/r2/r2.service.ts:22` |
| `INTERNAL_TOKEN` | Inter-service auth | `services/*/src/**/*.service.ts` (multiple) |
| `NOTIFICATION_SERVICE_URL` | Event notifications | `services/event-service/src/events/events.service.ts:41, 98` |

### Web Frontend Variables (Also Hardcoded)

```typescript
// web/src/main.tsx
const domain = import.meta.env.VITE_AUTH0_DOMAIN;      // Hardcoded
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID; // Hardcoded
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;  // Hardcoded

// web/src/contexts/AuthContext.tsx:49
roles: auth0User[`${import.meta.env.VITE_AUTH0_AUDIENCE}/roles`]
```

---

## 6. Cross-Service Communication

Services call each other using environment-configured URLs + internal token:

```typescript
// Example: job-service calling notification-service
const internalToken = process.env.INTERNAL_TOKEN || 'miniproject-internal-auth-token';
const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';

const response = await fetch(`${notificationUrl}/api/v1/internal/notifications/notify`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${internalToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ ... })
});
```

**Services making inter-service calls:**
- [job-service](services/job-service/src/jobs/jobs.service.ts) → notification-service
- [event-service](services/event-service/src/events/events.service.ts) → notification-service
- [feed-service](services/feed-service/src/feed/feed.service.ts) → notification-service
- [research-service](services/research-service/src/research/research.service.ts) → notification-service

---

## 7. Quickstart Implementation Status

### ✅ Backend Auth0 Quickstart Status
- **Passport JWT Strategy:** ✅ FULLY IMPLEMENTED using `passport-jwt` + `jwks-rsa`
- **Auth Guards:** ✅ IMPLEMENTED in 7 services
- **Standard Quickstart Code:** ✅ All services follow Auth0 Passport.js quickstart pattern

### ❌ Remaining Configuration Tasks
The AUTH0 quickstart **DOES NOT include:**
1. ❌ Auth0 Actions for roles claim (must be added manually in Auth0 dashboard)
2. ❌ Role-based authorization logic (partially implemented via RolesGuard)
3. ❌ Messaging-service Auth0 setup (needs code additions)

**See [DEPLOYMENT.md](docs/DEPLOYMENT.md) section: "Post-Deployment Configuration"** for Auth0 Actions setup.

---

## 8. Configuration Pattern Summary

### Current Pattern: Direct process.env Access

**Pros:**
- ✅ Simple, no framework overhead
- ✅ Works in NestJS and plain Node.js
- ✅ Clear where values come from

**Cons:**
- ❌ Hardcoded everywhere (not flexible)
- ❌ Not type-safe
- ❌ No centralized validation

### Alternative: NestJS ConfigService (NOT USED)

Services import `ConfigModule` but don't use `ConfigService`:

```typescript
// In app.module.ts
imports: [ConfigModule.forRoot()],  // Loaded but not used!
```

Could refactor to:
```typescript
constructor(private config: ConfigService) {}
// Then use: this.config.get('AUTH0_DOMAIN')
```

But current codebase **deliberately uses direct `process.env` access**.

---

## 9. Port Configuration

| Service | Default Port | Env Var |
|---------|-------------|---------|
| user-service | 3001 | PORT |
| feed-service | 3002 | PORT |
| analytics-service | 3003 | PORT |
| event-service | 3004 | PORT |
| job-service | 3005 | PORT |
| notification-service | 3006 | PORT |
| research-service | 3008 | PORT |
| messaging-service | 3000 or 3007 | PORT |

All use: `const port = process.env.PORT ?? <service-port>`

---

## 10. Web Frontend Service URL Configuration

Services URLs are **centralized in [web/src/config/services.ts](web/src/config/services.ts)** (if it exists) or configured via environment variables:

```
VITE_USER_SERVICE_URL=...
VITE_FEED_SERVICE_URL=...
... (8 total)
```

These are loaded at runtime and used by Axios instance in [web/src/lib/axios.ts](web/src/lib/axios.ts).

---

## Quick Reference: Environment Variables Checklist

### Required for ALL Services
```
AUTH0_DOMAIN              — Auth0 tenant domain
AUTH0_AUDIENCE            — API identifier (hardcoded in role claims)
MONGO_URI                 — MongoDB connection string
PORT                      — Service port
NODE_ENV                  — "production" or "development"
INTERNAL_TOKEN            — For inter-service authentication
```

### Required for SPECIFIC Services
```
feed-service only:
  REDIS_URL               — Redis connection
  R2_ACCOUNT_ID           — Cloudflare R2
  R2_ACCESS_KEY_ID        — Cloudflare R2
  R2_SECRET_ACCESS_KEY    — Cloudflare R2
  R2_BUCKET_NAME          — Cloudflare R2
  R2_PUBLIC_URL           — Cloudflare R2 public URL
  MINIO_*                 — MinIO (local dev alternative)

research-service only:
  R2_*                    — Same as feed-service

Web frontend only:
  VITE_AUTH0_DOMAIN       — Auth0 domain (VITE_ prefix)
  VITE_AUTH0_CLIENT_ID    — SPA client ID
  VITE_AUTH0_AUDIENCE     — API audience
  VITE_*_SERVICE_URL      — All 8 service URLs
```

### Inter-Service Communication
```
NOTIFICATION_SERVICE_URL  — Used by job, event, feed, research services
INTERNAL_TOKEN            — Shared internal auth token
```

---

## 11. Recommendations

1. **For flexible configuration namespace:** Use NestJS `ConfigService` instead of direct `process.env` access
2. **For messaging-service:** Add `AuthModule` to enable Auth0 (see `user-service` as template)
3. **For role management:** Complete the Auth0 Actions setup in DEPLOYMENT.md
4. **For type safety:** Create a `config.interface.ts` that validates all env vars at startup

