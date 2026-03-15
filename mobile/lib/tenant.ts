import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  Timestamp,
  QuerySnapshot,
  DocumentData,
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

async function enrichMemberships(snapshot: QuerySnapshot<DocumentData>) {
  const memberships = snapshot.docs
    .map((membershipDoc) => membershipDoc.data() as Membership)
    .filter((membership) => membership.status === 'active' && membership.churchId);

  const uniqueChurchIds = [...new Set(memberships.map((membership) => membership.churchId))];
  const churchEntries = await Promise.all(
    uniqueChurchIds.map(async (churchId) => {
      const churchSnap = await getDoc(doc(db, 'churches', churchId));
      if (!churchSnap.exists()) return null;
      const data = churchSnap.data() as Omit<ChurchSummary, 'id'>;
      const church: ChurchSummary = {
        id: churchSnap.id,
        name: data.name,
        slug: data.slug,
        plan: data.plan,
        status: data.status,
      };
      return church;
    })
  );

  const churchMap = new Map<string, ChurchSummary>();
  churchEntries.forEach((church) => {
    if (church) {
      churchMap.set(church.id, church);
    }
  });

  const access: UserChurchAccess[] = [];
  memberships.forEach((membership) => {
    const church = churchMap.get(membership.churchId);
    if (church) {
      access.push({ membership, church });
    }
  });

  return access;
}

export function subscribeUserChurchAccess(
  userId: string,
  cb: (access: UserChurchAccess[]) => void,
  onError?: (error: Error) => void
) {
  const membershipsQuery = query(collectionGroup(db, 'members'), where('userId', '==', userId));
  return onSnapshot(
    membershipsQuery,
    async (snapshot) => {
      try {
        cb(await enrichMemberships(snapshot));
      } catch (error) {
        onError?.(error as Error);
      }
    },
    (error) => onError?.(error)
  );
}

export async function getUserChurchAccess(userId: string): Promise<UserChurchAccess[]> {
  if (!DEFAULT_CHURCH_ID) return [];

  const membershipSnap = await getDoc(doc(db, `churches/${DEFAULT_CHURCH_ID}/members/${userId}`));
  if (!membershipSnap.exists()) return [];

  const membership = membershipSnap.data() as Membership;
  if (membership.status !== 'active' || membership.churchId !== DEFAULT_CHURCH_ID) {
    return [];
  }

  const churchSnap = await getDoc(doc(db, 'churches', DEFAULT_CHURCH_ID));
  if (!churchSnap.exists()) return [];

  const churchData = churchSnap.data() as Omit<ChurchSummary, 'id'>;
  return [{
    membership,
    church: {
      id: churchSnap.id,
      name: churchData.name,
      slug: churchData.slug,
      plan: churchData.plan,
      status: churchData.status,
    },
  }];
}
