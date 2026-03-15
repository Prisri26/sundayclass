'use client';
import Link from 'next/link';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard');
        } catch {
            setError('Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page onboarding-shell">
            <div className="auth-panel">
                <div className="auth-side">
                    <div className="auth-side-badge">Sundayclass</div>
                    <h1 className="auth-side-title">White-label Sunday school platform for churches.</h1>
                    <p className="auth-side-copy">
                        Sign in to manage your church workspace, centers, students, attendance, and reports.
                    </p>
                    <div className="auth-side-points">
                        <div>Multi-tenant church workspaces</div>
                        <div>Center-based Sunday class tracking</div>
                        <div>Church branding and onboarding</div>
                    </div>
                </div>

                <div className="login-card auth-card">
                    <div className="login-brand">
                        <span className="login-brand-icon">✝️</span>
                        <div className="login-brand-title">Sign In</div>
                        <div className="login-brand-sub">Access your church dashboard</div>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="admin@church.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px' }} disabled={loading}>
                            {loading ? <span className="spinner" /> : 'Sign In to Dashboard'}
                        </button>
                    </form>

                    <p className="auth-switch-copy">
                        New church?
                        <Link href="/signup" className="auth-switch-link"> Create your workspace</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
