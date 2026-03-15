'use client';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { uploadToCloudinary } from '../../../lib/api';
import { saveBrandingSetup } from '../../../lib/onboarding';

const DEFAULT_PRIMARY = '#4F46E5';
const DEFAULT_SECONDARY = '#3730A3';
const DEFAULT_ACCENT = '#10B981';

export default function BrandingOnboardingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const churchId = searchParams.get('church') || '';
    const [churchDisplayName, setChurchDisplayName] = useState('');
    const [shortName, setShortName] = useState('');
    const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
    const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY);
    const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
    const [welcomeTitle, setWelcomeTitle] = useState('');
    const [welcomeSubtitle, setWelcomeSubtitle] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const canSubmit = useMemo(() => churchId.trim().length > 0, [churchId]);

    const goNext = () => router.push(`/onboarding/centers?church=${encodeURIComponent(churchId)}`);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setLogoFile(file);
        setLogoPreview(file ? URL.createObjectURL(file) : '');
    };

    const handleSave = async (skip = false) => {
        if (!canSubmit) {
            setError('Missing church workspace reference. Please restart onboarding.');
            return;
        }

        if (skip) {
            goNext();
            return;
        }

        setSaving(true);
        setError('');
        try {
            let logoUrl = '';
            if (logoFile) {
                logoUrl = await uploadToCloudinary(logoFile);
            }

            await saveBrandingSetup(churchId, {
                churchDisplayName: churchDisplayName.trim() || shortName.trim() || churchId,
                shortName,
                logoUrl,
                primaryColor,
                secondaryColor,
                accentColor,
                welcomeTitle,
                welcomeSubtitle,
            });

            goNext();
        } catch (err: any) {
            setError(err?.message || 'Failed to save branding. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="onboarding-page">
            <div className="onboarding-card">
                <div className="onboarding-hero">
                    <div className="onboarding-step">Step 2 of 3</div>
                    <h1 className="onboarding-title">Set your church branding</h1>
                    <p className="onboarding-copy">
                        Add your church name, colors, and logo. This step is optional for now and can be updated later.
                    </p>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Church Display Name</label>
                        <input className="form-input" value={churchDisplayName} onChange={(e) => setChurchDisplayName(e.target.value)} placeholder="Hosanna Tower" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Short Name</label>
                        <input className="form-input" value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="Hosanna" />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Church Logo</label>
                    <input type="file" accept="image/*" className="form-input" onChange={handleLogoChange} />
                    {logoPreview && (
                        <div style={{ marginTop: 12 }}>
                            <img src={logoPreview} alt="Logo preview" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 18, border: '1px solid var(--border)' }} />
                        </div>
                    )}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Primary Color</label>
                        <input type="color" className="form-input" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Secondary Color</label>
                        <input type="color" className="form-input" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Accent Color</label>
                        <input type="color" className="form-input" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Welcome Title</label>
                        <input className="form-input" value={welcomeTitle} onChange={(e) => setWelcomeTitle(e.target.value)} placeholder="Welcome to Hosanna Tower" />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Welcome Subtitle</label>
                    <input className="form-input" value={welcomeSubtitle} onChange={(e) => setWelcomeSubtitle(e.target.value)} placeholder="Manage centers, students, and attendance with confidence." />
                </div>

                <div className="onboarding-note">
                    Logo upload uses Cloudinary and your chosen colors will later be used across web and mobile.
                </div>

                {error && (
                    <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => handleSave(true)}>
                        Skip for now
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => handleSave(false)} disabled={saving}>
                        {saving ? <span className="spinner" /> : 'Save Branding & Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
}
