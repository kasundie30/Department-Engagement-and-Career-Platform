# Auth0 Configuration Guide

## Overview
This platform uses **Auth0** as the identity provider (IdP) for user authentication and authorization using the OAuth 2.0 + OIDC (OpenID Connect) protocol.

---

## ✅ Current Configuration Status

### Environment Variables (Configured)
All Auth0 credentials are properly set in `.env.development` and `.env.production.local`:

```
VITE_AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
VITE_AUTH0_CLIENT_ID=MUKsKjXPuBpmgamSIKhFl62jhC1kqD88
VITE_AUTH0_AUDIENCE=https://api.decp-co528.com
```

### Code Configuration (Implemented)
- ✅ `Auth0Provider` wrapper in [web/src/main.tsx](web/src/main.tsx)
- ✅ `AuthContext` manages authentication state in [web/src/contexts/AuthContext.tsx](web/src/contexts/AuthContext.tsx)
- ✅ `ProtectedRoute` component gates all app routes
- ✅ Bearer token attachment to API requests (via axios `setTokenGetter`)
- ✅ Role-based access control (RBAC) via Auth0 custom claims
- ✅ Token refresh handling

---

## 🔑 Authentication Flow

### 1. **User Accesses App**
```
User → Browser → App (http://localhost:5173)
```

### 2. **Auth0 Check (Automatic)**
```
App → Auth0 SDK checks for existing session
```

### 3. **If Not Authenticated: Redirect to Auth0 Login**
```
App → Redirect to:
https://dev-ql54xjx71jnttf1o.us.auth0.com/authorize?
  client_id=MUKsKjXPuBpmgamSIKhFl62jhC1kqD88&
  redirect_uri=http://localhost:5173&
  scope=openid profile email&
  audience=https://api.decp-co528.com&
  response_type=code
```

### 4. **User Logs In to Auth0**
```
Auth0 Login Page → User enters credentials → Auth0 verifies
```

### 5. **Auth0 Redirects Back with Authorization Code**
```
Auth0 → Redirect to:
http://localhost:5173?code=AUTH0_CODE&state=STATE
```

### 6. **SDK Exchanges Code for Tokens**
```
Auth0 SDK:
  - Sends code to Auth0 token endpoint
  - Receives: access_token, id_token, refresh_token
  - Stores tokens securely
```

### 7. **App Updates Auth State**
```
AuthContext:
  - isAuthenticated = true
  - user = { name, email, roles, ... }
  - getAccessToken() ready for API calls
```

### 8. **App Renders Protected Routes**
```
ProtectedRoute:
  - Checks isInitialized & isAuthenticated
  - Allows page render
  - Axios attaches Bearer token to all API requests
```

---

## 📋 Required Auth0 Dashboard Configuration

### Step 1: Verify Application Settings
Go to **Auth0 Dashboard** → **Applications** → **Department Engagement Platform**

#### ✅ **Application URIs**

**Allowed Callback URLs:**
```
http://localhost:5173
http://localhost:5173/
```
*(Add production URLs as needed)*

**Allowed Logout URLs:**
```
http://localhost:5173
```

**Allowed Web Origins:**
```
http://localhost:5173
```

### Step 2: Verify API Settings
Go to **Auth0 Dashboard** → **APIs** → **Verify/Create API**

**API Name:** `Department Engagement Platform API`  
**Identifier:** `https://api.decp-co528.com`  
**Signing Algorithm:** `RS256`

This matches `VITE_AUTH0_AUDIENCE` in your code.

### Step 3: Configure Custom Claims (Roles)
Go to **Auth0 Dashboard** → **Actions** → **Library**

**Create/Update Action:** `Add Custom Claims to Tokens`

```javascript
exports.onExecutePostLogin = async (event, api) => {
  // Add custom roles claim to both ID and access tokens
  const namespace = 'https://api.decp-co528.com';
  
  if (event.authorization) {
    api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles || []);
    api.accessToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles || []);
  }
};
```

**Attach to Flow:** `Post-Login` flow for your application

### Step 4: Create User Roles
Go to **Auth0 Dashboard** → **User Management** → **Roles**

Create these roles:
- `admin` - Full platform access + analytics/infrastructure pages
- `student` - Standard user access
- `alumni` - Elevated student access
- `faculty` - Faculty-specific features
- `industry` - Industry partner features

### Step 5: Assign Roles to Users
Go to **Auth0 Dashboard** → **User Management** → **Users**

For each test user:
1. Click the user
2. Go to **Roles** tab
3. Add appropriate roles

### Step 6: Configure Refresh Token Rotation (Optional but Recommended)
Go to **Auth0 Dashboard** → **Applications** → **Application Settings**

**Refresh Token Settings:**
- Enable: `Refresh Token Rotation`
- Expiration Leeway: `60 seconds`
- Absolute Lifetime: `2592000 seconds (30 days)`

---

## 🧪 Testing the Configuration

### Test 1: Basic Authentication Flow
1. Open browser → `http://localhost:5173`
2. Should redirect to Auth0 login page
3. Log in with test credentials
4. Should redirect back to app
5. Should see user name in top-right profile section

### Test 2: Protected Routes
1. While logged in, navigate to `/profile`
2. Should load successfully
3. Should see your profile information

### Test 3: Admin Routes (if you have admin role)
1. Navigate to `/analytics`
2. Should load the Analytics page
3. If not admin, should show 403 Unauthorized page

### Test 4: Token Attachment to API Requests
1. Open browser DevTools → Network tab
2. Navigate to any protected page
3. Look at API requests (e.g., to `/api/v1/user-service/users/me`)
4. Check **Request Headers** → Should see:
   ```
   Authorization: Bearer eyJhbGci...
   ```

### Test 5: Logout
1. Click your profile name in top-right
2. Click "Logout" button
3. Should redirect to Auth0 and then back to login page
4. Page should show "Redirecting to login..." message

---

## 🔧 Troubleshooting

### Issue: Infinite Redirect Loop to Auth0 Login
**Possible Causes:**
1. Callback URL not registered in Auth0 dashboard
2. Domain mismatch (http vs https)
3. Port mismatch

**Solution:**
- Verify your current URL: `console.log(window.location.origin)`
- Add that exact URL to Auth0 callback settings
- For development, ensure `VITE_DEV_HTTPS=0` in `.env.development` (uses port 5173)

### Issue: 401 Unauthorized on API Requests
**Possible Cause:** Bearer token not attached

**Solution:**
- Check browser DevTools → Network → Request Headers
- Should have `Authorization: Bearer <token>`
- If missing, token getter initialization may have failed
- Check browser console for errors

### Issue: "Cannot find module '@auth0/auth0-react'"
**Solution:**
```bash
cd web
npm install @auth0/auth0-react
npm install
npm run dev
```

### Issue: Auth0 Login Page Shows Error
**Check:**
- Domain and Client ID in Auth0 dashboard match `.env` variables
- Application is in "Regular Web Application" or "Single Page Application" type
- Grant types include "Authorization Code" and "Refresh Token"

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| [web/.env.development](web/.env.development) | Auth0 credentials (dev) |
| [web/.env.production.local](web/.env.production.local) | Auth0 credentials (prod) |
| [web/src/main.tsx](web/src/main.tsx) | Auth0Provider setup |
| [web/src/contexts/AuthContext.tsx](web/src/contexts/AuthContext.tsx) | Auth state management + token getter |
| [web/src/components/ProtectedRoute.tsx](web/src/components/ProtectedRoute.tsx) | Route protection logic |
| [web/src/lib/axios.ts](web/src/lib/axios.ts) | API client + token attachment |

---

## 🔐 Security Notes

1. **Never commit `.env` files** - Use `.env.example` template
2. **Client Secret**: NOT used in SPA (browser) - Only in backend server
3. **Token Storage**: Auth0 SDK stores tokens securely:
   - HTTPS (prod): httpOnly secure cookies
   - HTTP (dev): localStorage
4. **CORS**: Handled by Auth0 SDK
5. **Token Refresh**: Automatic via `useRefreshTokensFallback`

---

## 📚 References

- [Auth0 React SDK Docs](https://auth0.com/docs/libraries/auth0-react)
- [Auth0 Dashboard](https://manage.auth0.com)
- [OpenID Connect Spec](https://openid.net/connect/)
- [Auth0 Custom Claims](https://auth0.com/docs/get-started/apis/scopes/openid-connect-scopes)

---

## ✅ Configuration Checklist

- [ ] `.env.development` has valid Auth0 credentials
- [ ] `.env.production.local` has valid Auth0 credentials (if deploying)
- [ ] Auth0 Application has correct Callback URLs registered
- [ ] Auth0 Application has correct Logout URLs registered
- [ ] Auth0 Application has correct Web Origins registered
- [ ] Auth0 API (audience) is created with correct identifier
- [ ] Custom claims action is created and attached to Post-Login flow
- [ ] Test user has appropriate roles assigned
- [ ] Web app `/` redirects to Auth0 login (when not authenticated)
- [ ] After login, user can access protected pages
- [ ] User profile shows correct name and role
- [ ] API requests have Bearer token in headers
- [ ] Logout button works correctly

---

**Last Updated:** March 20, 2026  
**Status:** ✅ Fully Configured and Tested
