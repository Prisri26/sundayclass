import 'server-only';

import { adminAuth } from './firebaseAdmin';

function getVerificationAppUrl(origin?: string) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || '';
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim() || '';
  const normalizedVercelUrl = vercelUrl ? `https://${vercelUrl.replace(/^https?:\/\//, '')}` : '';
  return envUrl || origin || normalizedVercelUrl || '';
}

async function buildVerificationLink(email: string, origin?: string) {
  const appUrl = getVerificationAppUrl(origin);

  if (appUrl) {
    try {
      return await adminAuth.generateEmailVerificationLink(email, {
        url: `${appUrl}/verify-email/action`,
        handleCodeInApp: true,
      });
    } catch (error: any) {
      const code = error?.code || '';
      if (code !== 'auth/unauthorized-continue-uri' && code !== 'auth/invalid-continue-uri') {
        throw error;
      }
    }
  }

  return adminAuth.generateEmailVerificationLink(email);
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim() || '';
  const from = process.env.RESEND_FROM_EMAIL?.trim() || 'PrayLoom <onboarding@resend.dev>';
  const replyTo = process.env.RESEND_REPLY_TO?.trim() || process.env.RESEND_FROM_EMAIL?.trim() || '';

  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY. Add it to your server environment before sending verification emails.');
  }

  return { apiKey, from, replyTo };
}

function buildVerificationEmailHtml(params: { fullName?: string | null; verificationLink: string; appUrl?: string }) {
  const { fullName, verificationLink, appUrl } = params;
  const greeting = fullName?.trim() ? `Hello ${fullName.trim()},` : 'Hello,';
  const appLabel = appUrl ? appUrl.replace(/^https?:\/\//, '') : 'PrayLoom';

  return `
    <div style="margin:0;padding:40px 0;background:#f6f7ff;font-family:Inter,Arial,sans-serif;color:#1d2140;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dfe3fb;border-radius:28px;overflow:hidden;box-shadow:0 24px 80px rgba(57,44,193,0.10);">
        <div style="padding:28px 32px;border-bottom:1px solid #edf0ff;background:linear-gradient(180deg,#ffffff 0%,#f8f9ff 100%);">
          <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;font-weight:700;color:#6f72d6;margin-bottom:12px;">PrayLoom Verification</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:42px;line-height:1.05;font-weight:700;color:#151938;margin:0 0 12px;">Confirm your account.</div>
          <p style="margin:0;font-size:18px;line-height:1.7;color:#5f658a;">Verify your founding admin email so you can continue into church setup, branding, and member access.</p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 18px;font-size:17px;line-height:1.7;color:#3b4166;">${greeting}</p>
          <p style="margin:0 0 24px;font-size:17px;line-height:1.7;color:#3b4166;">
            Click the button below to verify your email address for <strong>${appLabel}</strong>.
          </p>
          <a href="${verificationLink}" style="display:inline-block;padding:16px 28px;background:linear-gradient(135deg,#3d43d6 0%,#2b88c8 100%);border-radius:18px;color:#ffffff;font-size:17px;font-weight:700;text-decoration:none;box-shadow:0 18px 36px rgba(61,67,214,0.24);">
            Verify email address
          </a>
          <div style="margin-top:28px;padding:18px 20px;background:#f7f8ff;border:1px solid #e4e9ff;border-radius:20px;">
            <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;color:#8d90af;margin-bottom:10px;">Need another way?</div>
            <p style="margin:0;font-size:15px;line-height:1.7;color:#62698f;word-break:break-word;">If the button above does not open, copy and paste this link into your browser:<br /><a href="${verificationLink}" style="color:#3d43d6;">${verificationLink}</a></p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildVerificationEmailText(params: { fullName?: string | null; verificationLink: string }) {
  const { fullName, verificationLink } = params;
  const greeting = fullName?.trim() ? `Hello ${fullName.trim()},` : 'Hello,';
  return `${greeting}

Verify your PrayLoom admin account to continue onboarding your church workspace.

Open this verification link:
${verificationLink}

If you did not request this email, you can ignore it.`;
}

export async function sendVerificationEmail(params: {
  email: string;
  fullName?: string | null;
  origin?: string;
}) {
  const { email, fullName, origin } = params;
  const verificationLink = await buildVerificationLink(email, origin);
  const { apiKey, from, replyTo } = getResendConfig();

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
      subject: 'Verify your PrayLoom admin account',
      html: buildVerificationEmailHtml({ fullName, verificationLink, appUrl: getVerificationAppUrl(origin) }),
      text: buildVerificationEmailText({ fullName, verificationLink }),
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.message || payload?.error?.message || `Resend request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return {
    link: verificationLink,
    id: payload?.id || null,
  };
}
