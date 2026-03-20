# Auth0 Setup - Quick Reference

## 🎯 Login URL
Your app automatically redirects to Auth0 login (no separate login page):
- **App URL:** `http://localhost:5173` or `https://localhost:5174`
- **Auth0 redirects to:** `https://dev-ql54xjx71jnttf1o.us.auth0.com/authorize?...`

---

## ✅ What Was Fixed

### 🔴 Critical Issue (FIXED)
**Problem:** Bearer tokens were never attached to API requests  
**Solution:** Added `setTokenGetter()` initialization in AuthContext  
**Status:** ✅ Now all API requests include `Authorization: Bearer <token>`

### 🧹 Code Cleanup (FIXED)
**Problem:** Outdated Keycloak references in comments/code  
**Solution:** Updated all references to Auth0  
**Files Updated:** 6 files
- ProtectedRoute.tsx
- Profile.tsx
- Topbar.tsx
- InfraStatus.tsx
- silent-check-sso.html

---

## 📋 Auth0 Dashboard Configuration (REQUIRED)

### Go to: Auth0 Dashboard → Applications → Department Engagement Platform

**Add these to Allowed Callback URLs:**
```
http://localhost:5173
http://localhost:5173/
```

**Add these to Allowed Logout URLs:**
```
http://localhost:5173
```

**Add these to Allowed Web Origins:**
```
http://localhost:5173
```

---

## 🧪 Quick Test

1. Start web: `cd web && npm run dev`
2. Open `http://localhost:5173`
3. Should redirect to Auth0 login
4. Log in with test account
5. Should show authenticated dashboard
6. Check DevTools → Network → API request headers should have `Authorization: Bearer ...`

---

## 📄 Full Documentation

- **Comprehensive Guide:** [AUTH0_CONFIGURATION.md](AUTH0_CONFIGURATION.md)
- **Implementation Summary:** [AUTH0_IMPLEMENTATION_COMPLETE.md](AUTH0_IMPLEMENTATION_COMPLETE.md)

---

## ✨ Status: READY ✅

Auth0 is fully integrated and requires only:
1. Auth0 Dashboard URL registration (5 minutes)
2. Test login (1 minute)

**Total Setup Time:** ~6 minutes
