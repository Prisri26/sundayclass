# Multi-Tenant Environment Setup

The first implementation phase keeps the current app compatible while adding tenant-aware collection paths.

## Default behavior

If you do nothing, the app stays in legacy single-church mode.

- mobile uses the old top-level collections
- website uses the old top-level collections

This is controlled by:

- `EXPO_PUBLIC_MULTI_TENANT_ENABLED=false`
- `NEXT_PUBLIC_MULTI_TENANT_ENABLED=false`

## When you are ready to switch

After migrating data into church-scoped collections, set:

### Mobile

```env
EXPO_PUBLIC_MULTI_TENANT_ENABLED=true
EXPO_PUBLIC_DEFAULT_CHURCH_ID=your-church-id
```

### Website

```env
NEXT_PUBLIC_MULTI_TENANT_ENABLED=true
NEXT_PUBLIC_DEFAULT_CHURCH_ID=your-church-id
```

## New collection behavior

When multi-tenant mode is enabled, these paths are used:

- `churches/{churchId}/students`
- `churches/{churchId}/attendanceRecords`
- `churches/{churchId}/attendanceSessions`
- `churches/{churchId}/spotlight/current`

When it is disabled, the current legacy paths are used:

- `students`
- `attendance`
- `class_sessions`
- `spotlight/current`

## Recommended rollout

1. Keep both apps in legacy mode
2. Create church and membership data
3. Migrate old records
4. Turn on multi-tenant mode in a test environment
5. Verify reads and writes
6. Then enable it in production
