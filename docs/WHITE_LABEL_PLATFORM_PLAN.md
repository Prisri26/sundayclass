# Sundayclass White-Label Platform Plan

## 1. Goal

Transform the current Sundayclass product from a single-church attendance app into a multi-tenant white-label platform for many churches.

Current state:
- One mobile app for student attendance and registration
- One website dashboard for reports and management
- Shared Firebase project and shared Firestore collections

Target state:
- Multiple churches use the same platform
- Each church sees only its own data
- Each church has its own branding, settings, users, and permissions
- The platform can later support custom domains and premium branded builds

---

## 2. Product Vision

Sundayclass should evolve into a church operations platform with these main capabilities:

- Student and class management
- Attendance tracking
- Teacher and volunteer access
- Parent communication
- Events and follow-up workflows
- Reports and analytics
- White-label branding for each church

This means the architecture must support:

- tenant isolation
- role-based access
- dynamic branding
- feature configuration
- future scaling

---

## 3. Current Architecture Summary

From the existing codebase:

- Mobile app uses React Native + Expo + Firebase
- Website uses Next.js + Firebase
- Firestore currently uses shared collections like:
  - `students`
  - `attendance`
  - `class_sessions`
  - `spotlight`
- Firestore rules currently allow any authenticated user to read and write most app data

Current limitation:

The app assumes there is only one church using the system. This is the main constraint that must change.

---

## 4. Platform Architecture Direction

The platform should move from:

`single tenant app -> multi-tenant SaaS -> white-label SaaS`

### Key architecture principles

1. Every business record belongs to a tenant
2. Every request runs in a tenant context
3. Every user has a scoped role
4. Branding is loaded from tenant settings
5. Features can be enabled or disabled per tenant

---

## 5. Tenant Model

Use `church` as the main tenant.

Each church is an independent customer using the same platform.

### Top-level tenant entity

`churches/{churchId}`

Each church record stores high-level profile and business settings.

Recommended fields:

```ts
type Church = {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'trial' | 'suspended';
  plan: 'starter' | 'growth' | 'premium';
  timezone: string;
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

---

## 6. Recommended Firestore Data Model

Use church-scoped subcollections for tenant isolation.

### Core structure

```text
churches/{churchId}
churches/{churchId}/settings/general
churches/{churchId}/settings/branding
churches/{churchId}/settings/features
churches/{churchId}/members/{membershipId}
churches/{churchId}/classes/{classId}
churches/{churchId}/students/{studentId}
churches/{churchId}/parents/{parentId}
churches/{churchId}/attendanceSessions/{sessionId}
churches/{churchId}/attendanceRecords/{recordId}
churches/{churchId}/announcements/{announcementId}
churches/{churchId}/events/{eventId}
churches/{churchId}/followUps/{followUpId}
churches/{churchId}/spotlight/current
users/{userId}
```

### Why this structure

- Easier tenant isolation
- Cleaner Firestore rules
- Easier church export/import later
- More natural white-label settings storage

---

## 7. Collection Design

### 7.1 users

Global identity for platform users.

```ts
type UserProfile = {
  id: string;
  email: string;
  displayName?: string;
  phone?: string;
  photoUrl?: string;
  globalRole?: 'platform_admin' | 'support';
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

This collection is platform-wide and should not store church-specific permissions directly.

### 7.2 memberships

Membership connects a user to a church.

```ts
type Membership = {
  id: string;
  userId: string;
  churchId: string;
  role: 'church_admin' | 'teacher' | 'volunteer' | 'viewer';
  classIds?: string[];
  status: 'active' | 'invited' | 'disabled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

This is the most important collection for authorization.

### 7.3 classes

```ts
type ClassRoom = {
  id: string;
  name: string;
  code: string;
  ageRange?: string;
  teacherIds?: string[];
  roomName?: string;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

### 7.4 students

```ts
type Student = {
  id: string;
  fullName: string;
  preferredName?: string;
  gender?: string;
  dob?: string;
  classId: string;
  parentIds?: string[];
  primaryPhone?: string;
  address?: string;
  photoUrl?: string;
  active: boolean;
  notes?: string;
  joinedAt?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

### 7.5 parents

```ts
type Parent = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  relationship?: 'mother' | 'father' | 'guardian' | 'other';
  studentIds: string[];
  preferredContact?: 'call' | 'sms' | 'whatsapp' | 'email';
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

### 7.6 attendanceSessions

Represents a specific class meeting or church session.

```ts
type AttendanceSession = {
  id: string;
  date: string;
  classId: string;
  title?: string;
  summary?: string;
  conductedByUserId: string;
  status: 'open' | 'submitted' | 'locked';
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

### 7.7 attendanceRecords

```ts
type AttendanceRecord = {
  id: string;
  sessionId: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  note?: string;
  markedByUserId: string;
  markedAt: Timestamp;
};
```

### 7.8 announcements

```ts
type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: 'all' | 'teachers' | 'parents' | 'class';
  classIds?: string[];
  publishedAt?: Timestamp;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

### 7.9 events

```ts
type Event = {
  id: string;
  title: string;
  description?: string;
  startAt: Timestamp;
  endAt?: Timestamp;
  location?: string;
  classIds?: string[];
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

### 7.10 followUps

```ts
type FollowUp = {
  id: string;
  studentId: string;
  reason: 'absence' | 'birthday' | 'new_joiner' | 'pastoral_note' | 'other';
  status: 'open' | 'in_progress' | 'completed';
  assignedToUserId?: string;
  note?: string;
  dueDate?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

---

## 8. White-Label Settings Model

Every church needs branding and configuration settings.

### 8.1 Branding settings

Store in:

`churches/{churchId}/settings/branding`

```ts
type BrandingSettings = {
  churchDisplayName: string;
  shortName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  supportEmail?: string;
  supportPhone?: string;
  updatedAt: Timestamp;
};
```

### 8.2 Feature settings

Store in:

`churches/{churchId}/settings/features`

```ts
type FeatureSettings = {
  attendance: boolean;
  reports: boolean;
  students: boolean;
  parents: boolean;
  followUps: boolean;
  events: boolean;
  announcements: boolean;
  spotlight: boolean;
  parentPortal: boolean;
  customDomain: boolean;
  updatedAt: Timestamp;
};
```

### 8.3 General settings

Store in:

`churches/{churchId}/settings/general`

```ts
type GeneralSettings = {
  timezone: string;
  dateFormat?: string;
  defaultLanguage?: string;
  attendanceDays?: string[];
  attendanceLockAfterHours?: number;
  updatedAt: Timestamp;
};
```

---

## 9. Roles and Permission Model

### Platform roles

- `platform_admin`
  - Manage all churches
  - View platform analytics
  - Support and onboarding access

- `support`
  - Restricted operational access for support tasks

### Church roles

- `church_admin`
  - Full control inside one church
  - Manage members, classes, settings, students, attendance, reports

- `teacher`
  - Manage assigned classes
  - Mark attendance
  - View class reports
  - Add class notes

- `volunteer`
  - Limited attendance entry and viewing

- `viewer`
  - Read-only dashboard access

### Permission examples

| Action | church_admin | teacher | volunteer | viewer |
|---|---|---|---|---|
| Manage church settings | Yes | No | No | No |
| Add/edit students | Yes | Assigned classes | Limited | No |
| Mark attendance | Yes | Assigned classes | Assigned classes | No |
| View reports | Yes | Assigned classes | Limited | Yes |
| Manage branding | Yes | No | No | No |

---

## 10. Firestore Security Rules Strategy

Current rules are too broad for a platform.

New rules should verify:

1. user is authenticated
2. user belongs to the church
3. user role allows the action
4. user can only access records in that tenant

### Recommended rule approach

- Keep platform admin logic separate
- Use membership lookups for tenant authorization
- Restrict write access by role
- Restrict teachers to assigned classes

### Example direction

```js
function isSignedIn() {
  return request.auth != null;
}

function membershipDoc(churchId) {
  return /databases/$(database)/documents/churches/$(churchId)/members/$(request.auth.uid);
}

function isChurchMember(churchId) {
  return isSignedIn() &&
    exists(membershipDoc(churchId));
}

function churchRole(churchId) {
  return get(membershipDoc(churchId)).data.role;
}

function isChurchAdmin(churchId) {
  return isChurchMember(churchId) &&
    churchRole(churchId) == 'church_admin';
}
```

Note:
Use membership IDs equal to `userId` if possible. That makes rules simpler.

---

## 11. Query and App Context Strategy

Both mobile and web must stop using global queries.

Instead of:

- query all students
- query all attendance

Use:

- load active church
- load membership
- query church-scoped collections

### Recommended frontend context

Create a shared concept of:

- authenticated user
- active church
- active membership
- active branding
- active feature flags

### Example app flow

1. User signs in
2. Load `users/{userId}`
3. Load memberships
4. User selects church if multiple memberships exist
5. Load church settings
6. Render themed app
7. All data queries use `churchId`

---

## 12. White-Label UI Strategy

### Mobile

Start with one shared app build.

After login or tenant resolution:
- load church branding
- apply dynamic theme tokens
- show church logo and name
- enable only allowed features

This is the best first white-label version.

Later premium option:
- per-church branded mobile builds
- unique bundle ID
- app icon and splash screen override

### Website

Recommended progression:

1. shared domain with tenant context
   - example: `app.sundayclass.com/church/{slug}`

2. subdomain support
   - example: `gracechurch.sundayclass.com`

3. custom domain support
   - example: `school.gracechurch.org`

The website should load branding before rendering key pages.

---

## 13. Migration Plan From Current App

Do not rebuild from scratch. Migrate in stages.

### Phase 1: Schema preparation

- Create `churches` collection
- Create one initial church for the existing app
- Add settings documents
- Add member records for current users

### Phase 2: Data migration

Move:
- `students` -> `churches/{churchId}/students`
- `attendance` -> `churches/{churchId}/attendanceRecords`
- `class_sessions` -> `churches/{churchId}/attendanceSessions`
- `spotlight/current` -> `churches/{churchId}/spotlight/current`

### Phase 3: App query migration

Update mobile and website:
- replace global collection paths
- use active church context
- load membership and settings first

### Phase 4: Security migration

- deploy new Firestore rules
- verify role-based access
- test teacher vs admin boundaries

### Phase 5: White-label rollout

- add dynamic branding on website
- add dynamic theming on mobile
- add feature toggles

### Phase 6: Onboarding and scale

- create church onboarding flow
- invite admins and teachers
- add self-service settings page

---

## 14. Suggested Backend Service Boundaries

Even if you continue with Firebase, structure the logic as domain services instead of scattered helpers.

Recommended service areas:

- `auth`
- `churchs`
- `memberships`
- `students`
- `classes`
- `attendance`
- `settings`
- `branding`
- `reports`
- `followUps`

For code organization, create one shared domain layer used by both apps if possible.

Example shared package responsibilities:

- collection path builders
- shared types
- permission helpers
- tenant-aware query helpers
- date formatting helpers

---

## 15. Reporting Model

The platform should support both operational and leadership reporting.

### Operational reports

- today attendance by class
- absent students
- pending follow-ups
- teacher activity

### Leadership reports

- weekly attendance trend
- monthly class growth
- inactive student list
- new students added
- attendance percentage by class

### Future reporting improvements

- derived analytics collection
- scheduled aggregations
- export per church
- year-over-year comparisons

---

## 16. Recommended Immediate Refactors In This Codebase

Based on the current project, these should happen first:

1. Move Firebase collection access behind tenant-aware helpers
2. Add church context to both mobile and website
3. Replace global collections with church-scoped paths
4. Add role-aware guards on screens and actions
5. Move branding/theme values to tenant settings
6. Clean up date handling to avoid timezone errors
7. Remove hardcoded environment-specific config where possible

---

## 17. Development Roadmap

### Milestone 1: Foundation

- Create church data model
- Create membership model
- Refactor Firestore paths
- Update rules
- Add active church context

### Milestone 2: Tenant-ready app

- Migrate students
- Migrate attendance
- Migrate sessions
- Add role-based UI behavior

### Milestone 3: White-label core

- Branding settings
- Dynamic theming
- Feature toggles
- Church settings UI

### Milestone 4: Platform operations

- Church onboarding
- Invite flows
- Platform admin dashboard
- Tenant support tools

### Milestone 5: Advanced modules

- Parents
- Announcements
- Events
- Follow-ups
- Parent portal

---

## 18. First Build Sequence

Use this exact order to reduce risk:

1. Define Firestore schema and shared types
2. Add initial `churches/{churchId}` structure
3. Create membership-based authorization model
4. Refactor mobile queries to tenant-aware queries
5. Refactor website queries to tenant-aware queries
6. Deploy stricter Firestore rules
7. Migrate old data into tenant collections
8. Add branding settings and dynamic theme loading
9. Add church onboarding
10. Add premium white-label features

---

## 19. Example Tenant-Aware Path Design

Use helper functions instead of hardcoding collection names everywhere.

```ts
const paths = {
  church: (churchId: string) => `churches/${churchId}`,
  students: (churchId: string) => `churches/${churchId}/students`,
  student: (churchId: string, studentId: string) =>
    `churches/${churchId}/students/${studentId}`,
  attendanceSessions: (churchId: string) =>
    `churches/${churchId}/attendanceSessions`,
  attendanceRecords: (churchId: string) =>
    `churches/${churchId}/attendanceRecords`,
  branding: (churchId: string) =>
    `churches/${churchId}/settings/branding`,
};
```

This will make the migration much easier and reduce mistakes.

---

## 20. Final Recommendation

Your next move should not be adding more isolated features to the current single-church structure.

Your next move should be:

1. redesign the data model for multi-tenancy
2. introduce roles and memberships
3. refactor queries around `churchId`
4. secure tenant boundaries
5. add white-label branding on top

That sequence gives you a platform foundation that can support many churches without rewriting everything later.
