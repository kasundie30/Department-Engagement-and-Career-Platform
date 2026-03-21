# Auth0 RBAC Configuration Guide

This platform uses **Auth0** for identity and role-based access control (RBAC). User roles correspond to: `student`, `alumni`,`researcher` and `admin`. Follow these steps to correctly configure the Role payloads so the front-end applications (Web & Mobile) can conditionally render authorized UI components.

---

## 1. Creating Roles in the Auth0 Dashboard

1. Navigate to the [Auth0 Management Dashboard](https://manage.auth0.com/).
2. On the left-hand sidebar, go to **User Management** -> **Roles**.
3. Click **Create Role**.
4. Create the following three specific roles (case-sensitive mapping):
   - `student`: Standard undergraduate/postgraduate scope.
   - `alumni`: Graduated access (includes event creation and job postings).
   - `researcher`: Specific role for research collaboration activities (accesses the Research Hub).
   - `admin`: Faculty/Department staff (includes system infrastructure/analytics access).

## 2. Registering and Assigning Users

To assign a base role manually (if required):
1. In the Dashboard, go to **User Management** -> **Users**.
2. Select an existing user or create a new one.
3. Once the user profile is open, click the **Roles** tab.
4. Click **Assign Roles** and grant the required classification (`student`, `alumni`, `researcher` or `admin`).

## 3. Exposing Roles & Auto-Assigning Default Roles (Auth0 Actions)

To prevent new users from instantly seeing all features blankly, or to remove the manual step of assigning the 'student' role, you should create an **Action** that automatically defaults unassigned users to `student` AND appends their roles to the authentication JWT. 

1. On the left sidebar, navigate to **Actions** -> **Library**.
2. Click the **Build Custom** button in the top right.
3. Name it "Set Default Role & Add to Token", select trigger **Login / Post Login**, and click **Create**.
4. Use the following script. *(Note: Make sure to replace `rol_XXXXX` with your Auth0 specific Role ID for the `student` role, which you can find in the URL string when you view your `student` role in the dashboard, e.g., `rol_qF1G2abc...`)*. 
   
   *Also, under the "Modules" section on the left code sidebar, add the `auth0` module if you want to use the ManagementClient.*

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://api.decp.com/roles';
  let roles = event.authorization ? event.authorization.roles : [];

  // If the user has no roles, assign a default 'student' role 
  // (You must authorize the Management API and store the Secret inside the action secrets)
  // For a simpler approach, you can just manually push 'student' to the token claims without attaching to the profile permanently:
  if (!roles || roles.length === 0) {
     roles = ['student'];
  }

  // Append the active roles into custom JWT claims so the App UI can read it
  api.idToken.setCustomClaim(namespace, roles);
  api.accessToken.setCustomClaim(namespace, roles);
};
```
5. Click **Deploy** in the top right.
6. Now go to **Actions** -> **Flows** and select **Login**.
7. In the center canvas, drag your new "Set Default Role & Add to Token" action from the **Custom** tab on the right side into the flow between "Start" and "Complete".
8. Click **Apply** in the top right.

---

## 4. UI Visibility Matrix (Web & Mobile)

| Action / View | `student` | `alumni` | `researcher` | `admin` |
| --- | :---: | :---: | :---: | :---: |
| **View Feed & Messages** | ✅ | ✅ | ✅ | ✅ |
| **Apply for Jobs** | ✅ | ❌ | ❌ | ✅ |
| **Post a Job** | ❌ | ✅ | ❌ | ✅ |
| **Create an Event** | ❌ | ✅ | ❌ | ✅ |
| **RSVP to Event** | ✅ | ✅ | ✅ | ✅ |
| **View Research Hub** | ✅ | ✅ | ✅ | ✅ |
| **Create Research Project**| ❌ | ❌ | ✅ | ✅ |
| **Infrastructure Status** | ❌ | ❌ | ❌ | ✅ |
| **System Analytics** | ❌ | ❌ | ❌ | ✅ |
