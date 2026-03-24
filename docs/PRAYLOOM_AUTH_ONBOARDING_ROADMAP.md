# PrayLoom Auth, Subscription, and Onboarding Roadmap

## Product foundation

PrayLoom begins as a church Sunday class attendance and operations platform.

The first product version should focus on:

- church onboarding
- center setup
- member account creation
- student registration
- attendance marking
- reporting

Future ministry features can be added later only after this foundation is stable.

## Core business model

One church purchases PrayLoom and creates one workspace.

That workspace contains:

- the main church
- multiple centers
- members
- students
- attendance
- reports
- branding

Example:

- Hosanna Church
  - Church
  - Center 1
  - Center 2
  - Center 3

## User types

### Church Admin

- signs up on the website
- chooses a subscription plan
- creates the church workspace
- configures branding
- creates centers
- creates member accounts
- manages students
- views reports

### Teacher

- receives a generated login ID and temporary password
- logs in to the mobile app
- sees assigned centers only
- registers students if permitted
- marks attendance

### Volunteer

- similar to teacher but with more limited permissions

### Viewer

- read-only access where allowed

## Final login strategy

### Church admin login

Church admin signs up with:

- real email
- password

### Member login

Teachers and other members do not need to use their personal email.

The system generates a PrayLoom login ID using:

`name@churchslug.prayloom`

Examples:

- `john@hosanna.prayloom`
- `mary.samuel@hosanna.prayloom`

If the name is already taken:

- `john2@hosanna.prayloom`
- `john3@hosanna.prayloom`

Under the hood, this still uses Firebase email/password authentication, which keeps the implementation simple and secure.

## Why this login model is good

- no personal email required for teachers
- easy to remember
- church-branded identity
- works with Firebase Auth
- allows password reset later
- supports separate accounts for each member
- preserves role-based and center-based access control

## Account creation model

### Church admin account

Created by self-signup.

### Member accounts

Created by the church admin or platform through the website.

For each member:

1. Admin enters full name
2. Admin chooses role
3. Admin selects center access
4. System generates login ID
5. System generates temporary password
6. System creates Firebase Auth account
7. System creates membership document
8. Member uses mobile app login

## Role model

### church_admin

- full workspace access
- manage subscription
- manage branding
- manage centers
- manage members
- manage students
- view all reports

### teacher

- assigned centers only
- view students in assigned centers
- register students if allowed
- mark attendance

### volunteer

- assigned centers only
- help with attendance
- limited student and center actions

### viewer

- read-only access where allowed

## Center model

Each church has:

- one default `Church` center
- optional additional centers

Examples:

- Church
- Center 1
- Center 2
- Center 3

Each center should store:

- name
- code
- host/member
- host phone
- location/area
- address
- active status

## Data model

```text
users/{uid}
churches/{churchId}
churches/{churchId}/settings/branding
churches/{churchId}/settings/general
churches/{churchId}/settings/features
churches/{churchId}/centers/{centerId}
churches/{churchId}/members/{uid}
churches/{churchId}/students/{studentId}
churches/{churchId}/attendanceRecords/{recordId}
churches/{churchId}/attendanceSessions/{sessionId}
```

## Important user document fields

### users/{uid}

- `email`
- `displayName`
- `defaultChurchId`
- `churchIds`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

### churches/{churchId}/members/{uid}

- `userId`
- `churchId`
- `loginId`
- `displayName`
- `role`
- `status`
- `centerIds`
- `joinedAt`
- `createdAt`
- `updatedAt`

## Authentication states

Every user should fall into one of these states:

- unauthenticated
- authenticated but email not verified
- authenticated but no church linked
- authenticated with active membership
- authenticated but disabled
- authenticated but incomplete profile

This prevents loopholes and confusing access behavior.

## Website flow

### Public flow

1. Home page
2. Pricing page
3. Sign in
4. Start workspace

### Private onboarding flow

1. Signup
2. Verify email
3. Choose subscription plan
4. Create church workspace
5. Set church branding
6. Create centers
7. Add members
8. Dashboard

## Mobile flow

1. Member receives login ID and temporary password
2. Member opens mobile app
3. Member signs in
4. App resolves:
   - user profile
   - church membership
   - center permissions
5. Member can:
   - register students
   - mark attendance
   - view assigned data only

## Subscription plan model

Subscription should be introduced during onboarding after signup and before full workspace setup.

Recommended order:

1. signup
2. verify email
3. choose plan
4. create workspace

### Starter

- small church
- limited centers
- limited members
- attendance
- students
- basic reports

### Growth

- more centers
- more members
- advanced reports
- richer branding
- spotlight/live feed

### Premium

- unlimited centers
- richer analytics
- advanced branding
- premium support
- future white-label extras

## Security principles for auth

PrayLoom should use a layered security model, not custom cryptography.

Auth module security should include:

- Firebase Authentication
- Firestore Security Rules
- Storage Security Rules
- church-level tenant isolation
- role-based access control
- center-based access control
- email verification for admins
- audit fields
- optional MFA later for admins

## Exact implementation phases

## Phase 1: Auth foundation

Build a proper auth module for both website and mobile.

### Goals

- one central web auth context
- one central mobile auth context
- shared auth state model
- stop duplicating auth state logic
- create route guard structure

### Files to improve first

- `website/src/context/AuthContext.tsx`
- `website/src/app/login/page.tsx`
- `website/src/app/signup/page.tsx`
- `mobile/app/(auth)/login.tsx`
- `mobile/app/index.tsx`
- `mobile/app/(auth)/_layout.tsx`
- `mobile/app/(tabs)/_layout.tsx`

### New auth state shape

Suggested state:

- `user`
- `loading`
- `isAuthenticated`
- `isEmailVerified`
- `profileReady`
- `membershipReady`
- `authStatus`

## Phase 2: Signup and login hardening

### Signup improvements

- stronger validation
- better password policy
- normalized email handling
- clearer duplicate email handling
- email verification send step
- bootstrap user profile creation

### Login improvements

- centralized error mapping
- disabled account handling
- missing membership handling
- unverified account handling
- incomplete setup handling

## Phase 3: Forgot password and recovery

### Needs

- forgot password page
- reset password request
- success state
- cleaner support messaging

## Phase 4: Subscription module

### Goals

- plan selection page during onboarding
- store selected plan on church document
- enable plan-aware limits later

Plan-related fields on church doc:

- `plan`
- `subscriptionStatus`
- `billingState`
- `trialEndsAt`

## Phase 5: Church onboarding module

### Goals

- create workspace
- save branding
- create centers
- add members
- finish setup

This should be the polished setup journey for the church admin.

## Phase 6: Member provisioning

### Goals

- church admin creates member
- system generates login ID
- system checks for duplicates
- system creates Firebase Auth account
- system assigns temporary password
- system creates user profile
- system creates membership doc

Suggested generated fields:

- `loginId`
- `temporaryPassword`
- `role`
- `centerIds`

## Phase 7: Access enforcement

### Goals

- route guards
- role guards
- center guards
- Firestore rule alignment
- Storage rule alignment

## Phase 8: Auth hardening

### Later improvements

- email verification enforcement
- `lastLoginAt`
- account disable flow
- admin MFA
- audit trail for auth-sensitive operations

## What not to build first

Do not start with:

- custom member-ID auth backend
- custom encryption algorithms
- full white-label app-icon automation
- large feature expansion

These can come later.

## The exact build order from here

1. Auth foundation
2. Signup and login hardening
3. Password recovery
4. Subscription step
5. Church onboarding flow polish
6. Member provisioning with generated login IDs
7. Role and center access enforcement
8. Reporting and workflow polish

## Immediate next step

Start with Phase 1 only:

- centralize auth state
- remove duplicated auth listeners
- define route guards
- define the final auth state model

Once that is clean, then implement signup, login, verification, subscription, and onboarding on top of it.
