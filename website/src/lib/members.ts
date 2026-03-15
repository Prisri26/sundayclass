'use client';

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  DocumentData,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Membership } from './tenant';

export type MemberRecord = Membership & {
  id: string;
};

export type UpsertMemberInput = {
  userId: string;
  email?: string;
  displayName?: string;
  role: Membership['role'];
  status: Membership['status'];
  centerIds: string[];
};

function normalizeMember(data: Omit<MemberRecord, 'id'>, id: string): MemberRecord {
  return {
    id,
    ...data,
    centerIds: data.centerIds ?? [],
  };
}

export function subscribeMembers(
  churchId: string,
  cb: (members: MemberRecord[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, `churches/${churchId}/members`), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      cb(snap.docs.map((entry) => normalizeMember(entry.data() as Omit<MemberRecord, 'id'>, entry.id)));
    },
    (error) => onError?.(error as Error)
  );
}

export async function upsertMember(churchId: string, input: UpsertMemberInput) {
  const ref = doc(db, `churches/${churchId}/members`, input.userId.trim());
  await setDoc(ref, {
    userId: input.userId.trim(),
    churchId,
    email: input.email?.trim() || '',
    displayName: input.displayName?.trim() || '',
    role: input.role,
    status: input.status,
    centerIds: input.centerIds,
    updatedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
  }, { merge: true });
}
