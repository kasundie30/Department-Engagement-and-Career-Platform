# Web Application Authentication Flow Analysis

## Executive Summary

The web application uses **Auth0** as the primary Single Sign-On (SSO) authentication provider. The authentication flow is implemented via the Auth0 React SDK with a custom AuthContext wrapper that manages session state and provides role-based authorization. Tokens are managed by Auth0's SDK and attached to API requests via axios interceptors.

---

## 1. Authentication Architecture

### 1.1 Authentication Provider Stack

```
┌─────────────────────────────────────────────┐
│         React Application (Vite)            │
├─────────────────────────────────────────────┤
│  Auth0Provider (@auth0/auth0-react)         │ ← External SSO provider
├─────────────────────────────────────────────┤
│  AuthProvider (Custom Context)              │ ← Local auth state management
├─────────────────────────────────────────────┤
│  Routes & Protected Components              │
└─────────────────────────────────────────────┘
```

**Configuration Files:**
- [web/src/main.tsx](web/src/main.tsx) — Auth0Provider setup
- [web/src/contexts/AuthContext.tsx](web/src/contexts/AuthContext.tsx) — Auth state management
- [web/.env.development](web/.env.development) — Auth0 credentials

### 1.2 Auth0 Configuration

**Environment Variables:**
```env
VITE_AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
VITE_AUTH0_CLIENT_ID=MUKsKjXPuBpmgamSIKhFl62jhC1kqD88
VITE_AUTH0_AUDIENCE=https://api.decp-co528.com
```

**Auth0Provider Settings (main.tsx):**
```typescript
<Auth0Provider
  domain={domain}
  clientId={clientId}
  authorizationParams={{
    redirect_uri: window.location.origin,
    audience: audience,
  }}
>
```

**Key Points:**
- Uses default Auth0 OAuth 2.0 + OIDC flow
- Redirect URI is set to `window.location.origin` (dynamic)
- Audience claim identifies the API resource (roles claim is scoped to this audience)

---

## 2. Authentication Context & Provider Setup

### 2.1 AuthContext Structure

**Location:** [web/src/contexts/AuthContext.tsx](web/src/contexts/AuthContext.tsx)

**Context Interface:**
```typescript
interface AuthContextType {
    isAuthenticated: boolean;      // User logged in
    isInitialized: boolean;        // Auth check completed
    authError: string | null;      // Auth initialization error
    user: any;                     // User profile object
    login: () => void;             // Trigger login redirect
    logout: () => void;            // Clear session & redirect
    hasRole: (role: string) => boolean;  // Role-based authorization
    getAccessToken: () => Promise<string | undefined>;  // Get Bearer token
}
```

### 2.2 User Object Structure

```typescript
user = {
    sub: string;                   // Auth0 unique identifier
    username: string;              // Auth0 nickname
    firstName: string;             // Given name
    lastName: string;              // Family name
    email: string;
    name: string;                  // Full name
    picture: string;               // Avatar URL
    roles: string[];               // Custom roles claim from Auth0
}
```

### 2.3 Roles Management

**Roles are extracted from Auth0 custom claims:**
```typescript
roles: (auth0User[`${import.meta.env.VITE_AUTH0_AUDIENCE}/roles`] ||
         auth0User['https://department-platform/roles'] || []) as string[]
```

**Fallback pattern:** Tries two possible claim paths:
1. `{AUDIENCE}/roles` (e.g., `https://api.decp-co528.com/roles`)
2. `https://department-platform/roles`

**Known role names:** `admin`, `alumni`, `student` (used in role checks throughout app)

---

## 3. Authentication Flow

### 3.1 Initial Login Flow

```
User visits app
    ↓
ProtectedRoute checks isAuthenticated & isInitialized
    ↓
If not authenticated → Shows "Redirecting to login..." screen
    ↓
Auth0 SDK automatically redirects to Auth0 login URL
    ↓
User completes Auth0 login (username/password/SSO)
    ↓
Auth0 redirects back with ?code= parameter
    ↓
Auth0 SDK exchanges code for tokens
    ↓
Auth0 SDK updates isAuthenticated → true, isInitialized → true
    ↓
AuthContext re-renders, user object is populated
    ↓
ProtectedRoute allows access, shows Dashboard
```

### 3.2 Session Initialization

**In AuthContext.tsx:**
```typescript
const {
    isAuthenticated,
    isLoading,      // Becomes false when auth check completes
    error,
    user: auth0User,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
} = useAuth0();

// isInitialized = !isLoading
// When Auth0 SDK finishes its initialization check, isInitialized becomes true
```

**Critical Point:** Auth0 SDK completes authentication checks **before React renders**, so:
- No login redirect loop
- Token exchange happens in SDK's initialization phase
- React components render after auth is ready

### 3.3 Logout Flow

```
User clicks Logout button (Sidebar.tsx)
    ↓
logout() called → auth0Logout({ logoutParams: { returnTo: window.location.origin } })
    ↓
Auth0 clears session & tokens
    ↓
Redirects to window.location.origin (app root)
    ↓
App reloads, Auth0 SDK detects unauthenticated state
    ↓
ProtectedRoute shows "Redirecting to login..."
    ↓
Auth0 redirects to its login page
```

---

## 4. Token Management

### 4.1 Token Storage

**Storage Mechanism:** Auth0 JavaScript SDK handles all token storage
- **In HTTPS environments:** Secure cookies (httpOnly, secure flags)
- **In HTTP environments:** localStorage with cache key `@@auth0spajs@@::{clientId}`

**Token Types:**
- **Access Token:** Bearer token for API requests (JWT)
- **ID Token:** OIDC token with user profile claims
- **Refresh Token:** Used by Auth0 SDK to obtain new access tokens (maintained internally)

### 4.2 Token Attachment to API Requests

**Location:** [web/src/lib/axios.ts](web/src/lib/axios.ts)

**Current Implementation:**
```typescript
// Token getter function is prepared but NOT being called
let _getToken: (() => Promise<string | undefined>) | null = null;
export function setTokenGetter(fn: () => Promise<string | undefined>) {
    _getToken = fn;
}

// Request interceptor attempts to attach token IF _getToken is set
api.interceptors.request.use(
    async (config) => {
        if (_getToken) {
            try {
                const token = await _getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (err) {
                console.warn('[axios] Could not get access token', err);
            }
        }
        return config;
    },
    (error) => Promise.reject(error),
);
```

### 4.3 Obtaining Access Tokens

**In AuthContext:**
```typescript
const getAccessToken = async (): Promise<string | undefined> => {
    try {
        return await getAccessTokenSilently({
            authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
        });
    } catch {
        return undefined;
    }
};
```

**Key Points:**
- `getAccessTokenSilently()` is from Auth0 SDK (uses refresh token if original token expired)
- Specifies `audience` claim to request token for API
- Returns undefined on error (doesn't throw)

### 4.4 Token Validation

**Server-side validation:** Each microservice validates JWT tokens using Keycloak/OAuth2 strategy
**Client-side validation:** 
- Auth0 SDK validates JWT structure and signature
- No explicit client-side expiration checks (Auth0 handles refresh automatically)
- When token expires, next API call triggers silent refresh

---

## 5. Protected Route Implementation

**Location:** [web/src/components/ProtectedRoute.tsx](web/src/components/ProtectedRoute.tsx)

### 5.1 Route Protection Logic

```typescript
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
    const { isAuthenticated, isInitialized, authError, hasRole } = useAuth();

    // Phase 1: Initialization check
    if (!isInitialized) {
        return <LoadingScreen message="Loading authentication..." />;
    }

    // Phase 2: Authentication check
    if (!isAuthenticated) {
        if (authError) {
            return <ErrorScreen message={authError} />;
        }
        return <LoadingScreen message="Redirecting to login..." />;
    }

    // Phase 3: Authorization check (role-based)
    if (roles && roles.length > 0) {
        const hasRequiredRole = roles.some(role => hasRole(role));
        if (!hasRequiredRole) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    // All checks passed → render protected content
    return <>{children}</>;
};
```

### 5.2 Route Configuration

**Location:** [web/src/App.tsx](web/src/App.tsx)

**Example routes:**
```typescript
// Public routes (wrapped in Layout but still protected by ProtectedRoute)
<Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
<Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />

// Role-restricted routes
<Route
  path="/analytics"
  element={<ProtectedRoute roles={['admin']}><Analytics /></ProtectedRoute>}
/>

// Error page (unprotected)
<Route path="/unauthorized" element={<Unauthorized />} />
```

**Route Protection Behavior:**
- All main app routes require authentication
- No separate login page (Auth0 SDK handles redirect automatically)
- Admin routes require `admin` role
- Unauthorized users see 403 error page

---

## 6. Session Validation

### 6.1 Initialization-Time Validation

**When app loads:**
1. Auth0 SDK runs `keycloak.init({ onLoad: 'login-required' })`
2. SDK checks for existing session (localStorage/cookies)
3. If session exists: validates and loads user profile
4. If no session: redirects to Auth0 login
5. After redirect back: `isInitialized` becomes true

**One-time validation:** Only happens at app startup

### 6.2 Runtime Validation

**No continuous session validation implemented**

Current approach:
- **Token auto-refresh:** Auth0 SDK silently refreshes expired tokens on next API call
- **Stale session detection:** Only if API returns 401 (unauthorized)
- **Profile re-fetch:** Topbar refetches user profile on route changes (data validation, not auth)

### 6.3 Potential Issues with Session Validation

⚠️ **Issue #1: No periodic token refresh**
- If user is idle for long time, token may expire
- App doesn't detect expiration until next API call
- Background API calls won't trigger refresh

⚠️ **Issue #2: No session logout detection**
- If another tab logs out, this tab won't know
- Can lead to expired token errors on API calls

⚠️ **Issue #3: setTokenGetter never called**
- Authorization header is never attached to axios requests
- **Critical:** API requests will fail authentication without this

---

## 7. SSO Configuration Analysis

### 7.1 Current Implementation: Auth0

**Configuration:**
- Domain: `dev-ql54xjx71jnttf1o.us.auth0.com`
- Client ID: `MUKsKjXPuBpmgamSIKhFl62jhC1kqD88`
- Grant type: Authorization Code (OIDC)
- Audience: `https://api.decp-co528.com`

**Not currently implemented, but mentioned in code:**
- Comments in ProtectedRoute.tsx reference Keycloak as alternative
- Profile page has fallback to "Keycloak JS token info"
- These suggest migration from/to Keycloak was planned

### 7.2 Environment Configuration

**For development (.env.development):**
```
Auth0 sandbox environment for testing
Service URLs point to localhost (3001-3008 ports)
```

**For production (.env.production.local):**
```
Same Auth0 tenant (dev-ql54xjx71jnttf1o.us.auth0.com)
Service URLs would point to Render deployed services
```

### 7.3 Redirect Flow

**Configured redirect:**
```typescript
authorizationParams={{
    redirect_uri: window.location.origin,
    audience: audience,
}}
```

**For development:**
- HTTP: `http://localhost:5173` ✓
- HTTPS: `https://localhost:5174` ✓ (with VITE_DEV_HTTPS=1)

**For production:**
- Needs to be registered in Auth0 dashboard Application settings
- Format: `https://your-domain.com` or specific path

---

## 8. Known Issues & Potential Problems

### 🔴 CRITICAL ISSUES

#### Issue 1: Token Not Attached to API Requests
**Problem:** The `setTokenGetter()` function in axios.ts is never called
**Impact:** Authorization header is never set on requests to backend services
**Location:** [web/src/lib/axios.ts](web/src/lib/axios.ts)
```typescript
// This function is created but never used
export function setTokenGetter(fn: () => Promise<string | undefined>) {
    _getToken = fn;
}
```
**Fix needed:** Call `setTokenGetter(getAccessToken)` in AuthContext after Auth0 initializes
```typescript
// In AuthContext.tsx useEffect:
import { setTokenGetter } from '../lib/axios';

useEffect(() => {
    setTokenGetter(() => getAccessToken());
}, [getAccessToken]);
```

#### Issue 2: Port Configuration Mismatch
**Problem:** `.env.development` specifies different ports than [web/src/config/services.ts](web/src/config/services.ts) defaults
**Impact:** May use wrong service URLs if env vars aren't set
**.env.development:**
```
VITE_JOB_SERVICE_URL defaults to 3005 in env but services.ts expects 3003
```
**services.ts defaults:**
```typescript
'job-service': import.meta.env.VITE_JOB_SERVICE_URL || 'http://localhost:3003'
```

### 🟡 MODERATE ISSUES

#### Issue 3: Keycloak References in Dead Code
**Problem:** Comments and fallbacks reference Keycloak but it's not implemented
**Impact:** Maintenance confusion, incomplete migration evidence
**Locations:**
- [web/src/pages/Profile/Profile.tsx](web/src/pages/Profile/Profile.tsx) line 41: "Fallback to Keycloak JS token info"
- [web/src/components/ProtectedRoute.tsx](web/src/components/ProtectedRoute.tsx) line 13-14: Comments about Keycloak auth

#### Issue 4: No Refresh Token Handling
**Problem:** No explicit refresh token management in custom code
**Impact:** Relies on Auth0 SDK's internal behavior; if that breaks, no fallback
**Note:** Auth0 SDK handles this, but not visible in application code

#### Issue 5: useAuth Hook Unsafe Outside AuthProvider
**Problem:** `useAuth()` throws error if used outside `<AuthProvider>`
**Impact:** Components can't be tested or used standalone
**Location:** [web/src/hooks/useAuth.ts](web/src/hooks/useAuth.ts)

### 🟢 MINOR ISSUES

#### Issue 6: No Role Validation on Backend
**Problem:** Roles are read from Auth0 claims but not independently verified
**Impact:** Frontend shows admin UI even if token wasn't issued with admin scope
**Mitigation:** Backend services should validate roles via JWT

#### Issue 7: Constant Re-fetching of User Profile
**Problem:** Topbar refetches profile on every route change
**Impact:** Unnecessary API calls (30+ times during session)
**Location:** [web/src/components/layout/Topbar.tsx](web/src/components/layout/Topbar.tsx) line 42

---

## 9. Authentication Data Flow Diagram

```
┌──────────────────┐
│   User Browser   │
└────────┬─────────┘
         │
         │ Visits https://localhost:5174
         ↓
┌──────────────────────────────────┐
│   React App (Vite)               │ 
│  - Loads main.tsx                │
│  - Auth0Provider initializes     │
└────────┬─────────────────────────┘
         │
         │ SDK checks for existing session
         ├─────────────────────────────────────────────┐
         │                                             │
    NO SESSION                                   HAS SESSION (cookie/localStorage)
         │                                             │
         ↓                                             ↓
    Redirect to Auth0 Login                    Validate token with Auth0
         │                                             │
         ↓                                             ↓
    User enters credentials                    Return user profile
         │                                             │
         ↓                                      ┌──────┴──────┐
    Auth0 validates → issues tokens            │             │
         │                                      ↓             ↓
         └─────→ Redirect to http://localhost:5173/?code=XXXX&state=YYY
                            │
                            ↓
         ┌──────────────────────────────────────┐
         │ Auth0 SDK exchanges code for tokens  │
         │ (access_token, id_token, refresh)   │
         └──────────────────────────────────────┘
                            │
                            ↓
         ┌──────────────────────────────────────┐
         │ AuthContext updates state            │
         │ isAuthenticated = true               │
         │ isInitialized = true                 │
         │ user = { sub, email, roles, ... }   │
         └──────────────────────────────────────┘
                            │
                            ↓
         ┌──────────────────────────────────────┐
         │ ProtectedRoute allows render        │
         │ Shows Dashboard                      │
         └──────────────────────────────────────┘
                            │
                            ↓
         ┌──────────────────────────────────────┐
         │ Component calls API                   │
         │ api.get('/api/v1/user-service/...')  │
         └──────────────────────────────────────┘
                            │
                    ❌ PROBLEM: NO TOKEN ATTACHED!
                    (setTokenGetter never called)
                            │
                            ↓
         ┌──────────────────────────────────────┐
         │ Request goes to backend WITHOUT      │
         │ Authorization: Bearer <token>        │
         │ Response: 401 Unauthorized           │
         └──────────────────────────────────────┘
```

---

## 10. Summary: How Auth Works

### Quick Reference

| Aspect | Details |
|--------|---------|
| **Provider** | Auth0 (auth0.com) |
| **OAuth Flow** | Authorization Code + OIDC |
| **Token Type** | JWT Bearer Token |
| **Storage** | Auth0 SDK (secure cookies or localStorage) |
| **Session Init** | Automatic redirect if not authenticated |
| **Session Validation** | One-time at startup; token refresh on API call |
| **Authorization** | Role-based from Auth0 custom claims |
| **Route Protection** | ProtectedRoute component wrapper |
| **API Auth** | ❌ **NOT IMPLEMENTED** (see Issue #1) |

### For Users
1. User visits app → Auto-redirected to Auth0 login if not authenticated
2. After login → Auth0 redirects back with code
3. Auth0 SDK exchanges code for tokens (hidden from user)
4. User sees authenticated app with their profile
5. Each API call should include Bearer token (❌ currently broken)

### For Developers
1. **Check authentication:** `const { isAuthenticated, user } = useAuth()`
2. **Restrict routes:** Wrap with `<ProtectedRoute roles={['admin']}>`
3. **Make API calls:** Use `api.get()`/`api.post()` from axios instance
4. **Get fresh token:** Call `await getAccessToken()`
5. **Handle errors:** Check for 401 responses (token expired/revoked)

---

## 11. Recommended Fixes (Priority Order)

### Priority 1: Fix Token Attachment (Critical)
```typescript
// In AuthContext.tsx, after Auth0 initialization:
import { setTokenGetter } from '../lib/axios';

useEffect(() => {
    if (isAuthenticated) {
        setTokenGetter(getAccessToken);
    }
}, [isAuthenticated, getAccessToken]);
```

### Priority 2: Fix Port Configuration
- Update `.env.development` to match services.ts defaults
- Or update services.ts to match .env.development
- Document the correct ports per service

### Priority 3: Remove Keycloak References
- Clean up dead code references
- Document Auth0 as the single source of truth
- Remove fallback logic to Keycloak

### Priority 4: Add Session Validation
```typescript
// Periodic token validation (every 5 minutes)
useEffect(() => {
    const interval = setInterval(async () => {
        try {
            await getAccessToken(); // Triggers refresh if needed
        } catch (err) {
            // Token invalid, logout user
            logout();
        }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
}, [getAccessToken, logout]);
```

### Priority 5: Reduce Profile Re-fetches
- Cache user profile in context/state
- Only refetch on explicit "refresh" action
- Reduces from 30+ calls to ~1-2 per session

---

## References

- **Auth0 Docs:** https://auth0.com/docs/get-started/architecture-scenarios/spa
- **Auth0 React SDK:** https://github.com/auth0/auth0-react
- **JWT Tokens:** https://tools.ietf.org/html/rfc7519
- **OAuth 2.0:** https://tools.ietf.org/html/rfc6749

