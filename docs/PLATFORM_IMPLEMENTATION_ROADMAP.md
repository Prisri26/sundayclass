# Sundayclass Self-Service White-Label Roadmap

## 1. Purpose

This roadmap defines how Sundayclass should move forward as a self-service white-label platform for churches.

The key principle is:

`the church should create and manage its own branded workspace`

This means the platform should not depend on you manually creating every church forever. Instead, the church should be able to sign up, create its workspace, add branding, create centers, invite teachers, and start using the product.

---

## 2. Product Direction

Sundayclass should become:

`multi-tenant SaaS + self-service onboarding + white-label branding`

That means:

- many churches use the same product
- each church sees only its own data
- each church can brand the experience as its own
- each church can create its own centers and team

---

## 3. Correct Ownership Model

### Platform Owner

This is you.

Responsibilities:

- build and maintain the platform
- manage support and subscriptions
- review onboarding issues
- manage plans, limits, and platform-wide settings
- handle exceptional cases and support operations

Important:
You should **not** be the normal person creating every church manually in the long run.

### Church Admin

This is the first user from a church who signs up and creates the workspace.

Responsibilities:

- create the church workspace
- complete onboarding
- set logo, colors, and branding
- create centers like `A1`, `A2`, `A3`
- invite teachers and volunteers
- manage students and reports

### Teacher / Volunteer

Responsibilities:

- mark attendance
- manage assigned students if permitted
- operate their center
- update Sunday session notes

---

## 4. Real Product Structure

The business structure should be:

```text
Platform
  -> Church Workspace
    -> Centers
      -> Students
      -> Attendance
      -> Spotlight
```

Notes:

- `Church` is the tenant
- `Center` is a Sunday class unit such as `A1`, `A2`, `A3`
- if the church itself conducts Sunday class directly, there should be a church-level center such as `Church`

---

## 5. White-Label Experience

For the platform to feel truly white-label, a church should be able to do this without your manual intervention:

1. sign up
2. create church workspace
3. choose church name and slug
4. upload logo
5. choose colors/theme
6. create centers
7. invite team
8. add students
9. start attendance

That is the target experience.

---

## 6. Required Self-Service Onboarding Flow

This is the correct onboarding sequence for a church.

### Step 1. Sign Up

The first church admin creates an account.

Required fields:

- full name
- email
- password

Result:

- `users/{userId}` created

### Step 2. Create Church Workspace

After account creation, the system asks:

- church name
- church slug / ID
- contact phone
- contact email
- timezone
- country

Result:

- `churches/{churchId}` created
- current user becomes first `church_admin`
- default settings docs are created

### Step 3. Branding Setup

The church should configure:

- church display name
- logo
- primary color
- secondary color
- accent color
- welcome title
- welcome subtitle

Result:

- `churches/{churchId}/settings/branding` created

### Step 4. Create Centers

The church admin creates their Sunday class centers.

Examples:

- `A1`
- `A2`
- `A3`
- `Church`

Center fields:

- center name
- center code
- host/member name
- phone
- area
- address
- is church-level center
- active

Result:

- `churches/{churchId}/centers/{centerId}` docs created

### Step 5. Invite Team

The church admin adds:

- teachers
- volunteers
- viewers

Result:

- `members` docs created for each invited user

### Step 6. Start Operations

Now the church can:

- add students
- assign students to centers
- mark attendance
- use reports

---

## 7. What Must Be Built First

Before advanced theme or premium white-label features, the platform needs a working self-service flow.

### First required features

1. church signup flow
2. create church workspace flow
3. auto-create church admin membership
4. branding setup page
5. centers setup page
6. invite members page

Without this, the white-label system is incomplete.

---

## 8. Recommended Implementation Order

### Phase 1. Platform Foundation

Goal:
Make the data model and security ready for many churches.

Build:

- tenant-aware Firestore structure
- membership model
- church context
- secure Firestore rules
- tenant-scoped reads and writes

Status:
- much of this is already underway

### Phase 2. Self-Service Onboarding

Goal:
Allow churches to create their own workspace.

Build:

- sign up page
- create church workspace page
- onboarding progress state
- create first `church_admin` membership
- create default settings documents

This is the most important next phase.

### Phase 3. Church Setup Wizard

Goal:
Help the church finish setup quickly.

Build:

- branding step
- centers step
- invite team step
- finish setup step

This should be a guided onboarding wizard.

### Phase 4. Church Admin Dashboard

Goal:
Give the church admin a complete web workspace.

Build:

- visible active church/workspace header
- church settings page
- centers management page
- members management page
- students management page
- attendance and reports

### Phase 5. Mobile Tenant Context

Goal:
Bring the church/center experience into mobile safely.

Build:

- show active church in mobile
- show active center
- center-based attendance
- safe church/center switching if needed

### Phase 6. Advanced White-Label

Goal:
Deepen branding and premium tenant experience.

Build:

- per-church theme override
- custom logo on mobile/web
- welcome text
- branded exports
- custom domains
- optional separate branded app builds later

---

## 9. Website First, Mobile Next

The setup flow should start on the website.

### Website should handle

- church signup onboarding
- church workspace creation
- branding setup
- centers creation
- team invites
- admin settings
- reports

### Mobile should handle

- attendance
- student registration
- spotlight
- teacher workflows

Reason:

- setup is easier on web
- admins are more likely to do onboarding on web
- mobile should stay focused on operational use

---

## 10. Theme and Branding Strategy

Theme should be driven by church settings.

Store branding in:

```text
churches/{churchId}/settings/branding
```

Suggested fields:

- `churchDisplayName`
- `shortName`
- `logoUrl`
- `primaryColor`
- `secondaryColor`
- `accentColor`
- `welcomeTitle`
- `welcomeSubtitle`

### Theme loading behavior

1. app loads default platform theme
2. active church branding is loaded
3. church theme overrides the default theme

This should work on both:

- website
- mobile

---

## 11. Platform Admin Role in a White-Label Model

Platform admin is still needed, but not for everyday church creation.

Platform admin should manage:

- subscriptions
- support
- suspending or reactivating churches
- viewing all tenants
- resolving onboarding issues
- platform analytics

Platform admin should not be the normal user path for onboarding each church.

---

## 12. Immediate Next Build Step

The next correct feature to build is:

`Website: Church Self-Onboarding`

That should include:

1. sign up
2. create church workspace
3. create first church admin membership
4. save default branding/settings

After that, build:

`Website: Setup Wizard`

with:

1. branding
2. centers
3. team invites

---

## 13. Success Criteria

The platform is moving in the right direction when this becomes possible:

1. a church admin signs up
2. the church admin creates a church workspace
3. the church admin sets logo and theme
4. the church admin creates centers like `A1`, `A2`, `A3`, `Church`
5. the church admin invites teachers
6. teachers use the mobile app for attendance
7. reports show only that church’s data
8. the product feels like the church’s own branded system

That is the correct white-label outcome for Sundayclass.
