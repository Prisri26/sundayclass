# Sundayclass BRD For Figma

## 1. Document Purpose

This BRD defines the product scope, business goals, users, features, workflows, and screen requirements for the Sundayclass platform.

It is written so it can be used directly for:

- Figma design planning
- Figma Make prompts
- UI/UX handoff
- future product discussions
- development planning

This document reflects the intended evolution of Sundayclass from a single church attendance app into a multi-tenant white-label church platform.

---

## 2. Product Name

`Sundayclass`

Tagline:
`A church learning and attendance platform for Sunday school management`

---

## 3. Product Summary

Sundayclass is a church-focused platform that helps churches manage:

- student registration
- class organization
- weekly attendance
- teacher workflows
- parent contact
- reports and analytics
- announcements and events
- follow-up processes
- white-label branding per church

The platform includes:

- a mobile app for teachers and volunteers
- a web dashboard for church admins and leadership
- a multi-tenant backend so many churches can use the same platform safely

---

## 4. Business Problem

Many churches manage Sunday school attendance and student information manually through notebooks, spreadsheets, or WhatsApp messages.

This creates problems:

- no centralized student data
- no attendance trends
- hard to follow up with absent students
- poor coordination between teachers and admins
- no standardized reporting
- difficult scaling across multiple classes or branches

Sundayclass solves this by providing one structured system for church education management.

---

## 5. Product Vision

Build Sundayclass into a white-label SaaS platform for churches where each church can:

- manage its own users, classes, and students
- mark attendance quickly on mobile
- see reports on web
- customize branding and settings
- operate independently inside the same platform

Vision statement:

`To become the operating system for church Sunday school management`

---

## 6. Business Goals

### Short-term goals

- digitize student registration
- digitize attendance tracking
- provide church dashboard reports
- support multiple teachers and classes

### Mid-term goals

- add multi-tenant support for many churches
- add white-label branding
- add follow-up and parent communication workflows

### Long-term goals

- support church networks, dioceses, and ministries
- support custom domains and premium branding
- support analytics and leadership insights

---

## 7. Target Users

### Primary users

#### Church Admin

Responsibilities:
- manage church workspace
- manage teachers and volunteers
- manage students and classes
- view reports and trends
- configure branding and settings

#### Teacher

Responsibilities:
- mark attendance
- view assigned class students
- add student notes
- view class-level reports

#### Volunteer

Responsibilities:
- assist in attendance marking
- limited student management
- support follow-up tasks

### Secondary users

#### Parent

Future user type.
Needs:
- view announcements
- view child attendance summary
- receive event reminders

#### Platform Admin

Internal SaaS administrator.
Needs:
- manage tenant onboarding
- manage plans and support
- supervise platform-wide operations

---

## 8. User Roles

### Platform roles

- `platform_admin`
- `support`

### Church roles

- `church_admin`
- `teacher`
- `volunteer`
- `viewer`

### Access model

- platform admins manage all churches
- church admins manage one church
- teachers manage assigned classes
- volunteers have limited operational access
- viewers have read-only access

---

## 9. Platform Scope

### In scope for this product

- church onboarding
- multi-tenant architecture
- white-label branding
- mobile attendance workflow
- student management
- class management
- reports and analytics
- live spotlight screen
- follow-up management
- announcements and events

### Out of scope for now

- online payments
- donations
- livestream management
- sermon publishing
- full parent portal implementation
- external church member management beyond Sunday school

---

## 10. Core Product Modules

### Module 1: Authentication

Features:
- email/password login
- role-based access
- tenant-aware login context
- church selection for users with multi-church access

### Module 2: Church Workspace

Features:
- self-service church workspace creation
- church profile
- church settings
- timezone and date format
- branding settings
- feature toggles

### Module 2A: Church Onboarding

Features:
- church admin signup
- create church workspace
- first church admin role assignment
- branding setup wizard
- center creation wizard
- invite teacher/volunteer flow

### Module 3: Student Management

Features:
- add student
- edit student
- assign class
- upload photo
- store parent contact
- student profile view
- student attendance history

### Module 4: Class Management

Features:
- create classes
- assign teachers
- assign volunteers
- activate/deactivate classes

### Module 5: Attendance Management

Features:
- choose date
- choose class
- mark present/absent
- save session summary
- view past attendance
- attendance trends

### Module 6: Reports

Features:
- daily attendance summary
- weekly attendance trend
- monthly reports
- class-based performance
- absent student list
- export CSV and Excel

### Module 7: Spotlight / Live Feed

Features:
- choose student spotlight
- capture photo
- display on live screen
- clear spotlight

### Module 8: Follow-Ups

Features:
- absent student follow-up
- birthday follow-up
- new joiner follow-up
- pastoral notes

### Module 9: Announcements and Events

Features:
- create announcements
- publish event notices
- target audience by class or entire church

### Module 10: White-Label Branding

Features:
- tenant logo
- tenant colors
- tenant display name
- tenant-specific welcome content
- future custom domain support

---

## 11. Platform Type

Sundayclass is:

- B2B SaaS for churches
- multi-tenant
- white-label
- mobile + web

---

## 12. Product Architecture Direction

### Current state

- single church app
- shared global collections
- single-brand UI

### Future state

- multi-tenant architecture
- tenant-scoped data
- role-based access
- dynamic branding
- configurable features

---

## 13. Main User Journeys

### Journey 1: Church Admin Onboarding

1. Church admin signs up
2. Church workspace is created
3. Branding and settings are configured
4. Default classes are created
5. Teachers are invited
6. Students are added
7. Attendance process begins

### Journey 2: Teacher Attendance Flow

1. Teacher logs in on mobile
2. Teacher selects church if multiple memberships exist
3. Teacher opens attendance screen
4. Teacher selects date
5. Teacher sees class student list
6. Teacher marks attendance
7. Teacher adds class summary
8. Teacher saves session

### Journey 3: Church Admin Dashboard Flow

1. Admin logs in on website
2. Admin selects active church
3. Admin sees dashboard KPIs
4. Admin views students, attendance, and reports
5. Admin exports data
6. Admin reviews absent students and follow-ups

### Journey 4: Spotlight Flow

1. Teacher chooses student from mobile attendance screen
2. Teacher opens spotlight camera
3. Teacher captures student photo
4. Student appears on live web feed
5. Admin or teacher clears spotlight

---

## 14. Functional Requirements

### 14.1 Authentication

- User can log in with email and password
- System identifies user memberships
- System loads active church automatically
- User can switch church if more than one church is assigned
- User sees only authorized screens and actions

### 14.2 Church Management

- Church admin can view and edit church profile
- Church admin can update branding
- Church admin can update settings such as timezone
- Church admin can enable or disable specific modules

### 14.3 Membership Management

- Church admin can invite users
- Church admin can assign role
- Church admin can assign teachers to classes
- Church admin can disable user access

### 14.4 Student Management

- Add student with name, class, DOB, phone, and photo
- Edit student details
- View student profile
- View student attendance history
- Delete or archive student

### 14.5 Attendance Management

- View class student list
- Mark present or absent
- Store attendance by date and class
- Store session summary
- View historical attendance data

### 14.6 Reports

- Dashboard shows total students
- Dashboard shows present and absent counts
- Dashboard shows attendance percentage
- Reports page filters by date range
- Reports page exports CSV and Excel

### 14.7 Spotlight

- Teacher can set spotlight student
- Live page can display spotlight publicly
- Authenticated users can clear spotlight

### 14.8 White-Label

- UI should load tenant name, logo, and colors dynamically
- Website should support church branding
- Mobile app should support church branding

---

## 15. Non-Functional Requirements

### Performance

- attendance marking must feel instant
- dashboards should load quickly
- queries should stay tenant-scoped

### Security

- no cross-church data leakage
- role-based permissions
- only authorized users can write data

### Scalability

- support many churches in one backend
- support many users per church
- support future branches and parent portal

### Reliability

- attendance saves must be durable
- session data must be recoverable
- important writes should be idempotent where possible

### Usability

- mobile flow must be simple enough for teachers
- dashboard must be clean for admins
- designer should prioritize clarity over complexity

---

## 16. Mobile App Scope

### Primary purpose

Mobile app is the operational tool for teachers and volunteers.

### Core mobile screens

1. Splash / loading
2. Login
3. Church selection
4. Attendance home
5. Student list per class
6. Add student
7. Student profile
8. Spotlight camera
9. Notifications or announcements
10. Settings / profile

### Mobile UX requirements

- large tap targets
- minimal input friction
- fast attendance actions
- easy switch between classes and dates
- offline-resilient future-ready structure

---

## 17. Web Dashboard Scope

### Primary purpose

Web dashboard is for administration, management, and analytics.

### Core web screens

1. Login
2. Church switcher
3. Dashboard
4. Students management
5. Attendance records
6. Reports
7. Live spotlight screen
8. Classes management
9. Users and roles
10. Branding settings
11. Feature settings
12. Church profile settings
13. Follow-up board
14. Announcements and events

### Web UX requirements

- clean management layout
- role-based navigation
- strong data visibility
- easy exports
- obvious church context

---

## 18. Screen Inventory For Design

### Authentication

- Login screen
- Forgot password screen
- Select church screen

### Mobile

- Attendance dashboard
- Mark attendance screen
- Add student screen
- Student detail screen
- Spotlight capture screen
- Mobile profile/settings screen

### Website

- Dashboard
- Students list
- Student detail modal/page
- Attendance records
- Reports and exports
- Live spotlight display
- Classes screen
- Users and roles screen
- Church settings
- Branding settings
- Feature settings
- Follow-up list/board
- Announcements screen
- Events screen

---

## 19. Information Architecture

### Mobile navigation

Recommended:

- Home / Attendance
- Students
- Add
- Announcements
- Profile

### Web navigation

Recommended:

- Dashboard
- Students
- Classes
- Attendance
- Reports
- Follow-Ups
- Announcements
- Events
- Live Feed
- Settings

---

## 20. Data Points To Surface In UI

### Dashboard KPIs

- total students
- present today
- absent today
- attendance percentage
- active classes
- pending follow-ups
- upcoming birthdays
- upcoming events

### Student profile

- photo
- full name
- class
- age / DOB
- parent contact
- attendance trend
- notes

### Church settings

- church name
- logo
- colors
- timezone
- support contact
- enabled features

---

## 21. Design Principles For Figma

The design should feel:

- modern
- calm
- trustworthy
- warm
- church-friendly
- easy for non-technical users

### UI tone

- welcoming
- simple
- clear
- human-centered

### Avoid

- overly corporate feel
- cluttered dashboards
- tiny controls
- generic admin template look

---

## 22. Visual Direction

Suggested visual themes:

- clean light surfaces
- warm neutral backgrounds
- expressive but respectful accent colors
- strong card-based hierarchy
- rounded components
- good typography contrast

### Visual brand personality

- faith-oriented but not overly decorative
- professional enough for admins
- soft enough for teachers and volunteers

---

## 23. White-Label Design Requirements

Every design system must support:

- logo slot
- primary color override
- secondary color override
- accent color override
- church display name
- theme-safe components

Designs should work even when:

- logo is long
- logo is absent
- color is very dark
- color is very bright

---

## 24. Figma Deliverables Needed

Ask the designer or Figma Make to produce:

1. brand foundation
2. component library
3. mobile app wireframes
4. mobile high-fidelity screens
5. web dashboard wireframes
6. web high-fidelity screens
7. responsive layouts
8. church switcher interaction
9. white-label theme examples for at least 2 churches

---

## 25. Suggested Figma Prompt

Use this prompt inside Figma or give it to a designer:

`Design a modern white-label church Sunday school management platform called Sundayclass. It includes a mobile app for teachers to mark attendance and add students, and a web dashboard for church admins to manage students, classes, reports, spotlight feed, branding, and church settings. The platform is multi-tenant, so the design must support church switching, role-based navigation, and white-label branding with dynamic logo and color themes. Create a clean, welcoming, professional interface that feels warm and easy to use for teachers, volunteers, and church admins. Include mobile and web flows for login, church selection, dashboard, attendance, students, reports, live spotlight, and settings.`

---

## 26. Recommended Design Order

Design in this order:

1. branding foundation
2. typography and color system
3. mobile attendance flow
4. web dashboard shell
5. students module
6. reports module
7. settings and branding module
8. follow-ups and announcements

This order will help development start earlier.

---

## 27. MVP Design Scope

If only MVP screens are needed first, design:

- Login
- Church selection
- Mobile attendance
- Add student
- Dashboard
- Students
- Attendance records
- Reports
- Live spotlight
- Settings shell

---

## 28. Future Features For Later Design

- Parent portal
- Push notifications
- Event registration
- Multi-branch support
- Custom domain admin
- Subscription/billing area

---

## 29. Success Criteria

The product design is successful if:

- teachers can mark attendance in under 2 minutes
- church admins can understand church status at a glance
- switching church workspaces is clear and safe
- branding works without redesigning the product per church
- the UI is simple enough for non-technical users

---

## 30. Final Product Statement

Sundayclass is not only an attendance app.
It is a multi-tenant white-label church education management platform.

The design should communicate:

- structure
- trust
- warmth
- clarity
- scalability

This BRD should be used as the foundation for UX, UI, Figma flows, and future implementation.
