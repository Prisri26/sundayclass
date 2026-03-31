'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onIdTokenChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth } from '../lib/firebase';
import { db } from '../lib/firebase';

const BYPASS_EMAIL_VERIFICATION =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_BYPASS_EMAIL_VERIFICATION === 'true';

export const ALLOW_UNVERIFIED_ONBOARDING =
    process.env.NEXT_PUBLIC_ALLOW_UNVERIFIED_ONBOARDING === 'true';

export type AuthStatus =
    | 'loading'
    | 'signed_out'
    | 'signed_in_unverified'
    | 'signed_in_password_change_required'
    | 'signed_in_ready';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    initialized: boolean;
    isAuthenticated: boolean;
    isEmailVerified: boolean;
    isFirebaseEmailVerified: boolean;
    mustChangePassword: boolean;
    authStatus: AuthStatus;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    initialized: false,
    isAuthenticated: false,
    isEmailVerified: false,
    isFirebaseEmailVerified: false,
    mustChangePassword: false,
    authStatus: 'loading',
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const [mustChangePassword, setMustChangePassword] = useState(false);
    const [customEmailVerified, setCustomEmailVerified] = useState(false);

    useEffect(() => {
        let unsubscribeProfile: () => void = () => undefined;
        const unsub = onIdTokenChanged(auth, (u) => {
            unsubscribeProfile();
            setUser(u);
            setMustChangePassword(false);
            setCustomEmailVerified(false);
            if (u) {
                unsubscribeProfile = onSnapshot(
                    doc(db, 'users', u.uid),
                    (snap) => {
                        const data = snap.exists() ? snap.data() as {
                          mustChangePassword?: boolean;
                          emailVerification?: { status?: string };
                        } : null;
                        setMustChangePassword(!!data?.mustChangePassword);
                        setCustomEmailVerified(data?.emailVerification?.status === 'verified');
                    },
                    () => {
                      setMustChangePassword(false);
                      setCustomEmailVerified(false);
                    },
                );
            }
            setLoading(false);
            setInitialized(true);
        });
        return () => {
            unsubscribeProfile();
            unsub();
        };
    }, []);

    const isAuthenticated = !!user;
    const isFirebaseEmailVerified = !!user?.emailVerified;
    const isEmailVerified = customEmailVerified || isFirebaseEmailVerified || (!!user && BYPASS_EMAIL_VERIFICATION);
    const authStatus: AuthStatus = loading
        ? 'loading'
        : !user
            ? 'signed_out'
            : isEmailVerified
                ? mustChangePassword
                    ? 'signed_in_password_change_required'
                    : 'signed_in_ready'
                : 'signed_in_unverified';

    return (
        <AuthContext.Provider value={{ user, loading, initialized, isAuthenticated, isEmailVerified, isFirebaseEmailVerified, mustChangePassword, authStatus }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
