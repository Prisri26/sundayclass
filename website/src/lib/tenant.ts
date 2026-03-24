import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { getBootstrapChurchId } from './platform';
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

async function ensureMembershipProfile(
  userId: string,
  churchId: string,
  membership: Membership,
  profile?: UserProfile | null,
) {
  const nextEmail = membership.email || profile?.email || '';
  const nextDisplayName = membership.displayName || profile?.displayName || '';

  if (membership.email === nextEmail && membership.displayName === nextDisplayName) {
    return;
  }

  await setDoc(
    doc(db, `churches/${churchId}/members/${userId}`),
    {
      email: nextEmail,
      displayName: nextDisplayName,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

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

      const profile = await getUserProfile(userId);
      await ensureMembershipProfile(userId, churchId, membership, profile);

      const church = await getChurchSummary(churchId);
      if (!church) return null;

      return { membership, church };
    })
  );

  return results.filter((entry): entry is UserChurchAccess => !!entry);
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

  const bootstrapChurchId = getBootstrapChurchId();
  access = await getAccessForChurchIds(userId, bootstrapChurchId ? [bootstrapChurchId] : []);
  if (access.length > 0) return access;

  return [];
}
