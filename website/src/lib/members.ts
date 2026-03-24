'use client';

import {
  arrayUnion,
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

export type ProvisioningMemberRecord = {
  id: string;
  churchId: string;
  fullName: string;
  loginId: string;
  temporaryPassword?: string;
  role: Membership['role'];
  centerIds: string[];
  centerNames: string[];
  status: 'pending_provisioning' | 'provisioned' | 'failed';
  authUserId?: string;
  failureReason?: string;
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

function normalizeProvisioningMember(
  data: Omit<ProvisioningMemberRecord, 'id'>,
  id: string,
): ProvisioningMemberRecord {
  return {
    id,
    ...data,
    centerIds: data.centerIds ?? [],
    centerNames: data.centerNames ?? [],
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
  const userId = input.userId.trim();
  const ref = doc(db, `churches/${churchId}/members`, userId);
  const userRef = doc(db, 'users', userId);

  await setDoc(ref, {
    userId,
    churchId,
    email: input.email?.trim() || '',
    displayName: input.displayName?.trim() || '',
    role: input.role,
    status: input.status,
    centerIds: input.centerIds,
    updatedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
  }, { merge: true });

  await setDoc(userRef, {
    email: input.email?.trim() || '',
    displayName: input.displayName?.trim() || '',
    defaultChurchId: churchId,
    churchIds: arrayUnion(churchId),
    updatedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
  }, { merge: true });
}

export function subscribeProvisioningMembers(
  churchId: string,
  cb: (members: ProvisioningMemberRecord[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(collection(db, `churches/${churchId}/provisioningMembers`), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      cb(snap.docs.map((entry) => normalizeProvisioningMember(entry.data() as Omit<ProvisioningMemberRecord, 'id'>, entry.id)));
    },
    (error) => onError?.(error as Error),
  );
}
