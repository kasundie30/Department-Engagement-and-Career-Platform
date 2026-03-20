# Port Configuration Verification ✅

## Current Configuration

### `.env.development` Setting
```
VITE_DEV_HTTPS=0
```

### Result
- **Web Application Runs On:** `http://localhost:5173` (HTTP)
- **Port:** 5173 only
- **HTTPS:** Disabled

---

## Why Port 5174 Was Mentioned

The vite.config.ts has conditional port logic:
```typescript
const USE_HTTPS_DEV = process.env.VITE_DEV_HTTPS === '1';
server: {
    port: USE_HTTPS_DEV ? 5174 : 5173,  // 5174 for HTTPS, 5173 for HTTP
}
```

Port 5174 would ONLY be used if you set `VITE_DEV_HTTPS=1` to enable HTTPS. Since the default is `VITE_DEV_HTTPS=0`, the app always runs on **5173**.

---

## Corrected Auth0 Configuration

### Only Register This Port in Auth0 Dashboard:

**Go to:** Auth0 Dashboard → Applications → Department Engagement Platform

**Allowed Callback URLs:**
```
http://localhost:5173
http://localhost:5173/
```

**Allowed Logout URLs:**
```
http://localhost:5173
```

**Allowed Web Origins:**
```
http://localhost:5173
```

---

## What's Needed

✅ **Port 5173** - Register this  
❌ **Port 5174** - Do NOT register (only if HTTPS is explicitly enabled)

---

## Quick Test

```bash
cd web
npm run dev
# Should start on: http://localhost:5173
```

---

**Status:** Configuration corrected and documentation updated to remove confusing 5174 references.
