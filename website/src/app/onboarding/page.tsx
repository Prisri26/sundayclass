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

              <form onSubmit={handleSubmit} className="onboard-workspace-form">
                <section className="onboard-workspace-section">
                  <h3 className="onboard-workspace-section-title">Church Information</h3>
                  <div className="onboard-workspace-grid">
                    <div className="onboard-field">
                      <label className="onboard-label">Church Name</label>
                      <input
                        className="onboard-input"
                        value={churchName}
                        onChange={(e) => handleChurchNameChange(e.target.value)}
                        placeholder="Grace Community Church"
                        required
                      />
                    </div>

                    <div className="onboard-field">
                      <label className="onboard-label">Church ID / Slug</label>
                      <div className="onboard-input-with-suffix">
                        <input
                          className="onboard-input"
                          value={slug}
                          onChange={(e) => setSlug(normalizeChurchSlug(e.target.value))}
                          placeholder="grace-community"
                          required
                        />
                        <span className="onboard-input-suffix">.prayloom</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="onboard-workspace-section">
                  <h3 className="onboard-workspace-section-title">Contact Information</h3>
                  <div className="onboard-workspace-grid">
                    <div className="onboard-field full">
                      <label className="onboard-label">Your Name</label>
                      <input
                        className="onboard-input"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Smith"
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
                        placeholder="admin@church.org"
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
                  </div>
                </section>

                <section className="onboard-workspace-section">
                  <h3 className="onboard-workspace-section-title">Location Settings</h3>
                  <div className="onboard-workspace-grid">
                    <div className="onboard-field">
                      <label className="onboard-label">Country</label>
                      <input
                        className="onboard-input"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="India"
                      />
                    </div>

                    <div className="onboard-field">
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
                </section>

                <div className="onboard-workspace-tip">
                  <strong>Tip:</strong> Your church slug becomes part of the workspace identity. Choose something memorable and easy to share.
                </div>

                {error ? (
                  <div style={{ background: '#ffdad6', color: '#93000a', padding: '12px 14px', borderRadius: '12px', fontSize: '13px', marginTop: '18px' }}>
                    {error}
                  </div>
                ) : null}
              </form>
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
