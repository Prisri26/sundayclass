import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../../lib/firebaseAdmin';

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
    if (!decoded.email) {
      return NextResponse.json({ error: 'Authenticated user does not have an email address.' }, { status: 400 });
    }

    const link = await adminAuth.generateEmailVerificationLink(decoded.email);
    return NextResponse.json({ link });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unable to generate verification link right now.' },
      { status: 500 },
    );
  }
}
