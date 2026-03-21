# Department Engagement and Career Platform
## API Endpoints, Hosted URIs, and Auth0 Workflow

This document provides a comprehensive overview of all the API endpoints across the 8 microservices, the production URIs for the hosted backend and web applications, and a detailed explanation of how Auth0 authentication and role-based access control (RBAC) function across the system.

---

### 1. Hosted URIs (Production)

The platform is deployed using a microservices architecture on Render. 

#### Frontend Web Application
* **Web App**: `https://department-engagement-and-career.onrender.com`

#### Backend Services (Render)
All services are prefixed with `/api/v1`. The frontend automatically routes API calls to the correct microservice based on the path.

* **User Service**: `https://user-service-a60z.onrender.com`
* **Feed Service**: `https://feed-service-oafo.onrender.com`
* **Job Service**: `https://job-service-h3pb.onrender.com`
* **Event Service**: `https://event-service-at2l.onrender.com`
* **Notification Service**: `https://notification-service-n0ph.onrender.com`
* **Research Service**: `https://research-service-befz.onrender.com`
* **Analytics Service**: `https://analytics-service-5ppc.onrender.com`
* **Messaging Service**: `https://messaging-service-dss7.onrender.com`

---

### 2. API Endpoints Reference

*Note: Unless annotated with `@Public`, all routes require a valid Auth0 Bearer token (`@UseGuards(JwtAuthGuard)`).*

#### User Service (`/api/v1/users`)
* `GET /users/me` : Retrieve current user profile (Auto-provisions Auth0 profile into MongoDB on first login)
* `PATCH /users/me` : Update current user profile
* `GET /users/health` : Health check (**Public**)
* `GET /users/:id` : Get specific user by ID (**Requires `admin`**)
* `GET /users` : List all users (**Requires `admin`**)

#### Job Service (`/api/v1/jobs`)
* `POST /jobs` : Create a job opportunity (**Requires `alumni` or `admin`**)
* `GET /jobs` : List job opportunities (supports `?type=` and `?status=` queries)
* `GET /jobs/:id` : Retrieve job details
* `PATCH /jobs/:id/status` : Update job status (open/closed) (**Requires `alumni` or `admin`**)
* `POST /jobs/:id/apply` : Apply for a job (**Requires `student`**)
* `GET /jobs/:id/applications` : List all applications for a job (**Requires `alumni` or `admin`**)
* `PATCH /jobs/:id/applications/:appId` : Update specific application status (**Requires `alumni` or `admin`**)

#### Feed Service (`/api/v1/feed`)
* `GET /feed/health` : Health check
* `POST /feed` : Create a new post
* `GET /feed` : Get paginated feed (`?page=1&limit=10`)
* `GET /feed/:id` : Retrieve specific post
* `POST /feed/:id/like` : Like a post
* `POST /feed/:id/unlike` : Remove a like
* `POST /feed/:id/share` : Share a post
* `POST /feed/:id/comment` : Comment on a post
* `GET /feed/:id/comments` : Get comments for a post
* `POST /feed/upload` : Upload an image (form-data)
* `GET /feed/upload/verify` : Verify image exists (`?path=`)

#### Event Service (`/api/v1/events`)
* `POST /events` : Create an event (**Requires `alumni` or `admin`**)
* `GET /events` : List out events
* `GET /events/:id` : Get specific event details
* `PATCH /events/:id/status` : Update event status (**Requires `alumni` or `admin`**)
* `POST /events/:id/rsvp` : RSVP to an event
* `DELETE /events/:id/rsvp` : Cancel RSVP
* `GET /events/:id/attendees` : View attendees (**Requires `alumni` or `admin`**)

#### Research Service (`/api/v1/research`)
* `POST /research` : Create a research project
* `GET /research` : List research projects
* `GET /research/:id` : Get project details
* `PATCH /research/:id` : Update project metadata (**Owner only**)
* `DELETE /research/:id` : Delete project (**Owner only**)
* `POST /research/:id/invite` : Invite collaborator (**Owner only**)
* `DELETE /research/:id/collaborators/:userId` : Remove collaborator (**Owner only**)
* `POST /research/:id/documents` : Upload a document (form-data)
* `GET /research/:id/documents` : List documents for a project

#### Messaging Service (`/api/v1/conversations`)
* `POST /conversations/dm` : Create or retrieve a Direct Message conversation
* `POST /conversations/group` : Create a group chat
* `GET /conversations` : List current user's conversations
* `GET /conversations/:id` : Get conversation details
* `GET /conversations/:id/messages` : Get paginated messages in conversation
* `POST /conversations/:id/messages` : Send a message (REST fallback for WebSockets)
* `PATCH /conversations/:id/read` : Mark all messages as read

#### Notification Service (`/api/v1/notifications`)
* `GET /notifications` : Get user notifications (supports `?unread=true`)
* `GET /notifications/count` : Get unread notification count
* `POST /notifications/tokens` : Register a device token (Web/FCM)
* `POST /notifications/:id/read` : Mark specific notification as read
* `PATCH /notifications/read-all` : Mark all notifications as read
* `POST /notifications/emit/:event` : Internal event testing

#### Analytics Service (`/api/v1/analytics`)
* `GET /analytics/overview` : Platform metrics overview (**Requires `admin`**)
* `GET /analytics/posts` : Top popular posts
* `GET /analytics/jobs` : Job application statistics over time
* `GET /analytics/users` : User registration trends
* `GET /analytics/latencies` : System latency data from Prometheus (**Requires `admin`**)

---

### 3. Understanding the Auth0 Workflow

Authentication and Authorization in the system are solely governed by **Auth0**, preventing unauthorized endpoint access through JSON Web Tokens (JWT) and Role-Based Access Control (RBAC).

#### Step-by-step Authentication Flow
1. **User Login**: The user clicks "Login" on the React frontend, which redirects them to the Auth0 Universal Login page.
2. **Post-Login Action**: Once Auth0 successfully authenticates the credentials, an **Auth0 Action** runs securely on Auth0's servers before issuing the token.
   - If a new user does not have a role mapped in Auth0, the Action automatically assigns them the `student` role.
   - The action dynamically takes the user's mapped roles array (`['student']`, `['alumni']`, etc.) and forcibly appends it as a **custom claim** inside the JWT namespace: `https://api.decp.com/roles`.
3. **Token Retrieval**: The frontend receives the Access Token containing the profile info and the custom roles claim.
4. **API Requests**: Using an Axios standard interceptor (`web/src/lib/axios.ts`), the frontend seamlessly attaches this token sequentially as an `Authorization: Bearer <TOKEN>` header to every outbound API call. 
   - The interceptor dynamically rewrites local API calls (e.g. `/api/v1/job-service/jobs`) to their remote Render equivalents (`https://job-service-h3pb.onrender.com/api/v1/jobs`).

#### Step-by-step Authorization Flow (Backend Validation)
1. **JWT Strategy**: Requests reaching the microservices are immediately intercepted by `JwtStrategy`. The backend reaches out to Auth0's public JSON Web Key Sets (JWKS) to mathematically verify that the token is untampered and legitimately came from the `AUTH0_DOMAIN`.
2. **Role Extraction**: `JwtStrategy` reads the decoded token payload and explicitly searches for the custom claim: `payload['https://api.decp.com/roles']`. The extracted role represents who the user is. (If no roles are found, it falls back to `'student'`).
3. **Roles Guard**: Controllers utilize `@UseGuards(RolesGuard)` and `@Roles(...)` metadata. Before executing the method (e.g., `createJob`), the `RolesGuard` compares the extracted role (`req.user.role`) against the allowed roles specified in the metadata (e.g., `@Roles('alumni', 'admin')`).
   - If the user's role exists in the allowed set, the controller method proceeds.
   - If not, the application rapidly shortcuts and returns a `403 Forbidden` Exception, prohibiting access entirely.
