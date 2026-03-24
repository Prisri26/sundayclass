export function normalizeAuthIdentifier(value: string) {
  return value.trim().toLowerCase();
}

export function mapFirebaseAuthError(error: any) {
  const code = error?.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid login ID.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid login ID or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact your church admin.';
    default:
      return error?.message || 'Login failed. Please try again.';
  }
}
