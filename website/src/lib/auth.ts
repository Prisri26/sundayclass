import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from './firebase';
import { db } from './firebase';

export function normalizeAuthIdentifier(value: string) {
  return value.trim().toLowerCase();
}

export function validateSignupPassword(password: string) {
  if (password.length < 10) {
    return 'Password must be at least 10 characters.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number.';
  }
  return null;
}

export function mapFirebaseAuthError(error: any) {
  const code = error?.code || '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already in use. Sign in or use a different email.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid login ID or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact your church admin.';
    case 'auth/weak-password':
      return 'Please choose a stronger password.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
}

export async function sendVerificationEmailViaServer(user: User) {
  const currentUser = auth.currentUser || user;
  const idToken = await currentUser.getIdToken(true);
  const response = await fetch('/api/send-verification-email', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || 'Unable to send verification email right now.');
  }

  return payload;
}

export async function getUserSecurityState(userId: string) {
  const snap = await getDoc(doc(db, 'users', userId));
  const data = snap.exists() ? snap.data() as { mustChangePassword?: boolean } : null;
  return {
    mustChangePassword: !!data?.mustChangePassword,
  };
}
