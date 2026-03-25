'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { createChurchWorkspace, getSelectedPlan, normalizeChurchSlug } from '../../lib/onboarding';
import { getPlanDefinition, type PlanId } from '../../lib/plans';
import OnboardingSidebar from '../../components/onboarding/OnboardingSidebar';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading, isEmailVerified } = useAuth();
  const defaultTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata', []);
  const [fullName, setFullName] = useState('');
  const [churchName, setChurchName] = useState('');
  const [slug, setSlug] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [country, setCountry] = useState('India');
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (loading) return;
      if (!user) {
        router.replace('/signup');
        return;
      }

      if (!isEmailVerified) {
        router.replace('/verify-email');
        return;
      }

      setFullName(user.displayName || '');
      setContactEmail(user.email || '');

      const planId = await getSelectedPlan(user.uid);
      if (cancelled) return;
      if (!planId) {
        router.replace('/onboarding/plan');
        return;
      }
      setSelectedPlanId(planId);
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [isEmailVerified, loading, router, user]);

  const handleChurchNameChange = (value: string) => {
    setChurchName(value);
    setSlug((current) => (current ? current : normalizeChurchSlug(value)));
  };

  const submitWorkspace = async () => {
    if (!user) return;

    setError('');
    setSubmitting(true);
    try {
      await createChurchWorkspace(user, {
        fullName,
        churchName,
        slug,
        selectedPlanId: selectedPlanId || undefined,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitWorkspace();
  };

  if (loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  return (
    <div className="onboard-shell">
      <div className="onboard-layout">
        <OnboardingSidebar
          progressPercent={40}
          progressCopy="Step 2 of 5: Workspace Basics"
          quote="A church workspace should feel as thoughtful as the ministry it serves."
          contextEyebrow="Selected Plan"
          contextTitle={getPlanDefinition(selectedPlanId || undefined).name}
          contextCopy={getPlanDefinition(selectedPlanId || undefined).subtitle}
          contextMeta={[
            { label: 'centers', value: String(getPlanDefinition(selectedPlanId || undefined).limits.centers ?? 'Unlimited') },
            { label: 'members', value: String(getPlanDefinition(selectedPlanId || undefined).limits.members ?? 'Unlimited') },
          ]}
          steps={[
            { label: 'Plan Selection', status: 'done' },
            { label: 'Workspace Basics', status: 'active' },
            { label: 'Identity & Branding', status: 'upcoming' },
            { label: 'Center Setup', status: 'upcoming' },
            { label: 'Team Invitation', status: 'upcoming' },
          ]}
        />

        <main className="onboard-main">
          <div className="onboard-scroll-region">
            <div className="onboard-wrap onboard-wrap-wide">
              <div className="onboard-step">Step 2 of 5</div>
              <h1 className="onboard-title">Create your church workspace.</h1>
              <p className="onboard-copy">
                This becomes the main branded workspace for your church on PrayLoom.
              </p>

              <div className="onboard-info-strip">
                <div className="onboard-info-strip-item">
                  <span className="onboard-info-strip-label">What this creates</span>
                  <strong>Your root church profile, workspace slug, and the first shared identity for every later setup step.</strong>
                </div>
                <div className="onboard-info-strip-item">
                  <span className="onboard-info-strip-label">What comes next</span>
                  <strong>Branding, center structure, and member access will all inherit this workspace foundation.</strong>
                </div>
              </div>

              <div className="onboard-panel">
                <div className="onboard-panel-intro">
                  <div className="onboard-panel-intro-title">Church identity basics</div>
                  <div className="onboard-panel-intro-copy">
                    This first workspace becomes the foundation for branding, centers, members, and attendance inside PrayLoom.
                  </div>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="onboard-grid-2">
                    <div className="onboard-field full">
                      <label className="onboard-label">Church Name</label>
                      <input
                        className="onboard-input"
                        value={churchName}
                        onChange={(e) => handleChurchNameChange(e.target.value)}
                        placeholder="Grace Cathedral"
                        required
                      />
                    </div>

                    <div className="onboard-field full">
                      <label className="onboard-label">Church ID / Slug</label>
                      <input
                        className="onboard-input"
                        value={slug}
                        onChange={(e) => setSlug(normalizeChurchSlug(e.target.value))}
                        placeholder="grace-cathedral"
                        required
                      />
                      <div className="onboard-hint">This unique identifier will be used in your workspace URL.</div>
                    </div>

                    <div className="onboard-field">
                      <label className="onboard-label">Your Name</label>
                      <input
                        className="onboard-input"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="onboard-field">
                      <label className="onboard-label">Contact Email</label>
                      <input
                        type="email"
                        className="onboard-input"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="admin@gracecathedral.org"
                        required
                      />
                    </div>

                    <div className="onboard-field">
                      <label className="onboard-label">Contact Phone</label>
                      <input
                        className="onboard-input"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div className="onboard-field">
                      <label className="onboard-label">Country</label>
                      <input
                        className="onboard-input"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="India"
                      />
                    </div>

                    <div className="onboard-field full">
                      <label className="onboard-label">Timezone</label>
                      <input
                        className="onboard-input"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        placeholder="Asia/Kolkata"
                        required
                      />
                    </div>
                  </div>

                  {error ? (
                    <div style={{ background: '#ffdad6', color: '#93000a', padding: '12px 14px', borderRadius: '12px', fontSize: '13px', marginTop: '18px' }}>
                      {error}
                    </div>
                  ) : null}
                </form>
              </div>

              <div className="onboard-helper-row">
                <div className="onboard-helper-card">
                  <div className="onboard-helper-title">Secure Foundation</div>
                  <div className="onboard-helper-copy">Your workspace is created with structured access and protected settings from the start.</div>
                </div>
                <div className="onboard-helper-card">
                  <div className="onboard-helper-title">Bespoke Branding</div>
                  <div className="onboard-helper-copy">The next step lets you shape the church identity, color palette, and welcome voice.</div>
                </div>
                <div className="onboard-helper-card">
                  <div className="onboard-helper-title">Global Reach</div>
                  <div className="onboard-helper-copy">Centers, members, students, and attendance all grow from this workspace foundation.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="onboard-footer-bar">
            <div className="onboard-footer-actions">
              <button type="button" className="onboard-ghost-btn" onClick={() => router.push('/onboarding/plan')}>
                Back
              </button>
              <div className="onboard-footer-group">
                <button type="button" className="onboard-primary-btn" disabled={submitting} onClick={() => void submitWorkspace()}>
                  {submitting ? 'Creating...' : 'Create Church Workspace'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
