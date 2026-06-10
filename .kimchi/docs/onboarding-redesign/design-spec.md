# PrayLoom — Premium Onboarding Redesign

## Document Information
- **Project**: SundayClass / PrayLoom
- **Scope**: Web onboarding flow redesign
- **Branch**: `design/onboarding-premium`
- **Date**: 2025-06-11
- **Status**: Design Spec (Ready for Implementation)

---

## 1. Design Philosophy

### Core Identity
PrayLoom is a **premium multi-tenant church operations platform**, not a generic SaaS dashboard. The design must feel:

- **Premium** — every pixel considered, generous whitespace, refined typography
- **Mature** — not a startup MVP, but a polished product churches trust
- **Calm** — no visual noise, no harsh contrasts, no aggressive colors
- **Trustworthy** — solid, dependable, clear hierarchy
- **Respectful** — aware that churches are sacred spaces, the platform should feel appropriate

### What We Are NOT
- Not a kids app (no bright primary colors, no cartoonish icons)
- Not a school app (no institutional beige, no bureaucratic forms)
- Not a generic admin template (no sidebar overload, no dashboard widgets)

---

## 2. Visual Direction: Refined Dark Mode

### The Palette

```
Primary Surface:     #0F1117  (Deep charcoal — main backgrounds)
Secondary Surface:   #161821  (Elevated cards, panels)
Tertiary Surface:    #1C1F2A  (Input fields, inner containers)
Border Default:      #2A2D3A  (Subtle dividers)
Border Hover:        #3A3E4F  (Interactive borders)

Primary Text:        #F0EDE6  (Warm cream — headings, primary text)
Secondary Text:      #A09B8C  (Muted cream — labels, captions)
Tertiary Text:       #6B665C  (Dimmed — placeholders, disabled)

Accent:              #D4A24A  (Warm amber — CTAs, active states, highlights)
Accent Hover:        #E8B860  (Lighter amber — hover states)
Accent Muted:        rgba(212, 162, 74, 0.12)  (Subtle amber tint)

Success:             #5E8B6E  (Muted sage green — "present", success)
Danger:              #B85450  (Warm brick red — "absent", errors)
Warning:             #C9963A  (Deep gold — alerts, warnings)
Info:                #6B8FA8  (Steel blue — info states)

Overlay:             rgba(15, 17, 23, 0.75)  (Modal overlays)
Glass:               rgba(28, 31, 42, 0.65)  (Glassmorphism panels)
```

### Contrast Ratios
- Primary text on primary surface: **~16:1** (AAA)
- Secondary text on primary surface: **~7:1** (AAA)
- Accent on primary surface: **~9:1** (AAA)
- All border/text combinations meet WCAG 2.1 AA minimum

---

## 3. Typography System

### Font Stack
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-serif: 'Newsreader', Georgia, 'Times New Roman', serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| Display | 42px | 300 (light) | 1.1 | -0.03em | Hero titles, onboarding step titles |
| H1 | 32px | 400 (regular) | 1.2 | -0.02em | Page headings |
| H2 | 24px | 500 (medium) | 1.3 | -0.01em | Section headings |
| H3 | 18px | 600 (semibold) | 1.4 | 0 | Card titles, form section headers |
| H4 | 15px | 600 (semibold) | 1.4 | 0.01em | Subsection, labels |
| Body Large | 16px | 400 | 1.6 | 0 | Lead paragraphs |
| Body | 14px | 400 | 1.6 | 0 | General text |
| Body Small | 13px | 400 | 1.5 | 0.01em | Descriptions, meta |
| Caption | 12px | 500 | 1.4 | 0.02em | Labels, badges, timestamps |
| Micro | 11px | 600 | 1.3 | 0.04em | Overlines, tags |

### Typography Rules
- **Display/H1**: Use light weight (300/400) for elegance. Never bold.
- **Serif font (Newsreader)**: Reserved exclusively for quotes, testimonials, and the PrayLoom logo wordmark.
- **Uppercase text**: Only for micro labels, eyebrow text, and navigation. Always with positive letter-spacing.
- **Line length**: Maximum 65 characters for body text. Form inputs max width: 480px.

---

## 4. Spacing System

Base unit: **4px**

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Tight internal padding, icon gaps |
| space-2 | 8px | Inline spacing, small gaps |
| space-3 | 12px | Card internal padding |
| space-4 | 16px | Standard padding, form field gaps |
| space-5 | 20px | Section internal padding |
| space-6 | 24px | Panel padding, section gaps |
| space-8 | 32px | Major section spacing |
| space-10 | 40px | Page section breaks |
| space-12 | 48px | Large section breaks |
| space-16 | 64px | Hero spacing |
| space-20 | 80px | Landing page sections |

### Container Widths
- **Onboarding main content**: max-width 640px (centered in available space)
- **Onboarding wide layout**: max-width 780px (for plan selection, branding)
- **Sidebar**: fixed 320px
- **Cards**: min-width 280px, max depends on grid

---

## 5. Shadow & Depth System

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.25);
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.3);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.35);
--shadow-glow: 0 0 24px rgba(212, 162, 74, 0.15);  /* Amber glow for focused elements */
--shadow-inset: inset 0 1px 2px rgba(0, 0, 0, 0.2);
```

### Depth Rules
- Flat elements (text, icons): no shadow
- Interactive elements (buttons): shadow-sm on rest, shadow-md on hover
- Cards: shadow-sm on rest, shadow-md on hover, shadow-glow when active/selected
- Modals/toasts: shadow-xl
- Focus rings: 2px solid accent with 2px offset + shadow-glow

---

## 6. Border Radius System

| Token | Value | Usage |
|-------|-------|-------|
| radius-sm | 6px | Small buttons, tags, badges |
| radius-md | 10px | Inputs, small cards |
| radius-lg | 14px | Cards, panels, modals |
| radius-xl | 20px | Large cards, feature sections |
| radius-full | 9999px | Pills, avatars, circular buttons |

---

## 7. Component Specifications

### 7.1 Buttons

**Primary Button**
```
Background:    Accent (#D4A24A)
Text:          #0F1117 (dark on light for max contrast)
Font:          14px, weight 600, tracking 0.02em
Padding:       12px 24px
Border-radius: radius-md (10px)
Shadow:        shadow-sm
Hover:         Background → Accent Hover (#E8B860), shadow-md
Active:        Scale 0.98, shadow-inset
Disabled:      Opacity 0.4, cursor not-allowed
Transition:    all 200ms cubic-bezier(0.4, 0, 0.2, 1)
```

**Secondary Button**
```
Background:    transparent
Border:        1px solid Border Hover (#3A3E4F)
Text:          Primary Text (#F0EDE6)
Font:          14px, weight 600
Padding:       12px 24px
Border-radius: radius-md
Hover:         Background → Tertiary Surface (#1C1F2A), border → Accent
Active:        Scale 0.98
```

**Ghost Button**
```
Background:    transparent
Text:          Secondary Text (#A09B8C)
Font:          14px, weight 500
Padding:       12px 24px
Hover:         Text → Primary Text, background → rgba(255,255,255,0.03)
```

### 7.2 Inputs

**Text Input**
```
Background:    Tertiary Surface (#1C1F2A)
Border:        1px solid Border Default (#2A2D3A)
Text:          Primary Text (#F0EDE6)
Placeholder:   Tertiary Text (#6B665C)
Font:          14px, weight 400
Padding:       12px 16px
Border-radius: radius-md (10px)
Height:        48px

Focus:         Border → Accent (#D4A24A), shadow-glow
Hover:         Border → Border Hover (#3A3E4F)
Error:         Border → Danger (#B85450), subtle danger glow
```

**Label**
```
Font:          Caption (12px, weight 500)
Color:         Secondary Text (#A09B8C)
Margin-bottom: space-2 (8px)
Text-transform: none (preserve case)
```

**Helper Text**
```
Font:          Body Small (13px)
Color:         Tertiary Text (#6B665C)
Margin-top:    space-2 (8px)
```

### 7.3 Cards

**Standard Card**
```
Background:    Secondary Surface (#161821)
Border:        1px solid Border Default (#2A2D3A)
Border-radius: radius-lg (14px)
Padding:       space-6 (24px)
Shadow:        shadow-sm
Hover:         Border → Border Hover, shadow-md
Transition:    all 200ms ease
```

**Selected Card**
```
Border:        2px solid Accent (#D4A24A)
Shadow:        shadow-glow
Background:    Accent Muted overlay
```

**Interactive Card** (plan selection, etc.)
```
Same as Standard Card
Plus: cursor pointer
Hover: translateY(-2px), shadow-md
Active: translateY(0), scale 0.995
```

### 7.4 Sidebar (Onboarding)

```
Width:            320px (fixed)
Background:       Primary Surface (#0F1117)
Border-right:     1px solid Border Default (#2A2D3A)
Padding:          space-6 (24px)

Logo area:        margin-bottom space-8 (32px)
Progress bar:     height 3px, background Tertiary Surface, fill Accent
                  border-radius: 2px
Step indicators:  Circle 32px with border
                  Done: Accent background, dark checkmark
                  Active: Accent border (2px), filled center dot
                  Upcoming: Border Default border, no fill
Step labels:      Caption style, Primary Text
                  Active: Accent color
Step captions:    Micro style, Tertiary Text

Context card:     Secondary Surface background, radius-lg
                  Appears below progress, above quote
Quote:            Serif font (Newsreader), italic
                  Secondary Text color, 16px, light weight
                  Border-top: 1px solid Border Default
                  Padding-top: space-6
```

### 7.5 Footer Bar (Onboarding)

```
Position:         sticky bottom
Background:       Primary Surface with 80% opacity + backdrop-blur(12px)
Border-top:       1px solid Border Default
Padding:          space-5 (20px) space-6 (24px)
Height:           ~72px

Actions:          Back (Ghost) | [Skip (Secondary)] | Continue (Primary)
                  Right-aligned primary action
                  Gap between actions: space-3 (12px)
```

---

## 8. Onboarding Flow Redesign

### 8.1 Global Onboarding Shell

**Layout**
```
┌─────────────────────────────────────────────────────────┐
│  Sidebar (320px)    │  Main Content Area (flex: 1)     │
│                     │                                    │
│  [PrayLoom Logo]    │  ┌─────────────────────────────┐ │
│                     │  │  Step X of 5                │ │
│  Progress Bar       │  │  Title (Display)            │ │
│                     │  │  Description (Body Large)   │ │
│  ●───●───○───○───○  │  │                             │ │
│  Step labels        │  │  [Content Area]             │ │
│                     │  │                             │ │
│  [Context Card]     │  │                             │ │
│                     │  └─────────────────────────────┘ │
│  ─────────────────  │                                    │
│  "Quote text..."    │  ┌─────────────────────────────┐ │
│                     │  │  [Back]         [Continue]  │ │
│                     │  └─────────────────────────────┘ │
└─────────────────────┴────────────────────────────────────┘
```

**Behaviors**
- Sidebar is fixed, main content scrolls independently
- Footer bar sticks to bottom of viewport with glassmorphism
- Transitions between steps: fade + slight slide (300ms, ease-out)
- Scroll position resets to top on step change

### 8.2 Step 1: Plan Selection

**Title**: "Choose a foundation for your ministry"
**Description**: "Start with what fits today. Every plan includes full platform access — only the scale changes."

**Layout**
- Single column, centered, max-width 780px
- Intro card at top (context + reassurance)
- Plan cards in horizontal row (3 cards)
- Note/trial disclaimer below cards

**Plan Card Design**
```
Width:          ~240px each
Height:         auto, minimum 360px
Layout:         Vertical stack

Top section:    Accent top border (3px) or subtle gradient
                Plan name (H3)
                Price (Display size, accent color for price)
                "per month" label (Caption)

Divider:        1px Border Default

Features list:  Checkmark + feature text
                Checkmark: Accent color, 16px
                Feature text: Body Small, Secondary Text
                Gap between items: space-3 (12px)

Footer:         "Selected" badge (when active) or CTA
                Badge: Accent background, dark text, pill shape
```

**Hover/Active States**
- Hover: Card lifts (translateY -2px), shadow-md, border → Border Hover
- Active/Selected: Border → 2px Accent, shadow-glow, slight amber tint on background

### 8.3 Step 2: Workspace Basics

**Title**: "Create your church workspace"
**Description**: "This becomes your church's home on PrayLoom. Members will see this identity first."

**Layout**
- Form sections separated by visual dividers
- Each section has a H3 heading + optional description
- Two-column grid for paired fields (church name + slug)
- Full-width for single fields (contact email)

**Form Sections**
```
1. Church Identity
   - Church Name (required)
   - Church Slug (required, auto-generated from name,
     editable, suffix .prayloom shown inline)

2. Contact Information
   - Your Name (required)
   - Contact Email (required, pre-filled from auth)
   - Contact Phone (optional)

3. Location
   - Country (dropdown/search)
   - Timezone (dropdown, auto-detected)
```

**Slug Input**
```
| grace-community  | .prayloom |
| [input field     ] | [suffix  ] |
```
Suffix styled as non-interactive, muted text attached to input.

### 8.4 Step 3: Identity & Branding ⭐

**This is the MOST IMPORTANT screen.** It's where the white-label magic happens.

**Title**: "Make it unmistakably yours"
**Description**: "Your church's visual identity shapes how every member and volunteer experiences PrayLoom."

**Layout: Two-Column Split**
```
┌──────────────────────────────┬──────────────────────────────┐
│  Form Column (55%)           │  Live Preview Column (45%)   │
│                              │                              │
│  [Display Names]             │  ┌────────────────────────┐  │
│  Church Display Name         │  │  [Gradient Header]     │  │
│  Short Name                  │  │  [Church Logo]         │  │
│                              │  │  Welcome Title         │  │
│  [Church Logo]               │  │  Welcome Subtitle      │  │
│  Upload area                 │  │  [Get Started Button]  │  │
│                              │  │                          │  │
│  [Brand Colors]              │  │  Brand Colors Swatches │  │
│  Preset palettes             │  │                          │  │
│  Custom color pickers        │  └────────────────────────┘  │
│                              │                              │
│  [Welcome Messages]          │  Preview updates LIVE as     │
│  Title + Subtitle            │  user types or selects       │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
```

**Live Preview**
- Shows EXACTLY what the church's login/welcome screen will look like
- Uses real-time values: logo, colors, text
- Background: gradient using primary + secondary colors
- Button: primary color
- Text: readable against the gradient (auto-calculating light/dark text)
- Preview card has subtle shadow and border to feel realistic

**Color Pickers**
```
- Primary: Main brand color (buttons, key elements)
- Secondary: Supporting color (gradients, accents)
- Accent: Highlight color (gold/amber default, can change)

Each picker shows:
  - Color dot (clickable, opens native color picker)
  - Hex input field
  - Preset swatches row below
```

**Preset Palettes**
```
1. PrayLoom Classic   → Deep Indigo + Purple + Amber
2. Cathedral Blue     → Royal Blue + Teal + Gold
3. Stone & Ink        → Charcoal + Slate + Deep Gold
4. Warm Ministry      → Terracotta + Burnt Orange + Bright Orange
5. Sacred Garden      → Deep Green + Forest + Sage
```

### 8.5 Step 4: Center Setup

**Title**: "Set up your ministry centers"
**Description**: "Centers are where Sunday classes happen — your main church or local gathering points."

**Layout**
- Top section: Add new center form (inline, compact)
- Below: List of created centers (cards)

**Add Center Form**
```
Inline row: [Name*] [Code*] [Host Name] [Host Phone] [Area] [Address] [+ Add]
All fields optional except Name + Code.
```

**Center Card (Draft)**
```
┌─────────────────────────────────────────┐
│  🏢 Main Church                        │
│  Code: MAIN    Host: Pastor John        │
│  📍 123 Church Street, Downtown Area    │
│                               [Remove ✕]│
└─────────────────────────────────────────┘
```

**States**
- Draft center: Secondary Surface, shows "Not saved yet" micro label
- On save: Card transitions to standard state, toast confirmation

**Empty State**
- Center illustration or icon
- "Start by adding your first center"
- One-click add with common defaults ("Main Church", code "MAIN")

### 8.6 Step 5: Team Invitation

**Title**: "Invite your team"
**Description**: "Add teachers and volunteers who will take attendance and manage classes."

**Layout**
- Two-column: Form left, member list right

**Add Member Form**
```
Full Name*    [input]
Role*         [dropdown: Church Admin / Teacher / Volunteer / Viewer]
Centers       [multi-select: All Centers / Center 1 / Center 2 ...]
              Teachers/Volunteers get center assignment
              Church Admins auto-assign to all centers

[Add to List] button
```

**Member List**
- Cards showing: Name, Role badge, Assigned centers
- Role badges color-coded:
  - Church Admin: Danger/Brick color
  - Teacher: Accent/Amber
  - Volunteer: Success/Sage
  - Viewer: Info/Steel
- Actions per member: Edit, Remove
- Bulk: "Invite All" primary CTA

**Role Explanations**
```
Church Admin: Full access to everything
Teacher: Can take attendance and view reports for assigned centers
Volunteer: Can take attendance for assigned centers
Viewer: Can view but not edit
```

### 8.7 Completion Page

**Title**: "Your ministry workspace is ready"
**Description**: Custom welcome message from branding step, or default.

**Layout: Centered Celebration**
```
[Church Logo] — large, centered

"Grace Community Church"
is now live on PrayLoom

Church Code:   GCC-2025   [Copy button]
Share this code with your team

[Go to Dashboard]  [Add More Members]
```

**Elements**
- Confetti or subtle sparkle animation (respectful, not party-like)
- Church code prominently displayed with copy-to-clipboard
- Clear CTAs: Dashboard (primary), Add Members (secondary)
- "Powered by PrayLoom" — small, bottom, unobtrusive

---

## 9. Animation & Motion

### Page Transitions
```css
/* Between onboarding steps */
.onboarding-enter {
  opacity: 0;
  transform: translateX(12px);
}
.onboarding-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 300ms ease-out, transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
.onboarding-exit {
  opacity: 1;
  transform: translateX(0);
}
.onboarding-exit-active {
  opacity: 0;
  transform: translateX(-12px);
  transition: opacity 200ms ease-in, transform 200ms ease-in;
}
```

### Micro-interactions

**Button Hover**
```
Duration: 200ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)
Properties: background-color, box-shadow, transform
Transform: none on rest, translateY(-1px) on hover
```

**Card Hover**
```
Duration: 200ms
Easing: ease-out
Transform: translateY(-2px)
Shadow: shadow-sm → shadow-md
Border: subtle lightening
```

**Input Focus**
```
Duration: 150ms
Border: Border Default → Accent
Shadow: none → shadow-glow
Outline: none (use shadow for focus indication)
```

**Toast Notifications**
```
Enter: slide from bottom + fade (300ms)
Exit: fade + slide down (200ms)
Auto-dismiss: 4000ms
Position: bottom-center, 24px from edge
```

**Progress Bar Animation**
```
Width transition: 400ms cubic-bezier(0.4, 0, 0.2, 1)
```

**Live Preview Updates**
```
Color changes: 200ms transition on background, border, text
Text changes: 150ms fade on change
Logo upload: 300ms scale-in animation
```

---

## 10. Responsive Behavior

### Desktop (>= 1024px)
- Full sidebar + main content layout
- Two-column forms where appropriate
- Plan cards in horizontal row
- All features available

### Tablet (768px - 1023px)
- Sidebar collapses to icon-only (64px wide)
- Hover to expand to full
- Single column forms
- Plan cards in 2-col grid
- Preview panel stacks below form

### Mobile (< 768px)
- Sidebar becomes top progress bar (thin)
- Hamburger for step navigation
- Single column everything
- Plan cards stack vertically
- Footer actions stack or become sticky bottom bar
- Full-width cards and inputs

---

## 11. White-Label Strategy

### What PrayLoom Controls (Base)
- Overall UI layout and structure
- Dark theme surfaces and typography
- Interaction patterns and animations
- "Powered by PrayLoom" attribution (subtle, bottom)

### What Each Church Controls
- **Logo**: Replaces PrayLoom logo in header, login, emails
- **Display Name**: Replaces "PrayLoom" in headings, browser tab, emails
- **Primary Color**: Tints buttons, active states, key CTAs
- **Secondary Color**: Gradients, secondary accents
- **Accent Color**: Highlights, badges, selected states
- **Welcome Message**: Custom title + subtitle on login page
- **Church Code**: Unique invite code for members

### Attribution Placement
```
- Login page: tiny footer text "Powered by PrayLoom"
- Dashboard: none
- Settings page: small "About" section mentions PrayLoom
- Emails: "Sent via PrayLoom" in footer
- PDF reports: tiny footer watermark
```

---

## 12. Accessibility Requirements

### Color Contrast
- All text on surfaces meets WCAG 2.1 AA (4.5:1 minimum)
- Large text (18px+) meets AA (3:1 minimum)
- Interactive elements have visible focus indicators

### Keyboard Navigation
- All interactive elements reachable via Tab
- Focus ring clearly visible (Accent color, 2px)
- Enter/Space activates buttons and links
- Escape closes modals and dropdowns

### Screen Readers
- All form inputs have associated labels
- Status messages announced via aria-live
- Progress steps announced: "Step 2 of 5, Workspace Basics"
- Errors linked to inputs via aria-describedby

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 13. Asset Requirements

### Logo
- **PrayLoom logo**: Dark-mode compatible SVG (white/cream version)
- **Church logo placeholder**: Generic church icon in Tertiary Surface circle
- **App icon**: 512x512 PNG for PWA, iOS, Android

### Icons
Use a consistent icon set. Phosphor Icons or Heroicons (outline style recommended for premium feel). All icons stroke width: 1.5px.

Key icons needed for onboarding:
- Plan/price tag
- Church/building
- User/person
- Palette/colors
- Map pin
- Users/group
- Checkmark
- Arrow right
- Copy
- Upload
- Trash/remove
- Edit

---

## 14. Implementation Order

### Phase 1: Design System Foundation
1. Update `globals.css` with new dark mode variables
2. Create onboarding-specific CSS module or extend globals
3. Update tailwind config (if using utility classes)
4. Verify all contrast ratios pass WCAG

### Phase 2: Shell Redesign
1. Update `OnboardingSidebar` component
2. Create new footer bar component
3. Update layout wrapper (`onboard-shell`, `onboard-layout`)
4. Add page transition wrapper

### Phase 3: Screen-by-Screen
1. Plan Selection (`/onboarding/plan`)
2. Workspace Basics (`/onboarding`)
3. Identity & Branding (`/onboarding/branding`) — MOST ATTENTION
4. Center Setup (`/onboarding/centers`)
5. Team Invitation (`/onboarding/members`)
6. Completion (`/onboarding/completion`)

### Phase 4: Polish
1. Animations and transitions
2. Responsive breakpoints
3. Accessibility audit
4. Performance optimization (will-change, lazy loading)
5. Cross-browser testing

---

## Appendix: Comparison — Old vs New

| Element | Old Design | New Design |
|---------|-----------|------------|
| Theme | Light purple/indigo | Dark charcoal + amber |
| Background | White with purple gradients | Deep charcoal (#0F1117) |
| Primary Action | Purple button (#4F46E5) | Amber button (#D4A24A) on dark |
| Cards | White with subtle shadow | Dark surface (#161821) with subtle border |
| Typography | Inter only, heavier weights | Inter + Newsreader, lighter weights |
| Progress | Simple bar + numbered circles | Elegant bar + refined step indicators |
| Onboarding feel | SaaS template | Premium, calm, ministry-appropriate |
| Live preview | Basic gradient preview | Realistic login screen simulation |

---

*End of Design Specification*
