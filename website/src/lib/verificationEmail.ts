import 'server-only';

import crypto from 'crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from './firebaseAdmin';

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim() || '';
  const from = process.env.RESEND_FROM_EMAIL?.trim() || 'PrayLoom <onboarding@resend.dev>';
  const replyTo = process.env.RESEND_REPLY_TO?.trim() || process.env.RESEND_FROM_EMAIL?.trim() || '';

  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY. Add it to your server environment before sending verification emails.');
  }

  return { apiKey, from, replyTo };
}

function generateVerificationCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function buildVerificationEmailHtml(params: { fullName?: string | null; code: string }) {
  const { fullName, code } = params;
  const greeting = fullName?.trim() ? `Hello ${fullName.trim()},` : 'Hello,';

  return `
    <div style="margin:0;padding:40px 0;background:#f6f7ff;font-family:Inter,Arial,sans-serif;color:#1d2140;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dfe3fb;border-radius:28px;overflow:hidden;box-shadow:0 24px 80px rgba(57,44,193,0.10);">
        <div style="padding:28px 32px;border-bottom:1px solid #edf0ff;background:linear-gradient(180deg,#ffffff 0%,#f8f9ff 100%);">
          <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;font-weight:700;color:#6f72d6;margin-bottom:12px;">PrayLoom Verification</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:42px;line-height:1.05;font-weight:700;color:#151938;margin:0 0 12px;">Confirm your account.</div>
          <p style="margin:0;font-size:18px;line-height:1.7;color:#5f658a;">Use this six-digit code to continue into your church setup.</p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 18px;font-size:17px;line-height:1.7;color:#3b4166;">${greeting}</p>
          <p style="margin:0 0 24px;font-size:17px;line-height:1.7;color:#3b4166;">
            Enter this verification code in PrayLoom:
          </p>
          <div style="display:inline-block;padding:18px 24px;border-radius:20px;background:#f5f7ff;border:1px solid #dfe6ff;font-size:32px;letter-spacing:0.32em;font-weight:800;color:#20254b;">
            ${code}
          </div>
          <div style="margin-top:28px;padding:18px 20px;background:#f7f8ff;border:1px solid #e4e9ff;border-radius:20px;">
            <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;color:#8d90af;margin-bottom:10px;">Expires soon</div>
            <p style="margin:0;font-size:15px;line-height:1.7;color:#62698f;">This code expires in 20 minutes. If you didn’t request this, you can ignore the email.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildVerificationEmailText(params: { fullName?: string | null; code: string }) {
  const { fullName, code } = params;
  const greeting = fullName?.trim() ? `Hello ${fullName.trim()},` : 'Hello,';
  return `${greeting}

Use this PrayLoom verification code to continue onboarding:

${code}

This code expires in 20 minutes.`;
}

export async function sendVerificationEmailCode(params: {
  uid: string;
  email: string;
  fullName?: string | null;
}) {
  const { uid, email, fullName } = params;
  const { apiKey, from, replyTo } = getResendConfig();
  const code = generateVerificationCode();
  const codeHash = hashCode(code);
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 20 * 60 * 1000));

  await adminDb.doc(`users/${uid}`).set(
    {
      email,
      displayName: fullName?.trim() || '',
      emailVerification: {
        status: 'pending',
        codeHash,
        attempts: 0,
        expiresAt,
        sentAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      reply_to: replyTo ? [replyTo] : undefined,
      subject: 'Your PrayLoom verification code',
      html: buildVerificationEmailHtml({ fullName, code }),
      text: buildVerificationEmailText({ fullName, code }),
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.message || payload?.error?.message || `Resend request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return {
    id: payload?.id || null,
  };
}

export async function verifyVerificationCode(params: { uid: string; code: string }) {
  const userRef = adminDb.doc(`users/${params.uid}`);
  const snap = await userRef.get();
  if (!snap.exists) {
    throw new Error('User profile not found.');
  }

  const data = snap.data() as {
    emailVerification?: {
      status?: string;
      codeHash?: string;
      attempts?: number;
      expiresAt?: Timestamp;
      sentAt?: Timestamp;
    };
  };

  const verification = data.emailVerification;
  if (!verification?.codeHash || !verification?.expiresAt) {
    throw new Error('No active verification code found. Request a new code and try again.');
  }

  if (verification.status === 'verified') {
    return { alreadyVerified: true };
  }

  if (verification.expiresAt.toDate().getTime() < Date.now()) {
    throw new Error('This verification code has expired. Request a new code and try again.');
  }

  const nextAttempts = Number(verification.attempts || 0) + 1;
  if (nextAttempts > 8) {
    throw new Error('Too many invalid attempts. Request a new code and try again.');
  }

  const incomingHash = hashCode(params.code.trim());
  if (incomingHash !== verification.codeHash) {
    await userRef.set(
      {
        emailVerification: {
          ...verification,
          attempts: nextAttempts,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    throw new Error('That code is not valid. Check the email and try again.');
  }

  await userRef.set(
    {
      emailVerification: {
        status: 'verified',
        verifiedAt: FieldValue.serverTimestamp(),
        sentAt: verification.sentAt || FieldValue.serverTimestamp(),
        expiresAt: FieldValue.delete(),
        codeHash: FieldValue.delete(),
        attempts: FieldValue.delete(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { alreadyVerified: false };
}
