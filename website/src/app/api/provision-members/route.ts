import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '../../../lib/firebaseAdmin';

type ProvisioningDoc = {
  churchId: string;
  fullName: string;
  loginId: string;
  temporaryPassword: string;
  role: 'church_admin' | 'teacher' | 'volunteer' | 'viewer';
  centerIds: string[];
  centerNames: string[];
  status: 'pending_provisioning' | 'provisioned' | 'failed';
};

async function verifyChurchAdmin(request: NextRequest, churchId: string) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing authorization token.');
  }

  const idToken = authHeader.slice('Bearer '.length);
  const decoded = await adminAuth.verifyIdToken(idToken);
  const membershipRef = adminDb.doc(`churches/${churchId}/members/${decoded.uid}`);
  const membershipSnap = await membershipRef.get();

  if (!membershipSnap.exists) {
    throw new Error('No church membership found for this account.');
  }

  const membership = membershipSnap.data() as { role?: string; status?: string };
  if (membership.status !== 'active' || membership.role !== 'church_admin') {
    throw new Error('Only active church admins can provision member accounts.');
  }

  return decoded.uid;
}

async function createProvisionedAccount(churchId: string, provisioningId: string, data: ProvisioningDoc) {
  const provisioningRef = adminDb.doc(`churches/${churchId}/provisioningMembers/${provisioningId}`);

  try {
    let authUserId: string;
    try {
      const existingUser = await adminAuth.getUserByEmail(data.loginId);
      authUserId = existingUser.uid;
    } catch {
      const createdUser = await adminAuth.createUser({
        email: data.loginId,
        password: data.temporaryPassword,
        displayName: data.fullName,
        emailVerified: true,
        disabled: false,
      });
      authUserId = createdUser.uid;
    }

    const memberRef = adminDb.doc(`churches/${churchId}/members/${authUserId}`);
    const userRef = adminDb.doc(`users/${authUserId}`);

    await memberRef.set(
      {
        userId: authUserId,
        churchId,
        email: data.loginId,
        loginId: data.loginId,
        displayName: data.fullName,
        role: data.role,
        status: 'active',
        centerIds: data.centerIds,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await userRef.set(
      {
        email: data.loginId,
        displayName: data.fullName,
        defaultChurchId: churchId,
        churchIds: FieldValue.arrayUnion(churchId),
        mustChangePassword: true,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await provisioningRef.set(
      {
        status: 'provisioned',
        authUserId,
        temporaryPassword: FieldValue.delete(),
        provisionedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      id: provisioningId,
      fullName: data.fullName,
      loginId: data.loginId,
      authUserId,
      status: 'provisioned' as const,
    };
  } catch (error: any) {
    await provisioningRef.set(
      {
        status: 'failed',
        failureReason: error?.message || 'Unknown provisioning error',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      id: provisioningId,
      fullName: data.fullName,
      loginId: data.loginId,
      status: 'failed' as const,
      error: error?.message || 'Unknown provisioning error',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const churchId = String(body?.churchId || '').trim();

    if (!churchId) {
      return NextResponse.json({ error: 'churchId is required.' }, { status: 400 });
    }

    await verifyChurchAdmin(request, churchId);

    const provisioningSnapshot = await adminDb
      .collection(`churches/${churchId}/provisioningMembers`)
      .where('status', '==', 'pending_provisioning')
      .get();

    if (provisioningSnapshot.empty) {
      return NextResponse.json({ created: [], failed: [], message: 'No pending provisioning records.' });
    }

    const created: Array<{ id: string; fullName: string; loginId: string; authUserId: string; status: 'provisioned' }> = [];
    const failed: Array<{ id: string; fullName: string; loginId: string; status: 'failed'; error: string }> = [];

    for (const docSnap of provisioningSnapshot.docs) {
      const result = await createProvisionedAccount(churchId, docSnap.id, docSnap.data() as ProvisioningDoc);
      if (result.status === 'provisioned') {
        created.push(result);
      } else {
        failed.push(result);
      }
    }

    return NextResponse.json({ created, failed });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to provision member accounts.' },
      { status: 500 },
    );
  }
}
