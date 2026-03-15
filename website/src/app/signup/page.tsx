'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && user) {
            router.replace('/onboarding');
        }
    }, [authLoading, router, user]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!fullName.trim()) {
            setError('Please enter your full name.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            await updateProfile(credential.user, { displayName: fullName.trim() });
            router.push('/onboarding');
        } catch (err: any) {
            setError(err?.message || 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page onboarding-shell">
            <div className="auth-panel">
                <div className="auth-side">
                    <div className="auth-side-badge">Church Self-Onboarding</div>
                    <h1 className="auth-side-title">Create your church workspace.</h1>
                    <p className="auth-side-copy">
                        Set up your own branded Sundayclass workspace, add centers, and invite your team.
                    </p>
                    <div className="auth-side-points">
                        <div>Your church manages its own branding</div>
                        <div>Create centers like A1, A2, A3, and Church</div>
                        <div>Invite teachers and start attendance</div>
                    </div>
                </div>

                <div className="login-card auth-card">
                    <div className="login-brand">
                        <span className="login-brand-icon">⛪</span>
                        <div className="login-brand-title">Create Account</div>
                        <div className="login-brand-sub">Start your church workspace</div>
                    </div>

                    <form onSubmit={handleSignup}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Pastor or admin name" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@church.com" required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <input type="password" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" required />
                            </div>
                        </div>

                        {error && (
                            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px' }} disabled={loading}>
                            {loading ? <span className="spinner" /> : 'Continue to Church Setup'}
                        </button>
                    </form>

                    <p className="auth-switch-copy">
                        Already have an account?
                        <Link href="/login" className="auth-switch-link"> Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
