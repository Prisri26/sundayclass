'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { createChurchWorkspace, normalizeChurchSlug } from '../../lib/onboarding';

export default function OnboardingPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const defaultTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata', []);
    const [fullName, setFullName] = useState('');
    const [churchName, setChurchName] = useState('');
    const [slug, setSlug] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [timezone, setTimezone] = useState(defaultTimezone);
    const [country, setCountry] = useState('India');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace('/signup');
            return;
        }

        setFullName(user.displayName || '');
        setContactEmail(user.email || '');
    }, [loading, router, user]);

    const handleChurchNameChange = (value: string) => {
        setChurchName(value);
        setSlug((current) => (current ? current : normalizeChurchSlug(value)));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setError('');
        setSubmitting(true);
        try {
            await createChurchWorkspace(user, {
                fullName,
                churchName,
                slug,
                contactEmail,
                contactPhone,
                timezone,
                country,
            });
            router.push(`/onboarding/branding?church=${encodeURIComponent(normalizeChurchSlug(slug || churchName))}`);
        } catch (err: any) {
            setError(err?.message || 'Failed to create church workspace. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="loading-page"><div className="spinner" /></div>;
    }

    return (
        <div className="onboarding-page">
            <div className="onboarding-card">
                <div className="onboarding-hero">
                    <div className="onboarding-step">Step 1 of 3</div>
                    <h1 className="onboarding-title">Create your church workspace</h1>
                    <p className="onboarding-copy">
                        This will be the main white-label workspace for your church. You can set branding, add centers, and invite teachers after this step.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Your Name</label>
                            <input className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Church admin name" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Church Name</label>
                            <input className="form-input" value={churchName} onChange={(e) => handleChurchNameChange(e.target.value)} placeholder="St. Thomas Church" required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Church ID / Slug</label>
                            <input className="form-input" value={slug} onChange={(e) => setSlug(normalizeChurchSlug(e.target.value))} placeholder="st-thomas-church" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact Email</label>
                            <input type="email" className="form-input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="office@church.com" required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Contact Phone</label>
                            <input className="form-input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91 98765 43210" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Country</label>
                            <input className="form-input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Timezone</label>
                        <input className="form-input" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Asia/Kolkata" required />
                    </div>

                    {error && (
                        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                            {error}
                        </div>
                    )}

                    <div className="onboarding-note">
                        After this, we’ll help you set branding, create centers like A1/A2/A3, and invite your team.
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ padding: '14px 20px', fontSize: '15px' }} disabled={submitting}>
                        {submitting ? <span className="spinner" /> : 'Create Church Workspace'}
                    </button>
                </form>
            </div>
        </div>
    );
}
