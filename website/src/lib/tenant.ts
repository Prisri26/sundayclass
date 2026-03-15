import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_CHURCH_ID } from './platform';

export interface Membership {
  userId: string;
  churchId: string;
  email?: string;
  displayName?: string;
  role: 'church_admin' | 'teacher' | 'volunteer' | 'viewer';
  status: 'invited' | 'active' | 'disabled';
  centerIds?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ChurchSummary {
  id: string;
  name: string;
  slug?: string;
  plan?: string;
  status?: string;
}

export interface UserChurchAccess {
  membership: Membership;
  church: ChurchSummary;
}

type UserProfile = {
  email?: string;
  displayName?: string;
  defaultChurchId?: string;
  churchIds?: string[];
};

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

async function getChurchSummary(churchId: string): Promise<ChurchSummary | null> {
  const churchSnap = await getDoc(doc(db, 'churches', churchId));
  if (!churchSnap.exists()) return null;
  const data = churchSnap.data() as Omit<ChurchSummary, 'id'>;
  return {
    id: churchSnap.id,
    name: data.name,
    slug: data.slug,
    plan: data.plan,
    status: data.status,
  };
}

async function getAccessForChurchIds(userId: string, churchIds: string[]): Promise<UserChurchAccess[]> {
  const uniqueChurchIds = [...new Set(churchIds.filter(Boolean))];
  if (uniqueChurchIds.length === 0) return [];

  const results = await Promise.all(
    uniqueChurchIds.map(async (churchId) => {
      const membershipSnap = await getDoc(doc(db, `churches/${churchId}/members/${userId}`));
      if (!membershipSnap.exists()) return null;

      const membership = membershipSnap.data() as Membership;
      if (membership.status !== 'active' || membership.churchId !== churchId) {
        return null;
      }

      const church = await getChurchSummary(churchId);
      if (!church) return null;

      return { membership, church };
    })
  );

  return results.filter((entry): entry is UserChurchAccess => !!entry);
}

async function discoverChurchIdsFromMemberships(userId: string): Promise<string[]> {
  const membershipsQuery = query(collectionGroup(db, 'members'), where('userId', '==', userId));
  const snapshot = await getDocs(membershipsQuery);

  return snapshot.docs
    .map((entry) => entry.data() as Membership)
    .filter((membership) => membership.status === 'active' && membership.churchId)
    .map((membership) => membership.churchId);
}

export async function syncUserChurchAccessProfile(
  userId: string,
  access: UserChurchAccess[],
  profile?: { email?: string | null; displayName?: string | null }
) {
  if (access.length === 0) return;

  const churchIds = [...new Set(access.map((entry) => entry.church.id))];
  await setDoc(doc(db, 'users', userId), {
    email: profile?.email || '',
    displayName: profile?.displayName || '',
    defaultChurchId: churchIds[0],
    churchIds,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true });
}

export async function getUserChurchAccess(userId: string): Promise<UserChurchAccess[]> {
  const userProfile = await getUserProfile(userId);
  const profileChurchIds = [
    ...(userProfile?.defaultChurchId ? [userProfile.defaultChurchId] : []),
    ...((userProfile?.churchIds ?? []).filter(Boolean)),
  ];

  let access = await getAccessForChurchIds(userId, profileChurchIds);
  if (access.length > 0) return access;

  const discoveredChurchIds = await discoverChurchIdsFromMemberships(userId);
  access = await getAccessForChurchIds(userId, discoveredChurchIds);
  if (access.length > 0) return access;

  if (DEFAULT_CHURCH_ID) {
    return getAccessForChurchIds(userId, [DEFAULT_CHURCH_ID]);
  }

  return [];
}
