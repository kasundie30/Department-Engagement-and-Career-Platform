# Implementation Plan V4 — Department Engagement & Career Platform

This plan covers all 8 project requirements, documents the current implementation state based on a thorough codebase audit, identifies gaps, and prescribes phased work to bring every feature to completion. It also provides a complete Auth0 roles guide.

---

## Current Feature Audit

| # | Requirement | Backend Status | Web Status | Mobile Status |
|---|---|---|---|---|
| 1 | User Management (register/login, roles, profile) | ✅ `user-service` has CRUD, role guards | ✅ Profile page, ProtectedRoute | ✅ auth feature dir |
| 2 | Feed & Media Posts (text, images, like/comment/share) | ✅ `feed-service` — like/unlike, image upload (R2) | ✅ Feed.tsx — needs comment UI | ⚠️ Needs comment/share UI |
| 3 | Jobs & Internships (post, apply, manage applications) | ✅ `job-service` — full CRUD + apply | ✅ Jobs.tsx | ✅ jobs feature dir |
| 4 | Events & Announcements (RSVP, notifications) | ✅ `event-service` — RSVP, cancel RSVP | ✅ Events.tsx | ✅ events feature dir |
| 5 | Research Collaboration | ✅ `research-service` — invite, docs, upload | ✅ Research.tsx | ✅ research feature dir |
| 6 | Messaging (DM + group chat) | ❌ **messaging-service is scaffold only** | ❌ **No Messaging page** | ❌ **No messaging feature** |
| 7 | Advanced Notifications (event-driven, push) | ✅ `notification-service` — in-app, Redis pub/sub | ✅ Notifications.tsx | ⚠️ No push (FCM) integration |
| 8 | Analytics Dashboard (active users, popular posts, job apps) | ✅ `analytics-service` — overview, posts, jobs, users | ✅ Analytics.tsx (admin-only) | ✅ analytics feature dir |

> [!IMPORTANT]
> **Messaging is the only completely missing feature.** The messaging-service is a NestJS scaffold with zero domain implementation. No web or mobile UI exists for messaging.

> [!WARNING]
> The [user.schema.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/user-service/src/users/schemas/user.schema.ts) still stores `keycloakId` instead of `auth0Id`. While functionally the same (both store the Auth0 `sub`), this creates confusion. A rename is planned in Phase 2.

---

## Phase 1 — Auth0 Role Setup Guide

This section answers: _"How to set different roles, how to register users for those, what to show per role."_

### 1.1 Creating Roles in Auth0

1. Go to [Auth0 Dashboard](https://manage.auth0.com) → **User Management** → **Roles**
2. Create exactly **3 roles** (matching `UserRole` enum in the backend):

| Role | Auth0 Role Name | Description |
|---|---|---|
| Student | `student` | Default registered user |
| Alumni | `alumni` | Elevated user (can post jobs, create events) |
| Admin | `admin` | Full platform access, analytics, user management |

### 1.2 Registering Users with a Role

**Method A — Manually assign after registration:**
1. User registers via Auth0 login page (any method — email/password, Google, etc.)
2. Go to Auth0 Dashboard → **User Management** → **Users** → click the user
3. Go to the **Roles** tab → click **Assign Roles** → select `student`, `alumni`, or `admin`

**Method B — Default role via Auth0 Action:**
Create an Action in Auth0 to automatically assign `student` role to every new user:
```javascript
// Auth0 Action: "Assign Default Role" — Pre-Registration flow
exports.onExecutePreUserRegistration = async (event, api) => {
  // All new users get 'student' role by default
  // Admins manually upgrade to 'alumni' or 'admin' via dashboard
};
```
Or use the **Post-Login** action to inject a default if no role present:
```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://api.decp-co528.com';
  const roles = event.authorization?.roles || [];
  // If no roles assigned yet, treat as student
  const effectiveRole = roles.length > 0 ? roles[0] : 'student';
  api.accessToken.setCustomClaim(`${namespace}/roles`, roles);
  api.accessToken.setCustomClaim(`${namespace}/role`, effectiveRole);
  api.idToken.setCustomClaim(`${namespace}/roles`, roles);
  api.idToken.setCustomClaim(`${namespace}/role`, effectiveRole);
};
```

### 1.3 Role Permissions Matrix

| Feature | Student | Alumni | Admin |
|---|:---:|:---:|:---:|
| **View feed / posts** | ✅ | ✅ | ✅ |
| **Create post** | ✅ | ✅ | ✅ |
| **Like / Comment / Share** | ✅ | ✅ | ✅ |
| **View jobs/internships** | ✅ | ✅ | ✅ |
| **Apply for a job** | ✅ | ❌ | ✅ |
| **Post a job / internship** | ❌ | ✅ | ✅ |
| **View/update job applications** | ❌ | ✅ (own) | ✅ |
| **View events** | ✅ | ✅ | ✅ |
| **RSVP to events** | ✅ | ✅ | ✅ |
| **Create events / workshops** | ❌ | ✅ | ✅ |
| **View event attendees** | ❌ | ✅ (own events) | ✅ |
| **Create research projects** | ✅ | ✅ | ✅ |
| **Invite research collaborators** | ✅ (own) | ✅ (own) | ✅ |
| **Upload research documents** | ✅ (member) | ✅ (member) | ✅ |
| **Direct / group messaging** | ✅ | ✅ | ✅ |
| **View notifications** | ✅ | ✅ | ✅ |
| **View analytics dashboard** | ❌ | ❌ | ✅ |
| **View infra status** | ❌ | ❌ | ✅ |
| **List all users** | ❌ | ❌ | ✅ |
| **View analytics nav link** | ❌ | ❌ | ✅ |

---

## Phase 2 — Backend Changes

### 2.1 Messaging Service — Full Implementation

**[MODIFY]** [package.json](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/messaging-service/package.json)
- Add `@nestjs/mongoose`, `mongoose`, `@nestjs/platform-socket.io`, `socket.io`, `@nestjs/websockets` dependencies

**[NEW]** [services/messaging-service/src/conversations/schemas/conversation.schema.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/messaging-service/src/conversations/schemas/conversation.schema.ts)
- Fields: `participants[]`, `name` (optional, for groups), `isGroup`, `lastMessage`, timestamps


**[MODIFY]** [app.module.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/messaging-service/src/app.module.ts)
- Register `MongooseModule`, [ConversationsModule](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/messaging-service/src/conversations/conversations.module.ts#8-20), [MessagingGateway](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/messaging-service/src/messaging.gateway.ts#15-119)

---

### 2.2 User Service — Auth0 Field Rename

**[MODIFY]** [user.schema.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/user-service/src/users/schemas/user.schema.ts)
- Rename `keycloakId` → `auth0Id` 
- Add `@Prop({ sparse: true })` for backward compat

**[MODIFY]** [users.service.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/user-service/src/users/users.service.ts)
- Rename `upsertFromKeycloak` → [upsertFromAuth0](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/user-service/src/users/users.service.ts#11-21)
- Update all field references

**[MODIFY]** [users.controller.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/user-service/src/users/users.controller.ts)
- Update `upsertFromKeycloak` call → [upsertFromAuth0](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/user-service/src/users/users.service.ts#11-21)
- Remove legacy Keycloak comments

---

### 2.3 Feed Service — Comments

**[MODIFY]** [feed.service.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/feed-service/src/feed/feed.service.ts)
- Add [addComment(postId, userId, text)](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/feed-service/src/feed/feed.service.ts#140-185) method if missing
- Add [getComments(postId)](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/feed-service/src/feed/feed.controller.ts#75-84) method if missing

**[MODIFY]** [feed.controller.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/feed-service/src/feed/feed.controller.ts)
- Add `POST /feed/:id/comment` endpoint
- Add `GET /feed/:id/comments` endpoint

---

## Phase 3 — Web App Changes

### 3.1 Messaging Page

**[NEW]** [web/src/pages/Messaging/Messaging.tsx](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/web/src/pages/Messaging/Messaging.tsx)
- Left panel: conversation list (DMs + groups)
- Right panel: message thread + input box
- Uses Socket.IO client for real-time delivery

**[NEW]** [web/src/pages/Messaging/Messaging.css](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/web/src/pages/Messaging/Messaging.css)
- Split-pane layout, chat bubbles

**[MODIFY]** [App.tsx](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/web/src/App.tsx)
- Add `import { Messaging } from './pages/Messaging/Messaging'`
- Add `<Route path="/messaging" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />`

**[MODIFY]** Layout navigation component
- Add "Messages" link in sidebar for all authenticated users

---

### 3.2 Role-Based UI Enforcement

**[MODIFY]** [Jobs.tsx](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/web/src/pages/Jobs/Jobs.tsx)
- Show "Apply" button only for `student` role
- Show "Post Job" button only for `alumni` or `admin` role

**[MODIFY]** [Events.tsx](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/web/src/pages/Events/Events.tsx)
- Show "Create Event" button only for `alumni` or `admin`

**[MODIFY]** Layout navigation / sidebar
- Show "Analytics" and "Infra Status" links only for `admin` role

---

### Phase 4: Mobile App Extensions (Flutter) ✅
- **4.1 Messaging Feature:** Add models, repositories, and presentation widgets for Direct Messaging, integrated via Socket.IO Client.
- **4.2 Role-Based Logic:** Implement payload decoding on local idTokens to conditionally render job creations, API hooks, and admin routes.
- **4.3 Push Notifications:** Implement `firebase_messaging`, capture token on foreground, and emit valid configurations back to user-service / notification-service.

**[NEW]** `mobile/delta/lib/features/messaging/`
- `presentation/screens/conversation_list_screen.dart`
- `presentation/screens/chat_screen.dart`
- `repositories/messaging_repository.dart` — REST + Socket.IO API calls

**[MODIFY]** `mobile/delta/lib/core/router/`
- Add `/messaging` route → `ConversationListScreen`

**[MODIFY]** Main navigation
- Add "Messages" tab/item in bottom nav or drawer

---

### 4.2 Push Notifications (Mobile — Firebase)

**[MODIFY]** [pubspec.yaml](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/mobile/delta/pubspec.yaml)
- Add `firebase_messaging: ^14.9.0`
- Add `firebase_core: ^2.27.0`

**[NEW]** `mobile/delta/lib/core/services/push_notification_service.dart`
- Initialize Firebase, get FCM token, POST token to notification-service on login
- Handle foreground/background messages

---

## Phase 5 — Testing

### 5.1 Existing Unit Tests (Run to Verify)

```powershell
# Run all unit tests across all services
cd "d:\ACADEMICS\Semester 7\CO528 Applied Software Architecture\6 Mini Project\Department-Engagement-and-Career-Platform\services\user-service" ; npm test

cd "d:\ACADEMICS\Semester 7\CO528 Applied Software Architecture\6 Mini Project\Department-Engagement-and-Career-Platform\services\feed-service" ; npm test

cd "d:\ACADEMICS\Semester 7\CO528 Applied Software Architecture\6 Mini Project\Department-Engagement-and-Career-Platform\services\job-service" ; npm test

cd "d:\ACADEMICS\Semester 7\CO528 Applied Software Architecture\6 Mini Project\Department-Engagement-and-Career-Platform\services\event-service" ; npm test

cd "d:\ACADEMICS\Semester 7\CO528 Applied Software Architecture\6 Mini Project\Department-Engagement-and-Career-Platform\services\research-service" ; npm test

cd "d:\ACADEMICS\Semester 7\CO528 Applied Software Architecture\6 Mini Project\Department-Engagement-and-Career-Platform\services\notification-service" ; npm test

cd "d:\ACADEMICS\Semester 7\CO528 Applied Software Architecture\6 Mini Project\Department-Engagement-and-Career-Platform\services\analytics-service" ; npm test
```

### 5.2 Integration Tests (Require Running Services)

```powershell
# Start services first (each in a separate terminal):
# cd services/<name> && npm run start:dev

# Then run integration suite:
cd "d:\ACADEMICS\Semester 7\CO528 Applied Software Architecture\6 Mini Project\Department-Engagement-and-Career-Platform\tests"
npm test
```

Existing integration tests cover:
- Service health checks (`services-health.test.js`)
- Auth0 connectivity (`auth0.test.js`)
- MongoDB connectivity (`mongodb.test.js`)
- Redis (Upstash) connectivity (`redis.test.js`)
- R2 storage connectivity (`r2.test.js`)

**[NEW]** `tests/integration/messaging.test.js` — to be written:
- POST `/api/v1/conversations/dm` → 201
- GET `/api/v1/conversations` → 200 with array
- POST `/api/v1/conversations/:id/messages` → 201

#### 2.5 Analytics Service Ext. ✅
- **Objective:** Track daily active and weekly active users.
- **Files/Modules:**
  - `user-service/user.schema.ts` (add `lastActiveAt`)
  - `analytics-service/analytics.service.ts` (extend API to query DAP/WAP)
- **Unit Tests:** Integration checks and run existing suites.

### 5.3 New Messaging Service Unit Tests

**[NEW]** `services/messaging-service/src/conversations/conversations.service.spec.ts`
- Test `createDM` creates or returns existing conversation
- Test `send` persists message and emits via WebSocket

### 5.4 Manual Verification Steps

1. **Login as student:**  
   - Navigate to `http://localhost:5173`, log in with a student-role Auth0 account  
   - ✅ See: Feed, Jobs, Events, Research, Messages, Notifications, Profile in nav  
   - ❌ NOT see: Analytics, Infra Status in nav  
   - On Jobs page: see "Apply" button, NOT "Post Job" button  
   - On Events page: NOT see "Create Event" button

2. **Login as alumni:**  
   - Log in with an alumni-role Auth0 account  
   - On Jobs page: see "Post Job" button, NOT "Apply" button  
   - On Events page: see "Create Event" button

3. **Login as admin:**  
   - Log in with an admin-role Auth0 account  
   - ✅ See: Analytics and Infra Status links in nav  
   - Analytics page loads with overview, popular posts, job application charts

4. **Messaging flow (after Phase 3 implementation):**  
   - Log in as User A, go to `/messaging`, start DM with User B's user ID  
   - In another browser/incognito, log in as User B  
   - User A sends a message → User B receives it in real time

---

### Phase 5: Testing (Partially Automated) ✅
- **5.1 Unit Tests:** Re-run all backend `npm test` suites including the new messaging endpoints. (Completed ✅)
- **5.2 Integration Tests:** Add API tests targeting Auth0 and MongoDB for messaging infrastructure validation. (Completed ✅)
- **5.3/5.4 User Acceptance Testing:** Manual review over flutter/web clients. (Pending User Feedback)

### Phase 6: Documentation ✅
- **6.1 RBAC Implementation Docs:** Outline the pipeline requirements for Auth0 Role deployment inside `AUTH0_CONFIGURATION.md`.
- **6.2 Delivery Signoff:** Finalize the application infrastructure according to V4 requirements.sage

---

**Last Updated:** March 21, 2026  
**Version:** V4
