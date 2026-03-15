# Sundayclass UI Improvement Roadmap

## Purpose

This roadmap defines how to improve the Sundayclass user interface in a clean, aligned way across:

- website dashboard
- mobile app
- white-label branding experience

The goal is to move from a functional MVP UI into a modern, elegant, premium product that still feels simple and church-friendly.

## Core UI Goal

Sundayclass should feel like:

- modern
- calm
- premium
- trustworthy
- easy for non-technical church users
- clearly branded for each church

It should not feel like:

- a generic admin template
- a random collection of screens
- a default Firebase CRUD app
- a school ERP

## Design Principles

### 1. Branding should feel native

Church branding should not feel pasted on top of the product.

Each church’s:

- logo
- primary color
- secondary color
- accent color
- welcome text

should flow naturally through both the web and mobile experience.

### 2. Visual hierarchy must be stronger

Every screen should clearly show:

- where the user is
- which church they are in
- which center they are managing
- what action matters most

### 3. Simplicity should remain

This is a church operations platform.

Even when the UI becomes richer, it must stay:

- fast to understand
- easy to use
- low-stress
- accessible to teachers and admins

### 4. Mobile and web should feel related

The website and mobile app do not need to look identical, but they must share:

- color logic
- typography feeling
- spacing rhythm
- component family
- brand behavior

### 5. The system should support white-label scale

The UI must continue to look good when:

- church names are long
- colors vary
- logos are different shapes
- some churches only use church-level class
- some churches use many centers like A1/A2/A3

## Current UI Problems

### Website

- branding is only partially applied
- sidebar and cards still feel template-like
- not enough distinction between platform shell and content
- some screens have strong function but weak polish
- empty states and management flows feel basic

### Mobile

- some screens look improved, but still rely on fixed theme tokens
- branding is not yet applied everywhere
- login, attendance, add-student, and tab bar still need full polish alignment
- some parts still feel like a prototype instead of a finished product

### Product-wide

- center/church context is not prominent enough everywhere
- role-based experience is not visually differentiated
- white-label theming is not yet consistently reflected across modules

## UI Improvement Strategy

We should improve the UI in layers, not screen by screen randomly.

### Layer 1: Design System

Build the shared visual foundation.

### Layer 2: Product Shell

Improve the main structure users see first:

- sidebar
- topbar
- headers
- tabs
- page shells

### Layer 3: Core Workflows

Improve the most-used product flows:

- dashboard
- attendance
- students
- members
- centers

### Layer 4: White-label Experience

Make branding feel deeply integrated.

### Layer 5: Polish

Improve micro-details and emotional quality.

## Phase Plan

## Phase 1: Design System Foundation

### Goal

Create a reusable visual language for both web and mobile.

### Deliverables

- clear color roles
- type scale
- spacing scale
- card system
- button system
- badge/chip system
- form field system
- empty state style
- modal style
- icon usage rules

### Decisions to define

- how primary, secondary, and accent colors are used
- where neutral colors dominate
- how active/selected states look
- how borders and shadows should feel
- how “church”, “center”, “member”, and “role” badges look

### Output

- stable token set for website
- stable token set for mobile
- branding mapping rules

## Phase 2: Website Shell Redesign

### Goal

Make the dashboard feel like a polished white-label SaaS product.

### Priority screens

- sidebar
- topbar
- dashboard page

### Improvements

- branded logo area in sidebar
- stronger active church presentation
- better spacing and grouping
- more elegant cards
- better dashboard hero
- richer but cleaner metrics section

### Success criteria

- church branding is visible immediately
- dashboard feels premium
- layout feels intentional, not generic

## Phase 3: Mobile Shell Redesign

### Goal

Make the mobile app feel fully branded and cohesive.

### Priority screens

- login
- bottom tab bar
- attendance hero
- add student hero

### Improvements

- dynamic church logo in primary areas
- dynamic color palette from branding
- stronger branded headers
- cleaner navigation visuals
- more refined form and card styling

### Success criteria

- user can immediately recognize the church brand
- mobile feels like a real app, not a prototype
- login and attendance look polished

## Phase 4: Core Workflow Polish

### Goal

Improve the highest-value operating flows.

### Website modules

- students
- members
- centers
- attendance
- reports

### Mobile modules

- attendance
- add student
- spotlight

### Improvements

- better lists and cards
- cleaner center chips and filters
- more polished forms
- more readable tables
- better empty states
- better status indicators
- stronger detail views

### Success criteria

- common tasks feel faster and cleaner
- center-based management is easy to understand
- screens feel more consistent

## Phase 5: Full White-Label Polish

### Goal

Make branding feel deeply integrated without hurting usability.

### Improvements

- branding-aware gradients
- dynamic surface accents
- logo handling for different aspect ratios
- better contrast handling for different church colors
- mobile hero and website shell fully respect church colors
- welcome messages and visual identity feel personal to each church

### Success criteria

- church admins feel the product is “theirs”
- branding changes improve the app instead of breaking visuals

## Phase 6: Premium Interaction Polish

### Goal

Make the product feel refined and enjoyable.

### Improvements

- smoother loading states
- better success/error feedback
- improved onboarding visuals
- stronger empty states
- subtle motion where useful
- better hover/press states
- card transitions and section emphasis

### Success criteria

- product feels more premium and alive
- interactions feel responsive and thoughtful

## Priority Order

If we want the most visible progress with the least confusion, use this order:

1. website shell
2. mobile shell
3. website students/members/centers
4. mobile attendance/add student
5. reports and spotlight
6. final polish

## Recommended First UI Pass

### First web pass

- redesign sidebar
- improve dashboard top section
- improve workspace card
- improve stats cards
- improve church branding visibility

### First mobile pass

- make login fully branded
- make attendance hero fully branded
- improve tab bar theme behavior
- improve add-student page styling

## White-Label UI Rules

### Rule 1

Never let raw church colors break readability.

### Rule 2

Use church color as emphasis, not everywhere.

### Rule 3

Logo placement should be consistent and simple.

### Rule 4

The default system should still look elegant even before branding is set.

### Rule 5

A church with no uploaded logo should still have a branded fallback look.

## What We Should Improve Next

The best immediate implementation order is:

1. website sidebar and dashboard visual polish
2. mobile runtime theme polish across major screens
3. website students/members/centers visual consistency
4. mobile attendance interaction polish
5. reports and spotlight refinement

## Working Method

For each UI phase, follow this process:

1. define target outcome
2. improve one shell or flow at a time
3. verify white-label behavior
4. test on both desktop/mobile sizes
5. then move to the next screen group

This will keep the product aligned and prevent the UI from drifting.

## Final Target

Sundayclass should feel like:

- a polished church platform
- a white-label SaaS product
- elegant on both web and mobile
- simple enough for teachers
- strong enough for admins
- consistent enough to scale
