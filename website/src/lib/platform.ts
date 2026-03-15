const truthyValues = new Set(['1', 'true', 'yes', 'on']);

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) return defaultValue;
  return truthyValues.has(value.trim().toLowerCase());
}

export const DEFAULT_CHURCH_ID = process.env.NEXT_PUBLIC_DEFAULT_CHURCH_ID?.trim() || '';
export const MULTI_TENANT_ENABLED = parseBoolean(
  process.env.NEXT_PUBLIC_MULTI_TENANT_ENABLED,
  false
);

export type ScopedCollection =
  | 'students'
  | 'members'
  | 'centers'
  | 'parents'
  | 'attendanceSessions'
  | 'attendanceRecords'
  | 'announcements'
  | 'events'
  | 'followUps';

const legacyCollectionMap: Record<ScopedCollection, string> = {
  students: 'students',
  members: 'members',
  centers: 'classes',
  parents: 'parents',
  attendanceSessions: 'class_sessions',
  attendanceRecords: 'attendance',
  announcements: 'announcements',
  events: 'events',
  followUps: 'followUps',
};

export function resolveChurchId(churchId?: string | null): string | null {
  const resolved = churchId?.trim() || DEFAULT_CHURCH_ID;
  return resolved || null;
}

export function isUsingTenantCollections(churchId?: string | null): boolean {
  return MULTI_TENANT_ENABLED && !!resolveChurchId(churchId);
}

export function getCollectionPath(
  collectionName: ScopedCollection,
  churchId?: string | null
): string {
  const resolvedChurchId = resolveChurchId(churchId);
  if (MULTI_TENANT_ENABLED && resolvedChurchId) {
    return `churches/${resolvedChurchId}/${collectionName}`;
  }
  return legacyCollectionMap[collectionName];
}

export function getSpotlightDocPath(churchId?: string | null): string {
  const resolvedChurchId = resolveChurchId(churchId);
  if (MULTI_TENANT_ENABLED && resolvedChurchId) {
    return `churches/${resolvedChurchId}/spotlight/current`;
  }
  return 'spotlight/current';
}

export function getChurchMetadata(churchId?: string | null): { churchId?: string } {
  const resolvedChurchId = resolveChurchId(churchId);
  if (!resolvedChurchId || !MULTI_TENANT_ENABLED) {
    return {};
  }
  return { churchId: resolvedChurchId };
}
