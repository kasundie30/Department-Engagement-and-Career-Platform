# User Roles & Permissions

The platform defines four roles, managed via Auth0 and propagated through JWT claims. Every service enforces permissions via role guards on the backend, and the frontend conditionally renders UI elements based on the same claims.

---

## Role Definitions

| Role | Description |
|---|---|
| `student` | Undergraduate or postgraduate user. Can engage with the platform socially and academically. |
| `alumni` | Graduated user. Inherits all student capabilities and gains the ability to post jobs and create events. |
| `staff` | University staff member. Sits between alumni and admin — can post jobs, create events, and engage with research, but has no access to analytics or infrastructure. |
| `admin` | Faculty or department administrator. Full platform access including analytics, infrastructure status, and user management. |

---

## Permissions Matrix

| Feature | Student | Alumni | Staff | Admin |
|---|:---:|:---:|:---:|:---:|
| **Feed** | | | | |
| View feed & posts | ✅ | ✅ | ✅ | ✅ |
| Create post | ✅ | ✅ | ✅ | ✅ |
| Like / Comment | ✅ | ✅ | ✅ | ✅ |
| **Jobs** | | | | |
| View jobs & internships | ✅ | ✅ | ✅ | ✅ |
| Apply for a job | ✅ | ❌ | ❌ | ✅ |
| Post a job / internship | ❌ | ✅ | ✅ | ✅ |
| View & update job applications | ❌ | ✅ (own postings) | ✅ (own postings) | ✅ |
| **Events** | | | | |
| View events | ✅ | ✅ | ✅ | ✅ |
| RSVP to an event | ✅ | ✅ | ✅ | ✅ |
| Create events & workshops | ❌ | ✅ | ✅ | ✅ |
| View event attendees | ❌ | ✅ (own events) | ✅ | ✅ |
| **Research** | | | | |
| View research projects | ✅ | ✅ | ✅ | ✅ |
| Create a research project | ✅ | ✅ | ✅ | ✅ |
| Invite research collaborators | ✅ (own projects) | ✅ (own projects) | ✅ (own projects) | ✅ |
| Upload research documents | ✅ (if member) | ✅ (if member) | ✅ (if member) | ✅ |
| **Messaging & Notifications** | | | | |
| Direct & group messaging | ✅ | ✅ | ✅ | ✅ |
| View notifications | ✅ | ✅ | ✅ | ✅ |
| **Admin Only** | | | | |
| View analytics dashboard | ❌ | ❌ | ❌ | ✅ |
| View infrastructure status | ❌ | ❌ | ❌ | ✅ |
| List all users | ❌ | ❌ | ❌ | ✅ |
| View analytics nav link | ❌ | ❌ | ❌ | ✅ |

---

## Notes

- **Staff vs Alumni** — staff can post jobs and create events just like alumni, but additionally can view all event attendees regardless of who created the event. They cannot apply for jobs.
- **Staff vs Admin** — staff have no access to the analytics dashboard, infrastructure status, or user management. These remain admin-only.
- **Alumni cannot apply for jobs** — the assumption is that alumni are posting opportunities, not seeking them through the platform.
- **Research is open to all roles** — any authenticated user can create projects and collaborate, with document upload restricted to project members only.
- **Application management** is scoped: alumni and staff can only review applications on their own job postings; admins have full access.
- Roles are assigned in Auth0, embedded in the JWT access token under the custom claim namespace, and validated by each microservice independently on every request.