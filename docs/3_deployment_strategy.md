# Deployment Strategy: DECP Platform

This document outlines the deployment architecture, hosting platforms, and external services used for the Department Engagement and Career Platform (DECP).

## 1. Service Overview

The platform consists of 9 core services, including 8 microservices and 1 web frontend.

### 1.1 Microservices (Hosted on Render)

All microservices are deployed as **Web Services** on [Render](https://render.com).

| Service Name | Deployment URL |
|--------------|----------------|
| **User Service** | [https://user-service-a60z.onrender.com](https://user-service-a60z.onrender.com) |
| **Analytics Service** | [https://analytics-service-5ppc.onrender.com](https://analytics-service-5ppc.onrender.com) |
| **Notification Service** | [https://notification-service-n0ph.onrender.com](https://notification-service-n0ph.onrender.com) |
| **Event Service** | [https://event-service-at2l.onrender.com](https://event-service-at2l.onrender.com) |
| **Feed Service** | [https://feed-service-oafo.onrender.com](https://feed-service-oafo.onrender.com) |
| **Job Service** | [https://job-service-h3pb.onrender.com](https://job-service-h3pb.onrender.com) |
| **Messaging Service** | [https://messaging-service-dss7.onrender.com](https://messaging-service-dss7.onrender.com) |
| **Research Service** | [https://research-service-befz.onrender.com](https://research-service-befz.onrender.com) |

### 1.2 Web Frontend (Hosted on Vercel/Render)

The frontend is a React application built with Vite, primary deployment is targetted for Vercel or Render Static Sites.

---

## 2. External Services & Credentials

The platform leverages several cloud-native services for database, authentication, storage, and caching.

### 2.1 MongoDB Atlas (Primary Database)

Shared across all 8 microservices for data persistence.

- **Cluster Name:** `DECP-CO528`
- **Connection String:** `mongodb+srv://e20148_db_user:yi6yBWVvjjl7l3l5@decp-co528.kd9hgkc.mongodb.net/?appName=DECP-CO528`
- **Username:** `e20148_db_user`
- **Password:** `yi6yBWVvjjl7l3l5`
- **Access Control:** IP Access List includes `0.0.0.0/0` (Allow all for deployment).

### 2.2 Auth0 (Identity & Access Management)

Used for user authentication and role-based access control (RBAC).

- **Tenant Name:** `dev-ql54xjx71jnttf1o`
- **Region:** `US`
- **Domain:** `dev-ql54xjx71jnttf1o.us.auth0.com`

#### Applications:
| Application | Client ID | Client Secret |
|-------------|-----------|---------------|
| **DECP-CO528-WEB** (SPA) | `MUKsKjXPuBpmgamSIKhFl62jhC1kqD88` | `CHS34_LtnUOW6_Ozpk2D_E-q5fjhzDCRP1hOl6RUU8B1uPC1EiZv_w1LA4extouu` |
| **DECP-CO528-BACKEND** (M2M) | `Px8nnn2M5DYGB39ZegCSrgRKqvITbCZ7` | `cUL3geB08dQKE0yjMP3eOEm8UstPQrqIhF6EatRICN9Rnrz0G2AR_QVm_czfgmy0` |

- **API Identifier:** `https://api.decp-co528.com`
- **Roles:** `admin`, `moderator`, `student`, `faculty`

### 2.3 Cloudflare R2 (Object Storage)

Used for hosting media files, documents, and research papers.

- **Bucket Name:** `decp-co528`
- **Account ID:** `165871ed7eb878835d39fbb59c819caf`
- **S3 API Endpoint:** `https://165871ed7eb878835d39fbb59c819caf.r2.cloudflarestorage.com/decp-co528`
- **Token Name:** `decp-co528-render`
- **Token Value:** `cfat_rFHntm2i6JFm2o3YYVgUSgxcDni1hzajKCsDivJK9573e7ab`
- **Access Key ID:** `2d08079eafd184c91b9c9d4d21230288`
- **Secret Access Key:** `e5db9224ce400e1b3eb39a09e5eb3e61092a95b423d7ec4dbd90bea90660d38a`

### 2.4 Upstash Redis (Caching & Messsaging)

Used by `feed-service`, `notification-service`, and others for high-performance data access.

- **Database Name:** `DECP-CO528-Redis`
- **Region:** `US-EAST-1 (AWS)`
- **Endpoint (TLS):** `redis://default:gQAAAAAAATF0AAIncDJhMGNiNTkzOGQxMGQ0ZTkzYTUzYzFkNGM5MmVjNTM2NXAyNzgxOTY@magical-amoeba-78196.upstash.io:6379`
- **REST URL:** `https://magical-amoeba-78196.upstash.io`
- **REST Token:** `gQAAAAAAATF0AAIncDJhMGNiNTkzOGQxMGQ0ZTkzYTUzYzFkNGM5MmVjNTM2NXAyNzgxOTY`

---

## 3. Inter-Service Communication

Services communicate over HTTPS using their Render URLs. Internal authentication is handled via Auth0 M2M tokens.

### Environment Variables for Web Frontend:
```env
VITE_AUTH0_DOMAIN=dev-ql54xjx71jnttf1o.us.auth0.com
VITE_AUTH0_CLIENT_ID=MUKsKjXPuBpmgamSIKhFl62jhC1kqD88
VITE_AUTH0_AUDIENCE=https://api.decp-co528.com

VITE_USER_SERVICE_URL=https://user-service-a60z.onrender.com
VITE_FEED_SERVICE_URL=https://feed-service-oafo.onrender.com
VITE_JOB_SERVICE_URL=https://job-service-h3pb.onrender.com
VITE_EVENT_SERVICE_URL=https://event-service-at2l.onrender.com
VITE_NOTIFICATION_SERVICE_URL=https://notification-service-n0ph.onrender.com
VITE_RESEARCH_SERVICE_URL=https://research-service-befz.onrender.com
VITE_ANALYTICS_SERVICE_URL=https://analytics-service-5ppc.onrender.com
VITE_MESSAGING_SERVICE_URL=https://messaging-service-dss7.onrender.com
```
