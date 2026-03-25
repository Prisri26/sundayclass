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

              <div className="onboard-info-strip">
                <div className="onboard-info-strip-item">
                  <span className="onboard-info-strip-label">Visible across the product</span>
                  <strong>Brand choices flow into web workspace screens first, then into the mobile church-code login experience.</strong>
                </div>
                <div className="onboard-info-strip-item">
                  <span className="onboard-info-strip-label">Keep it restrained</span>
                  <strong>The strongest church workspaces feel branded, calm, and recognizable without looking busy or playful.</strong>
                </div>
              </div>

              <div className="onboard-panel">
                <div className="onboard-panel-intro">
                  <div className="onboard-panel-intro-title">Identity and visual language</div>
                  <div className="onboard-panel-intro-copy">
                    Give your church workspace a recognizable presence with logo, color palette, and welcome messaging before teachers and members begin using PrayLoom.
                  </div>
                </div>

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

                <div className="onboard-brand-builder">
                  <div className="onboard-brand-builder-main">
                    <div className="onboard-label" style={{ marginBottom: 12 }}>Visual Assets</div>
                    <div className="onboard-brand-upload-row">
                      <label className="onboard-brand-upload">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo preview" className="onboard-brand-upload-preview" />
                        ) : (
                          <div className="onboard-brand-upload-empty">
                            <span>+</span>
                            <strong>Add logo</strong>
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                      </label>
                      <div className="onboard-brand-upload-copy">
                        <div className="onboard-helper-title">Upload a logo your members will recognize instantly.</div>
                        <div className="onboard-helper-copy">
                          Recommended: PNG or SVG with transparent background. Your uploaded logo will appear across web workspace surfaces and the mobile church-code login flow.
                        </div>
                        <div className="onboard-brand-upload-notes">
                          <span>Transparent background preferred</span>
                          <span>Square logos work best</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="onboard-brand-builder-side">
                    <div className="onboard-label" style={{ marginBottom: 12 }}>Quick Palette Direction</div>
                    <div className="onboard-palette-grid">
                      {BRAND_PALETTES.map((palette) => (
                        <button
                          type="button"
                          key={palette.id}
                          className="onboard-palette-card"
                          onClick={() => applyPalette(palette)}
                        >
                          <div className="onboard-palette-card-swatches">
                            <span style={{ background: palette.primary }} />
                            <span style={{ background: palette.secondary }} />
                            <span style={{ background: palette.accent }} />
                          </div>
                          <div className="onboard-palette-card-name">{palette.name}</div>
                        </button>
                      ))}
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
                          <label className="onboard-color-picker-button" style={{ background: field.value }}>
                            <input
                              type="color"
                              value={field.value}
                              onChange={(e) => field.setValue(e.target.value)}
                              className="onboard-color-picker-input"
                            />
                          </label>
                        </div>
                        <input
                          className="onboard-input"
                          value={field.value}
                          onChange={(e) => field.setValue(e.target.value)}
                        />
                        <div className="onboard-color-swatch-row">
                          {BRAND_SWATCHES.map((swatch) => (
                            <button
                              type="button"
                              key={`${field.label}-${swatch}`}
                              className={`onboard-color-swatch${field.value.toLowerCase() === swatch.toLowerCase() ? ' active' : ''}`}
                              style={{ background: swatch }}
                              onClick={() => field.setValue(swatch)}
                              aria-label={`${field.label} ${swatch}`}
                            />
                          ))}
                        </div>
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

                <div className="onboard-brand-preview">
                  <div className="onboard-brand-preview-header">
                    <div>
                      <div className="onboard-context-eyebrow">Live Preview</div>
                      <div className="onboard-brand-preview-title">{churchDisplayName || shortName || churchId || 'Your church workspace'}</div>
                    </div>
                    <div className="onboard-brand-preview-palette">
                      <span style={{ background: primaryColor }} />
                      <span style={{ background: secondaryColor }} />
                      <span style={{ background: accentColor }} />
                    </div>
                  </div>
                  <div className="onboard-brand-preview-card">
                    <div className="onboard-brand-preview-badge" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}>
                      {logoPreview ? <img src={logoPreview} alt="Logo preview" className="onboard-brand-preview-badge-logo" /> : previewInitials}
                    </div>
                    <div>
                      <div className="onboard-brand-preview-headline">{previewTitle}</div>
                      <div className="onboard-brand-preview-copy">{previewSubtitle}</div>
                    </div>
                  </div>
                  <div className="onboard-brand-preview-surface">
                    <div className="onboard-brand-preview-surface-top" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}>
                      <div className="onboard-brand-preview-surface-chip">Church Workspace</div>
                      <div className="onboard-brand-preview-surface-stat" style={{ background: accentColor }} />
                    </div>
                    <div className="onboard-brand-preview-surface-body">
                      <div className="onboard-brand-preview-surface-card" />
                      <div className="onboard-brand-preview-surface-card" />
                      <div className="onboard-brand-preview-surface-line" style={{ background: `${secondaryColor}22` }} />
                      <div className="onboard-brand-preview-surface-line short" style={{ background: `${accentColor}33` }} />
                    </div>
                  </div>
                </div>

                {error ? (
                  <div style={{ background: '#ffdad6', color: '#93000a', padding: '12px 14px', borderRadius: '12px', fontSize: '13px', marginTop: '18px' }}>
                    {error}
                  </div>
                ) : null}
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
