# Task Checklist — Department Engagement & Career Platform V4

## Phase 1: Audit & Gap Analysis ✅ (Done)
- [x] Explore all 8 microservices
- [x] Explore web app pages
- [x] Explore Flutter mobile app features
- [x] Identify missing features

## Phase 2: Backend — Fill Gaps

### 2.1 Messaging Service ✅
- [x] Design messaging schema (Conversation + Message mongoose models)
- [x] Implement `MessagingModule` with MongoDB
- [x] Implement [ConversationsService](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/messaging-service/src/conversations/conversations.service.ts#12-142) (create DM, create group, list, get by id)
- [x] Implement `MessagesService` (send message, list messages in conversation, mark read)
- [x] Add WebSocket gateway (Socket.IO) for real-time messaging
- [x] Add [JwtAuthGuard](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/feed-service/src/auth/guards/jwt-auth.guard.ts#4-13) to all messaging endpoints
- [x] Add health endpoint `/api/v1/health`
- [x] Write unit tests for messaging service

### 2.2 User Service — Auth0 Migration ✅
- [x] Rename `keycloakId` → `auth0Id` in [user.schema.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/user-service/src/users/schemas/user.schema.ts) and all related files
- [x] Update `upsertFromKeycloak` → [upsertFromAuth0](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/user-service/src/users/users.service.ts#11-21) in [users.service.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/user-service/src/users/users.service.ts)
- [x] Update user controller to use Auth0 sub claim correctly

### 2.3 Feed Service — Comments & Share ✅
- [x] Verify comment functionality exists in [feed.service.ts](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/feed-service/src/feed/feed.service.ts)
- [x] Add `POST /feed/:id/comment` endpoint if missing
- [x] Add `GET /feed/:id/comments` endpoint if missing
- [x] Add share count tracking if missing

### 2.4 Notification Service — Push Notifications ✅
- [x] Add FCM (Firebase Cloud Messaging) integration for push notifications
- [x] Add `expo-notifications` endpoint for mobile push
- [x] Wire up event-driven notifications from other services (jobs, events, research)

### 2.5 Analytics Service — Active Users ✅
- [x] Verify [getOverview()](file:///d:/ACADEMICS/Semester%207/CO528%20Applied%20Software%20Architecture/6%20Mini%20Project/Department-Engagement-and-Career-Platform/services/analytics-service/src/analytics/analytics.controller.ts#22-25) returns active user count
- [x] Add daily/weekly active users metric if missing

## Phase 3: Web App — Fill Gaps

### 3.1 Messaging Page (⚠️ MISSING) ✅
- [x] Create `web/src/pages/Messaging/` dir
- [x] Create `Messaging.tsx` with conversation list sidebar + message thread view
- [x] Add route `/messaging` in `App.tsx` for all authenticated users
- [x] Add "Messages" link to navigation sidebar/header

### 3.2 Feed Page — Comments UI ✅
- [x] Add comment input and comment list UI in `Feed.tsx` if missing
- [x] Add share button/counter if missing

### 3.3 Role-Based UI Visibility ✅
- [x] Student: hide "Post Job", "Create Event", show "Apply" button
- [x] Alumni: show "Post Job", "Create Event", hide "Apply" button
- [x] Admin: show Analytics, InfraStatus nav links; show all management controls
- [x] Audit all pages for correct role-gating using `useAuth().hasRole()`

### 3.4 Dashboard ✅
- [x] Verify dashboard shows relevant cards per role

## Phase 4: Mobile App (Flutter) — Fill Gaps

### 4.1 Messaging Feature (⚠️ MISSING) ✅
- [x] Create `mobile/delta/lib/features/messaging/` directory
- [x] Add `ConversationListScreen` widget
- [x] Add `ChatScreen` widget
- [x] Add `MessagingRepository` for API calls
- [x] Wire up Socket.IO client for real-time messages
- [x] Register `MessagingScreen` in router

### 4.2 Role-Based Visibility (Mobile) ✅
- [x] Verify Auth0 role claim is parsed in Flutter AuthRepository
- [x] Hide/show widgets per role (student/alumni/admin)
- [x] Admin-only: analytics screen, infra screen

### 4.3 Push Notifications (Mobile) ✅
- [x] Integrate `firebase_messaging` package
- [x] Register FCM token on login → send to notification-service
- [x] Handle foreground/background notification display

## Phase 5: Testing

### 5.1 Unit Tests — Backend Services
- [x] Run existing user-service unit tests: `cd services/user-service && npm test`
- [x] Run existing feed-service unit tests: `cd services/feed-service && npm test`
- [x] Run existing job-service unit tests: `cd services/job-service && npm test`
- [x] Run existing event-service unit tests: `cd services/event-service && npm test`
- [x] Run existing research-service unit tests: `cd services/research-service && npm test`
- [x] Run existing notification-service unit tests: `cd services/notification-service && npm test`
- [x] Run existing analytics-service unit tests: `cd services/analytics-service && npm test`
- [x] Write & run messaging-service unit tests: `cd services/messaging-service && npm test`

### 5.2 Integration Tests ✅
- [x] Run health check integration tests: `cd tests && npm test`
- [x] Add messaging-service endpoint integration tests

### 5.3 Web App — Manual / Browser Tests
- [ ] Verify login/logout flow per role (student, alumni, admin)
- [ ] Verify role-based navigation visibility
- [ ] Verify messaging page loads and sends messages
- [ ] Verify feed post/like/comment/share cycle

### 5.4 Mobile App — Manual Tests
- [ ] Verify Auth0 login flow on Android emulator
- [ ] Verify messaging screen renders
- [ ] Verify push notifications trigger

## Phase 6: Documentation

### 6.1 Auth0 Role Setup Guide ✅
- [x] Document how to create roles in Auth0 Dashboard
- [x] Document how to register users with specific roles
- [x] Document what each role sees (UI matrix)
- [x] Update `AUTH0_CONFIGURATION.md`

### 6.2 Implementation Plan V4 ✅
- [x] Finalize implementation_plan.md with full feature matrix
