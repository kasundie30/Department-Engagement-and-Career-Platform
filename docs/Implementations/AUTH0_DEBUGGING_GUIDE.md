# Auth0 Login Debugging Guide

## 🔧 What I Fixed

### The Main Problem
**ProtectedRoute was showing "Redirecting to login..." but NEVER actually calling the login function.**

It was just displaying a message forever instead of triggering the actual `loginWithRedirect()` call from Auth0.

### What Changed
1. ✅ **ProtectedRoute** - Now actually calls `login()` when user is not authenticated
2. ✅ **AuthContext** - Added comprehensive console logging
3. ✅ **main.tsx** - Added initialization logging

---

## 🔍 How to Debug

### Step 1: Open Browser Dev Tools
Press **F12** in your browser and go to **Console** tab

### Step 2: Reload the App
Visit `http://localhost:5173` and watch the console

### Step 3: Look for These Log Messages

You should see logs like:

```
[main.tsx] Auth0 Configuration: {
  domain: "dev-ql54xjx71jnttf1o.us.auth0.com",
  clientId: "MUKsKjXPuBpmgamSIKhFl62jhC1kqD88",
  audience: "https://api.decp-co528.com",
  origin: "http://localhost:5173",
  env: "development"
}

[AuthContext] Auth state updated: {
  isLoading: true,
  isAuthenticated: false,
  error: null,
  userEmail: null,
  isInitialized: false,
  timestamp: "2026-03-20T..."
}

[ProtectedRoute] Waiting for Auth0 initialization...

// After a few seconds...

[AuthContext] Auth state updated: {
  isLoading: false,
  isAuthenticated: false,
  error: null,
  userEmail: null,
  isInitialized: true,
  timestamp: "2026-03-20T..."
}

[ProtectedRoute] Auth State: {
  isInitialized: true,
  isAuthenticated: false,
  authError: null,
  timestamp: "2026-03-20T..."
}

[ProtectedRoute] User not authenticated. Triggering login...

[ProtectedRoute] Calling login() to redirect to Auth0
```

---

## ✅ Expected Behavior

### If Everything Works:
1. App loads on `http://localhost:5173`
2. You see "Redirecting to Auth0 login..."
3. **Within 1-2 seconds, browser redirects to Auth0 login page**
4. You log in with your credentials
5. Browser redirects back to `http://localhost:5173`
6. You see the authenticated dashboard

### If It Gets Stuck:
1. You see "Redirecting to Auth0 login..." 
2. **Nothing happens for 5+ seconds**
3. Check the console for error messages

---

## 🚨 Troubleshooting by Error Message

### Error: "Auth0 credentials missing!"
```
[main.tsx] ❌ Auth0 credentials missing! {
  domain: "❌",
  clientId: "❌"
}
```

**Solution:** Check your `.env.development` file:
```env
VITE_AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
VITE_AUTH0_CLIENT_ID=MUKsKjXPuBpmgamSIKhFl62jhC1kqD88
VITE_AUTH0_AUDIENCE=https://api.decp-co528.com
```

---

### Error in Console: "Invalid state"
This usually means Auth0 dashboard is not configured correctly.

**Check:**
1. Go to Auth0 Dashboard
2. Applications → Department Engagement Platform
3. Verify these URLs are registered:
   - Callback URLs: `http://localhost:5173`
   - Logout URLs: `http://localhost:5173`
   - Web Origins: `http://localhost:5173`

---

### Error: "callback mismatch"
The URL in browser doesn't match Auth0 configuration.

**Check:**
- Make sure you're visiting exactly `http://localhost:5173`
- Not `http://localhost:5173/` (with trailing slash) - though both should work
- Not accessing via IP address like `http://127.0.0.1:5173`

---

### Error: "CORS error" or "blocked by browser"
The Auth0 request is being blocked.

**Check:**
- You have valid internet connection
- Auth0 domain is reachable: `https://dev-ql54xjx71jnttf1o.us.auth0.com`
- Your browser is not blocking Auth0 requests

---

## 📊 Console Log Reference

| Message | What It Means | Action |
|---------|--------------|--------|
| `[main.tsx] Auth0 Configuration: {...}` | App initialized with Auth0 config | None, informational |
| `[AuthContext] Auth state updated: {...}` | Auth state changed | Watch for `isInitialized: true` |
| `[ProtectedRoute] Waiting for Auth0 initialization...` | Waiting for Auth0 SDK to load | Wait 1-2 seconds |
| `[ProtectedRoute] Calling login() to redirect to Auth0` | LOGIN TRIGGERED - Should redirect now | Watch for browser redirect |
| `[ProtectedRoute] Authenticated user. Rendering content.` | Login successful! | App should load |
| `❌ Auth0 credentials missing!` | Environment variables not set | Check `.env.development` |
| `[AuthContext] Error getting access token: ...` | Token fetch failed | Check if API fails later |

---

## 🚀 Test Now

```bash
cd web
npm run dev
# Open http://localhost:5173
# Press F12 to open console
# Watch the logs and the page
```

You should see:
1. "Loading authentication..." message
2. Console logs about Auth0 initialization  
3. "Redirecting to Auth0 login..." message
4. **Automatic redirect to Auth0 login page (THIS IS THE FIX)**
5. After login, redirect back to your app

---

## 💡 If You Still Get Stuck

Share these details:
1. **Browser console output** - Copy all logs starting with `[main.tsx]` or `[ProtectedRoute]`
2. **The exact URL** you're visiting (e.g., `http://localhost:5173`)
3. **What happens after** "Redirecting to Auth0 login..."
   - Does the page change at all?
   - Does anything appear in the console?
   - Do you see an Auth0 error page?

---

## ✨ Key Fix Summary

**Before:** ProtectedRoute showed "Redirecting to login..." but never actually called `loginWithRedirect()`

**After:** ProtectedRoute now:
1. Waits for Auth0 SDK to initialize
2. Checks if user is authenticated
3. If NOT authenticated, calls `login()` which triggers the actual OAuth redirect
4. Shows appropriate loading/error messages

The fix is in this single line in ProtectedRoute:
```typescript
login();  // ← This was missing before!
```

---

**Try it now and check your console logs!** 🎯
