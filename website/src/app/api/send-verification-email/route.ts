import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../../lib/firebaseAdmin';
import { sendVerificationEmail } from '../../../lib/verificationEmail';

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

    const originHeader = request.headers.get('origin') || '';
    const forwardProto = request.headers.get('x-forwarded-proto') || 'https';
    const forwardHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const fallbackOrigin = forwardHost ? `${forwardProto}://${forwardHost}` : '';
    const origin = originHeader || fallbackOrigin;

    const result = await sendVerificationEmail({
      email: decoded.email,
      fullName: decoded.name || null,
      origin,
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unable to send verification email right now.' },
      { status: 500 },
    );
  }
}
