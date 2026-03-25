import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '../../../lib/firebaseAdmin';

function generateTemporaryPassword(length = 12) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '#';
  for (let index = 0; index < length; index += 1) {
    password += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return password;
}

async function verifyChurchAdmin(request: NextRequest, churchId: string) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing authorization token.');
  }

  const idToken = authHeader.slice('Bearer '.length);
  const decoded = await adminAuth.verifyIdToken(idToken);
  const membershipSnap = await adminDb.doc(`churches/${churchId}/members/${decoded.uid}`).get();

  if (!membershipSnap.exists) {
    throw new Error('No church membership found for this account.');
  }

  const membership = membershipSnap.data() as { role?: string; status?: string };
  if (membership.status !== 'active' || membership.role !== 'church_admin') {
    throw new Error('Only active church admins can reset member passwords.');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const churchId = String(body?.churchId || '').trim();
    const memberUserId = String(body?.memberUserId || '').trim();

    if (!churchId || !memberUserId) {
      return NextResponse.json({ error: 'churchId and memberUserId are required.' }, { status: 400 });
    }

    await verifyChurchAdmin(request, churchId);

    const memberRef = adminDb.doc(`churches/${churchId}/members/${memberUserId}`);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) {
      return NextResponse.json({ error: 'Member record not found.' }, { status: 404 });
    }

    const member = memberSnap.data() as { email?: string; loginId?: string; displayName?: string; role?: string };
    const loginId = String(member.loginId || member.email || '').trim();
    if (!loginId) {
      return NextResponse.json({ error: 'This member does not have a PrayLoom login ID yet.' }, { status: 400 });
    }

    const temporaryPassword = generateTemporaryPassword();

    await adminAuth.updateUser(memberUserId, {
      password: temporaryPassword,
      emailVerified: true,
      disabled: false,
    });

    await adminDb.doc(`users/${memberUserId}`).set(
      {
        mustChangePassword: true,
        passwordResetAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await memberRef.set(
      {
        email: member.email || loginId,
        loginId,
        displayName: member.displayName || '',
        role: member.role || 'teacher',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({
      memberUserId,
      loginId,
      temporaryPassword,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to reset member password.' },
      { status: 500 },
    );
  }
}
