import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type AuthStatus =
  | 'loading'
  | 'signed_out'
  | 'signed_in_unverified'
  | 'signed_in_password_change_required'
  | 'signed_in_ready';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  mustChangePassword: boolean;
  authStatus: AuthStatus;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  initialized: false,
  isAuthenticated: false,
  isEmailVerified: false,
  mustChangePassword: false,
  authStatus: 'loading',
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: () => void = () => undefined;
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      unsubscribeProfile();
      setUser(nextUser);
      setMustChangePassword(false);
      if (nextUser) {
        unsubscribeProfile = onSnapshot(
          doc(db, 'users', nextUser.uid),
          (snap) => {
            const data = snap.exists() ? snap.data() as { mustChangePassword?: boolean } : null;
            setMustChangePassword(!!data?.mustChangePassword);
          },
          () => setMustChangePassword(false),
        );
      }
      setLoading(false);
      setInitialized(true);
    });

    return () => {
      unsubscribeProfile();
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const isAuthenticated = !!user;
    const isEmailVerified = !!user?.emailVerified;
    const authStatus: AuthStatus = loading
      ? 'loading'
      : !user
        ? 'signed_out'
        : user.emailVerified
          ? mustChangePassword
            ? 'signed_in_password_change_required'
            : 'signed_in_ready'
          : 'signed_in_unverified';

    return {
      user,
      loading,
      initialized,
      isAuthenticated,
      isEmailVerified,
      mustChangePassword,
      authStatus,
    };
  }, [initialized, loading, mustChangePassword, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
