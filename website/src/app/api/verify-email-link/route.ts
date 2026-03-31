import { NextRequest, NextResponse } from 'next/server';
import { verifyVerificationLinkToken } from '../../../lib/verificationEmail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body?.token || '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Verification token is required.' }, { status: 400 });
    }

    const result = await verifyVerificationLinkToken(token);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unable to verify this email link right now.' },
      { status: 400 },
    );
  }
}
