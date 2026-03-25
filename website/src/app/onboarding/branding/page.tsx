'use client';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { uploadChurchLogo } from '../../../lib/api';
import { saveBrandingSetup } from '../../../lib/onboarding';
import OnboardingSidebar from '../../../components/onboarding/OnboardingSidebar';

const DEFAULT_PRIMARY = '#392cc1';
const DEFAULT_SECONDARY = '#7c3aed';
const DEFAULT_ACCENT = '#f59e0b';
const BRAND_SWATCHES = ['#392cc1', '#2463eb', '#0f766e', '#b45309', '#be185d', '#4f46e5', '#7c3aed', '#f59e0b'];
const BRAND_PALETTES = [
  { id: 'prayloom-classic', name: 'PrayLoom Classic', primary: '#392cc1', secondary: '#7c3aed', accent: '#f59e0b' },
  { id: 'cathedral-blue', name: 'Cathedral Blue', primary: '#1d4ed8', secondary: '#0f766e', accent: '#f59e0b' },
  { id: 'stone-and-ink', name: 'Stone & Ink', primary: '#1f2937', secondary: '#475569', accent: '#ca8a04' },
  { id: 'warm-ministry', name: 'Warm Ministry', primary: '#7c2d12', secondary: '#9a3412', accent: '#f97316' },
];

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
  const previewInitials = (shortName || churchDisplayName || churchId || 'PL').slice(0, 2).toUpperCase();
  const previewTitle = welcomeTitle || `Welcome to ${churchDisplayName || shortName || 'your church workspace'}`;
  const previewSubtitle =
    welcomeSubtitle || 'Members will see your church identity first, then continue into secure PrayLoom access and Sunday-class operations.';

  const goNext = () => router.push(`/onboarding/centers?church=${encodeURIComponent(churchId)}`);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : '');
  };

  const applyPalette = (palette: (typeof BRAND_PALETTES)[number]) => {
    setPrimaryColor(palette.primary);
    setSecondaryColor(palette.secondary);
    setAccentColor(palette.accent);
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
        <OnboardingSidebar
          progressPercent={60}
          progressCopy="Step 3 of 5: Identity & Branding"
          quote="A church's identity is the visual handshake of its mission."
          contextEyebrow="Brand Direction"
          contextTitle="Shape the workspace before teachers ever log in."
          contextCopy="Logo, color palette, and welcome language should make the church feel recognized the moment someone enters PrayLoom."
          steps={[
            { label: 'Plan Selection', status: 'done' },
            { label: 'Workspace Basics', status: 'done' },
            { label: 'Identity & Branding', status: 'active' },
            { label: 'Center Setup', status: 'upcoming' },
            { label: 'Team Invitation', status: 'upcoming' },
          ]}
        />

        <main className="onboard-main">
          <div className="onboard-scroll-region">
            <div className="onboard-wrap">
              <div className="onboard-step">Step 3 of 5</div>
              <h1 className="onboard-title">Shape your church brand.</h1>
              <p className="onboard-copy">
                Apply your church identity so the workspace feels truly yours. This helps members recognize their digital home.
              </p>

              <div className="onboard-branding-layout">
                <div className="onboard-branding-form">
                  <section className="onboard-branding-section">
                    <h3 className="onboard-branding-section-title">Display Names</h3>
                    <div className="onboard-branding-fields">
                      <div className="onboard-field">
                        <label className="onboard-label">Church Display Name</label>
                        <input className="onboard-input" value={churchDisplayName} onChange={(e) => setChurchDisplayName(e.target.value)} placeholder="Grace Community Church" />
                      </div>
                      <div className="onboard-field">
                        <label className="onboard-label">Short Name</label>
                        <input className="onboard-input" value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="GCC" />
                      </div>
                    </div>
                  </section>

                  <section className="onboard-branding-section">
                    <h3 className="onboard-branding-section-title">Church Logo</h3>
                    <label className="onboard-branding-upload">
                      <div className="onboard-branding-upload-icon">{logoPreview ? null : '+'}</div>
                      <div className="onboard-branding-upload-text">
                        <strong>{logoPreview ? 'Replace your logo' : 'Upload your logo'}</strong>
                        <span>PNG, JPG or SVG. Transparent background preferred.</span>
                      </div>
                      {logoPreview ? <img src={logoPreview} alt="Logo preview" className="onboard-branding-upload-preview" /> : null}
                      <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                    </label>
                  </section>

                  <section className="onboard-branding-section">
                    <h3 className="onboard-branding-section-title">Brand Colors</h3>
                    <div className="onboard-branding-preset-grid">
                      {BRAND_PALETTES.map((palette) => (
                        <button
                          type="button"
                          key={palette.id}
                          className="onboard-branding-preset"
                          onClick={() => applyPalette(palette)}
                        >
                          <div className="onboard-branding-preset-swatches">
                            <span style={{ backgroundColor: palette.primary }} />
                            <span style={{ backgroundColor: palette.secondary }} />
                            <span style={{ backgroundColor: palette.accent }} />
                          </div>
                          <div className="onboard-branding-preset-name">{palette.name}</div>
                        </button>
                      ))}
                    </div>

                    <div className="onboard-branding-color-stack">
                      {colorFields.map((field) => (
                        <div key={field.label} className="onboard-branding-color-row">
                          <label className="onboard-branding-color-dot" style={{ backgroundColor: field.value }}>
                            <input
                              type="color"
                              value={field.value}
                              onChange={(e) => field.setValue(e.target.value)}
                              className="onboard-color-picker-input"
                            />
                          </label>
                          <div className="onboard-branding-color-field">
                            <label className="onboard-label">{field.label} Color</label>
                            <input
                              className="onboard-input onboard-input-mono"
                              value={field.value}
                              onChange={(e) => field.setValue(e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="onboard-color-swatch-row">
                      {BRAND_SWATCHES.map((swatch) => (
                        <button
                          type="button"
                          key={`shared-${swatch}`}
                          className={`onboard-color-swatch${[primaryColor, secondaryColor, accentColor].some((value) => value.toLowerCase() === swatch.toLowerCase()) ? ' active' : ''}`}
                          style={{ background: swatch }}
                          onClick={() => setPrimaryColor(swatch)}
                          aria-label={`Use ${swatch} as primary`}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="onboard-branding-section">
                    <h3 className="onboard-branding-section-title">Welcome Messages</h3>
                    <div className="onboard-branding-fields is-single">
                      <div className="onboard-field">
                        <label className="onboard-label">Welcome Title</label>
                        <input className="onboard-input" value={welcomeTitle} onChange={(e) => setWelcomeTitle(e.target.value)} placeholder="Welcome to our church" />
                      </div>
                      <div className="onboard-field">
                        <label className="onboard-label">Welcome Subtitle</label>
                        <input className="onboard-input" value={welcomeSubtitle} onChange={(e) => setWelcomeSubtitle(e.target.value)} placeholder="Join us in worship and fellowship" />
                      </div>
                    </div>
                  </section>

                  {error ? (
                    <div style={{ background: '#ffdad6', color: '#93000a', padding: '12px 14px', borderRadius: '12px', fontSize: '13px', marginTop: '8px' }}>
                      {error}
                    </div>
                  ) : null}
                </div>

                <aside className="onboard-branding-preview-panel">
                  <h3 className="onboard-branding-section-title">Live Preview</h3>
                  <div className="onboard-branding-preview-shell">
                    <div
                      className="onboard-branding-preview-top"
                      style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
                    >
                      <div className="onboard-branding-preview-glow" style={{ backgroundColor: accentColor }} />
                    </div>

                    <div className="onboard-branding-preview-content">
                      <div className="onboard-branding-preview-logo-frame">
                        <div
                          className="onboard-branding-preview-logo"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo preview" className="onboard-branding-preview-logo-image" />
                          ) : (
                            previewInitials
                          )}
                        </div>
                      </div>

                      <h2 className="onboard-branding-preview-name">{churchDisplayName || 'Your Church Name'}</h2>

                      <div className="onboard-branding-preview-copy-block">
                        <div className="onboard-branding-preview-headline">{previewTitle}</div>
                        <div className="onboard-branding-preview-copy">{previewSubtitle}</div>
                      </div>

                      <button
                        type="button"
                        className="onboard-branding-preview-button"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Get Started
                      </button>

                      <div className="onboard-branding-preview-palette">
                        <div className="onboard-branding-preview-palette-label">Brand Colors</div>
                        <div className="onboard-branding-preview-palette-swatches">
                          <span style={{ backgroundColor: primaryColor }} />
                          <span style={{ backgroundColor: secondaryColor }} />
                          <span style={{ backgroundColor: accentColor }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>

          <div className="onboard-footer-bar">
            <div className="onboard-footer-actions">
              <button type="button" className="onboard-ghost-btn" onClick={() => router.push(`/onboarding?church=${encodeURIComponent(churchId)}`)}>
                Back
              </button>
              <div className="onboard-footer-group">
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
