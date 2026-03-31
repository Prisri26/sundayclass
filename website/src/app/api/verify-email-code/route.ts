import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../../lib/firebaseAdmin';
import { verifyVerificationCode } from '../../../lib/verificationEmail';

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length).trim();
}

export async function POST(request: NextRequest) {
  try {
    const idToken = getBearerToken(request);
    if (!idToken) {
      return NextResponse.json({ error: 'Missing authorization token.' }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const body = await request.json();
    const code = String(body?.code || '').trim();
    if (!code) {
      return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
    }

    const result = await verifyVerificationCode({
      uid: decoded.uid,
      code,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unable to verify the code right now.' },
      { status: 400 },
    );
  }
}
