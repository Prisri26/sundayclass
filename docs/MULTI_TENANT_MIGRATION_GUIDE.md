# Multi-Tenant Migration Guide

This guide explains how to seed the first church tenant and migrate the current legacy collections into church-scoped collections.

## What the migration script does

The migration script:

- creates `churches/{churchId}`
- creates church settings documents
- creates `centers` from the unique legacy group names in students
- creates `members` for the user IDs you provide
- copies legacy `students`
- copies legacy `attendance`
- copies legacy `class_sessions`
- copies legacy `spotlight/current`

## Script location

[`/Users/prisri/Documents/Sundayclass/website/scripts/migrate-to-multi-tenant.mjs`](/Users/prisri/Documents/Sundayclass/website/scripts/migrate-to-multi-tenant.mjs)

## Required setup

In [`/Users/prisri/Documents/Sundayclass/website/.env.local`](/Users/prisri/Documents/Sundayclass/website/.env.local), make sure you have:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

You also need a valid Firebase user that is already allowed to read and write the current collections.

## Usage

Run from [`/Users/prisri/Documents/Sundayclass/website`](/Users/prisri/Documents/Sundayclass/website):

```bash
npm run migrate:tenant -- \
  --church-id sundayclass-demo \
  --church-name "Sundayclass Demo Church" \
  --church-slug sundayclass-demo \
  --timezone Asia/Kolkata \
  --admin-email your-admin@email.com \
  --admin-password your-password \
  --member YOUR_USER_UID:church_admin:your-admin@email.com
```

## Dry run

To preview what will be migrated without writing:

```bash
npm run migrate:tenant -- \
  --church-id sundayclass-demo \
  --church-name "Sundayclass Demo Church" \
  --admin-email your-admin@email.com \
  --admin-password your-password \
  --dry-run
```

## Member format

Each `--member` should use:

```text
USER_UID:ROLE[:EMAIL]
```

Examples:

```text
abc123:church_admin:admin@church.com
teacher001:teacher:teacher@church.com
volunteer001:volunteer
```

## After migration

After the script succeeds:

1. verify the new tenant collections exist
2. verify `members` docs are created under the church
3. verify the selected user can sign in and load church access
4. set:

### Website

```env
NEXT_PUBLIC_MULTI_TENANT_ENABLED=true
NEXT_PUBLIC_DEFAULT_CHURCH_ID=sundayclass-demo
```

### Mobile

```env
EXPO_PUBLIC_MULTI_TENANT_ENABLED=true
EXPO_PUBLIC_DEFAULT_CHURCH_ID=sundayclass-demo
```

5. test student list, attendance, reports, and spotlight in tenant mode

## Recommended first migration plan

Use one church first.

Suggested approach:

1. migrate all current legacy data into one initial church
2. verify the app works in tenant mode
3. only then apply the stricter multi-tenant Firestore rules
4. later remove dependency on legacy collections
