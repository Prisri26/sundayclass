# Firestore Multi-Tenant Specification

## 1. Purpose

This document defines the exact Firestore structure for turning Sundayclass into a multi-tenant white-label platform for churches.

It is intended to be the implementation contract for:

- mobile app queries
- website queries
- Firestore rules
- migrations
- onboarding flows

This spec assumes:

- one Firebase project
- many churches in the same project
- strict tenant isolation
- white-label settings per church

---

## 2. Top-Level Collections

Recommended top-level collections:

```text
users/{userId}
churches/{churchId}
```

Everything business-related should live under `churches/{churchId}`.

Recommended church subcollections:

```text
churches/{churchId}/members/{userId}
churches/{churchId}/settings/{docId}
churches/{churchId}/classes/{classId}
churches/{churchId}/students/{studentId}
churches/{churchId}/parents/{parentId}
churches/{churchId}/attendanceSessions/{sessionId}
churches/{churchId}/attendanceRecords/{recordId}
churches/{churchId}/announcements/{announcementId}
churches/{churchId}/events/{eventId}
churches/{churchId}/followUps/{followUpId}
churches/{churchId}/spotlight/current
```

Use `settings` document IDs:

- `general`
- `branding`
- `features`

---

## 3. Document Shapes

### 3.1 users/{userId}

Platform identity profile.

```ts
type UserProfile = {
  id: string;
  email: string;
  displayName?: string;
  phone?: string;
  photoUrl?: string;
  globalRole?: 'platform_admin' | 'support';
  defaultChurchId?: string;
  churchIds?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

Notes:
- `churchIds` is optional convenience data, not the source of truth
- actual authorization should use membership documents

### 3.2 churches/{churchId}

```ts
type Church = {
  id: string;
  name: string;
  slug: string;
  legalName?: string;
  status: 'trial' | 'active' | 'suspended';
  plan: 'starter' | 'growth' | 'premium';
  timezone: string;
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
  onboardingState?: 'created' | 'setup_started' | 'setup_completed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

### 3.3 churches/{churchId}/members/{userId}

Use `userId` as the document ID. This makes rules much simpler.

```ts
type Membership = {
  userId: string;
  churchId: string;
  role: 'church_admin' | 'teacher' | 'volunteer' | 'viewer';
  classIds?: string[];
  status: 'invited' | 'active' | 'disabled';
  invitedByUserId?: string;
  invitedEmail?: string;
  joinedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

Notes:
- `classIds` is required for teachers if class-scoped access is enforced
- `status` should be checked in security rules

### 3.4 churches/{churchId}/settings/general

```ts
type GeneralSettings = {
  timezone: string;
  locale?: string;
  dateFormat?: string;
  attendanceDays?: string[];
  attendanceLockAfterHours?: number;
  defaultClassIds?: string[];
  updatedAt: Timestamp;
};
```

### 3.5 churches/{churchId}/settings/branding

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
  surfaceColor?: string;
  textColor?: string;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  supportEmail?: string;
  supportPhone?: string;
  updatedAt: Timestamp;
};
```

### 3.6 churches/{churchId}/settings/features

```ts
type FeatureSettings = {
  attendance: boolean;
  students: boolean;
  reports: boolean;
  classes: boolean;
  parents: boolean;
  announcements: boolean;
  events: boolean;
  followUps: boolean;
  spotlight: boolean;
  parentPortal: boolean;
  customDomain: boolean;
  updatedAt: Timestamp;
};
```

### 3.7 churches/{churchId}/classes/{classId}

```ts
type ClassRoom = {
  id: string;
  name: string;
  code: string;
  levelOrder?: number;
  ageRange?: string;
  teacherIds?: string[];
  volunteerIds?: string[];
  roomName?: string;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

Notes:
- `levelOrder` helps sort classes in UI
- `teacherIds` is useful for fast UI filters, but security should still rely on memberships

### 3.8 churches/{churchId}/students/{studentId}

```ts
type Student = {
  id: string;
  fullName: string;
  preferredName?: string;
  gender?: 'male' | 'female' | 'other';
  dob?: string;
  classId: string;
  parentIds?: string[];
  primaryPhone?: string;
  secondaryPhone?: string;
  address?: string;
  photoUrl?: string;
  notes?: string;
  tags?: string[];
  active: boolean;
  joinedAt?: string;
  createdByUserId?: string;
  updatedByUserId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

### 3.9 churches/{churchId}/parents/{parentId}

```ts
type Parent = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  relationship?: 'mother' | 'father' | 'guardian' | 'other';
  studentIds: string[];
  preferredContact?: 'call' | 'sms' | 'whatsapp' | 'email';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

### 3.10 churches/{churchId}/attendanceSessions/{sessionId}

One document per class session.

Recommended ID format:

`{date}_{classId}`

Example:

`2026-03-14_class-1`

```ts
type AttendanceSession = {
  id: string;
  date: string;
  classId: string;
  title?: string;
  summary?: string;
  conductedByUserId: string;
  status: 'open' | 'submitted' | 'locked';
  submittedAt?: Timestamp;
  lockedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

### 3.11 churches/{churchId}/attendanceRecords/{recordId}

One document per student per session.

Recommended ID format:

`{sessionId}_{studentId}`

Example:

`2026-03-14_class-1_student-27`

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

### 3.12 churches/{churchId}/announcements/{announcementId}

```ts
type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: 'all' | 'teachers' | 'parents' | 'class';
  classIds?: string[];
  active: boolean;
  publishedAt?: Timestamp;
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

### 3.13 churches/{churchId}/events/{eventId}

```ts
type Event = {
  id: string;
  title: string;
  description?: string;
  startAt: Timestamp;
  endAt?: Timestamp;
  location?: string;
  classIds?: string[];
  registrationRequired?: boolean;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

### 3.14 churches/{churchId}/followUps/{followUpId}

```ts
type FollowUp = {
  id: string;
  studentId: string;
  classId?: string;
  reason: 'absence' | 'birthday' | 'new_joiner' | 'pastoral_note' | 'other';
  status: 'open' | 'in_progress' | 'completed';
  assignedToUserId?: string;
  note?: string;
  dueDate?: string;
  createdByUserId?: string;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

### 3.15 churches/{churchId}/spotlight/current

```ts
type Spotlight = {
  active: boolean;
  studentId?: string;
  studentName?: string;
  photoUrl?: string;
  updatedAt: Timestamp;
};
```

---

## 4. Core Query Patterns

### Attendance screen

Inputs:
- `churchId`
- selected `date`
- selected `classId`

Queries:
- `churches/{churchId}/students where classId == {classId} and active == true`
- `churches/{churchId}/attendanceSessions/{date}_{classId}`
- `churches/{churchId}/attendanceRecords where sessionId == {date}_{classId}`

### Dashboard

Inputs:
- `churchId`
- role
- classIds if teacher

Queries:
- `students`
- `attendanceRecords`
- `attendanceSessions`
- `followUps`

Church admin sees all church data.
Teacher sees only assigned classes.

### Student details

Queries:
- `students/{studentId}`
- `attendanceRecords where studentId == {studentId}`
- `followUps where studentId == {studentId}`

---

## 5. Recommended Composite Indexes

These will likely be needed in Firestore:

### students

- `classId ASC, active ASC, fullName ASC`

### attendanceRecords

- `date DESC, classId ASC`
- `sessionId ASC, status ASC`
- `studentId ASC, date DESC`
- `classId ASC, date DESC`

### attendanceSessions

- `date DESC, classId ASC`

### followUps

- `status ASC, dueDate ASC`
- `studentId ASC, createdAt DESC`
- `assignedToUserId ASC, status ASC`

### announcements

- `active ASC, publishedAt DESC`

### events

- `active ASC, startAt ASC`

---

## 6. Data Ownership Rules

These rules should hold across the app:

1. Every document under `churches/{churchId}` belongs only to that church
2. Every authenticated user acts through a membership
3. Membership drives authorization
4. `platform_admin` is the only global override
5. Public access should be limited to explicitly public views only, such as optional spotlight display

---

## 7. Naming and ID Conventions

Use stable, readable IDs where helpful:

- `churchId`: generated ID or slug-based ID
- `classId`: generated ID
- `studentId`: generated ID
- `attendanceSessionId`: `{date}_{classId}`
- `attendanceRecordId`: `{sessionId}_{studentId}`
- membership ID: `userId`

Benefits:
- predictable writes
- idempotent updates
- simpler rules and deduplication

---

## 8. Date and Time Rules

Avoid using raw `toISOString().split('T')[0]` as the only date strategy in tenant workflows because church timezone matters.

Recommended rules:

- store business date as `YYYY-MM-DD`
- store event moments as Firestore `Timestamp`
- derive `YYYY-MM-DD` using the church timezone
- store the church timezone in `churches/{churchId}` and `settings/general`

Examples:

- `attendanceSessions.date = "2026-03-14"`
- `attendanceRecords.date = "2026-03-14"`
- `markedAt = Timestamp`

---

## 9. Migration Mapping From Current Collections

Current collection to target mapping:

```text
students
-> churches/{churchId}/students

attendance
-> churches/{churchId}/attendanceRecords

class_sessions
-> churches/{churchId}/attendanceSessions

spotlight/current
-> churches/{churchId}/spotlight/current
```

Field mapping from current `Student`:

```text
name -> fullName
class -> classId or mapped class reference
phone -> primaryPhone
dob -> dob
photoUrl -> photoUrl
```

Important note:
Current class values like `LKG`, `1st`, `2nd` should become real class documents first.

---

## 10. Minimum Viable Seed Data For One Church

When onboarding a new church, create:

1. `churches/{churchId}`
2. `churches/{churchId}/settings/general`
3. `churches/{churchId}/settings/branding`
4. `churches/{churchId}/settings/features`
5. `churches/{churchId}/members/{adminUserId}`
6. default classes

Suggested default classes:

- `LKG`
- `UKG`
- `1st`
- `2nd`
- `3rd`
- `4th`
- `5th`
- `6th`
- `7th`
- `8th`
- `9th`
- `10th`
- `11th`
- `12th`

---

## 11. App Refactor Checklist Against This Spec

### Mobile

- add active church context
- replace global student queries
- replace global attendance queries
- add class-scoped attendance session flow
- load branding and feature settings before rendering main tabs

### Website

- add active church context
- scope dashboard queries by church
- scope student CRUD by church
- scope reports by church
- add settings screens for branding and church profile

### Shared

- create shared path builder helpers
- create shared type definitions
- create shared permission helpers
- create timezone-safe date helpers

---

## 12. Final Implementation Guidance

Build against this spec in this order:

1. create church and membership models
2. create tenant-aware collection path helpers
3. migrate student and attendance reads
4. migrate writes and upserts
5. deploy multi-tenant rules
6. migrate old data
7. add branding and feature toggles

This keeps the migration controlled and reduces the chance of leaking data between churches.
