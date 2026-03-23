'use client';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { uploadChurchLogo } from '../../../lib/api';
import { saveBrandingSetup } from '../../../lib/onboarding';

const DEFAULT_PRIMARY = '#392cc1';
const DEFAULT_SECONDARY = '#7c3aed';
const DEFAULT_ACCENT = '#f59e0b';

type ColorField = {
  label: string;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
};

function BrandingOnboardingContent() {
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

  const colorFields: ColorField[] = [
    { label: 'Primary', value: primaryColor, setValue: setPrimaryColor },
    { label: 'Secondary', value: secondaryColor, setValue: setSecondaryColor },
    { label: 'Accent', value: accentColor, setValue: setAccentColor },
  ];

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
        logoUrl = await uploadChurchLogo(logoFile, churchId);
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
    <div className="onboard-shell">
      <div className="onboard-layout">
        <aside className="onboard-sidebar">
          <div className="onboard-sidebar-content">
            <div className="onboard-brand">PrayLoom</div>
            <div className="onboard-progress-block">
              <div className="onboard-progress-label">Progress</div>
              <div className="onboard-progress-bar">
                <span style={{ width: '50%' }} />
              </div>
              <div className="onboard-progress-copy">Step 2 of 4: Identity &amp; Branding</div>
              <div className="onboard-checklist">
                <div className="onboard-check-item">
                  <div className="onboard-check-icon">✓</div>
                  <span>Workspace Basics</span>
                </div>
                <div className="onboard-check-item active">
                  <div className="onboard-check-icon">2</div>
                  <span>Identity &amp; Branding</span>
                </div>
                <div className="onboard-check-item">
                  <div className="onboard-check-icon">3</div>
                  <span>Center Setup</span>
                </div>
                <div className="onboard-check-item">
                  <div className="onboard-check-icon">4</div>
                  <span>Team Invitation</span>
                </div>
              </div>
            </div>
          </div>
          <div className="onboard-sidebar-footer">
            <div className="onboard-sidebar-quote">
              &ldquo;A church&apos;s identity is the visual handshake of its mission.&rdquo;
            </div>
          </div>
        </aside>

        <main className="onboard-main">
          <div className="onboard-wrap">
            <div className="onboard-step">Step 2 of 4</div>
            <h1 className="onboard-title">Shape your church brand.</h1>
            <p className="onboard-copy">
              Apply your church identity so the workspace feels truly yours. This helps members recognize their digital home.
            </p>

            <div className="onboard-panel">
              <div className="onboard-grid-2">
                <div className="onboard-field">
                  <label className="onboard-label">Church Display Name</label>
                  <input className="onboard-input" value={churchDisplayName} onChange={(e) => setChurchDisplayName(e.target.value)} placeholder="St. Jude's Episcopal Church" />
                </div>
                <div className="onboard-field">
                  <label className="onboard-label">Short Name</label>
                  <input className="onboard-input" value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="St. Judes" />
                </div>
              </div>

              <div style={{ marginTop: 28 }}>
                <div className="onboard-label" style={{ marginBottom: 12 }}>Visual Assets</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                  <label style={{ display: 'inline-grid', gap: 10, cursor: 'pointer' }}>
                    <div style={{ width: 128, height: 128, borderRadius: 16, background: '#f2f3ff', border: '2px dashed rgba(199,196,216,0.5)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 32, color: 'rgba(119,117,135,0.5)' }}>＋</span>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                  </label>
                  <div className="onboard-helper-copy" style={{ maxWidth: 320 }}>
                    Recommended: PNG or SVG with transparent background. Your uploaded logo will be used in the church workspace and future white-label moments.
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 36 }}>
                <div className="onboard-label" style={{ marginBottom: 14 }}>Brand Color Palette</div>
                <div className="onboard-color-grid">
                  {colorFields.map((field) => (
                    <div key={field.label} className="onboard-color-card">
                      <div className="onboard-color-head">
                        <span className="onboard-label" style={{ fontSize: 11 }}>{field.label}</span>
                        <div className="onboard-color-dot" style={{ background: field.value }} />
                      </div>
                      <input
                        className="onboard-input"
                        value={field.value}
                        onChange={(e) => field.setValue(e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 36, background: 'rgba(242, 243, 255, 0.6)', borderRadius: 18, padding: 24 }}>
                <div className="onboard-label" style={{ marginBottom: 14 }}>Workspace Welcome Message</div>
                <div className="onboard-field" style={{ marginBottom: 16 }}>
                  <label className="onboard-label" style={{ fontSize: 11 }}>Welcome Title</label>
                  <input className="onboard-input" value={welcomeTitle} onChange={(e) => setWelcomeTitle(e.target.value)} placeholder="Welcome to the St. Jude's Portal" />
                </div>
                <div className="onboard-field">
                  <label className="onboard-label" style={{ fontSize: 11 }}>Welcome Subtitle</label>
                  <textarea className="onboard-textarea" rows={3} value={welcomeSubtitle} onChange={(e) => setWelcomeSubtitle(e.target.value)} placeholder="Enter a brief greeting for your community members..." />
                </div>
              </div>

              {error ? (
                <div style={{ background: '#ffdad6', color: '#93000a', padding: '12px 14px', borderRadius: '12px', fontSize: '13px', marginTop: '18px' }}>
                  {error}
                </div>
              ) : null}

              <div className="onboard-actions">
                <button type="button" className="onboard-secondary-btn" onClick={() => handleSave(true)}>
                  Skip for now
                </button>
                <button type="button" className="onboard-primary-btn" onClick={() => handleSave(false)} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Branding & Continue'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function BrandingOnboardingPage() {
  return (
    <Suspense fallback={<div className="loading-page"><div className="spinner" /></div>}>
      <BrandingOnboardingContent />
    </Suspense>
  );
}
