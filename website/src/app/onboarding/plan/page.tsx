'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { getSelectedPlan, saveSelectedPlan } from '../../../lib/onboarding';
import { DEFAULT_PLAN_ID, PLAN_DEFINITIONS, PlanId } from '../../../lib/plans';
import OnboardingSidebar from '../../../components/onboarding/OnboardingSidebar';

export default function PlanSelectionPage() {
  const router = useRouter();
  const { user, loading, isEmailVerified } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(DEFAULT_PLAN_ID);
  const [saving, setSaving] = useState(false);
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

      const planId = await getSelectedPlan(user.uid);
      if (!cancelled) {
        setSelectedPlanId(planId || DEFAULT_PLAN_ID);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [isEmailVerified, loading, router, user]);

  const handleContinue = async () => {
    if (!user) return;

    setSaving(true);
    setError('');
    try {
      await saveSelectedPlan(user.uid, selectedPlanId);
      router.push('/onboarding');
    } catch (err: any) {
      setError(err?.message || 'Failed to save your plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  return (
    <div className="onboard-shell">
      <div className="onboard-layout">
        <OnboardingSidebar
          progressPercent={20}
          progressCopy="Step 1 of 5: Plan Selection"
          quote="Choose a plan that fits the scale of your ministry today. You can always grow later."
          contextEyebrow="PrayLoom Planning"
          contextTitle="Begin with a plan that matches your church today."
          contextCopy="Select the operating shape for your first workspace. You can refine billing and upgrade paths later without losing setup progress."
          steps={[
            { label: 'Plan Selection', status: 'active' },
            { label: 'Workspace Basics', status: 'upcoming' },
            { label: 'Identity & Branding', status: 'upcoming' },
            { label: 'Center Setup', status: 'upcoming' },
            { label: 'Team Invitation', status: 'upcoming' },
          ]}
        />

        <main className="onboard-main">
          <div className="onboard-scroll-region">
            <div className="onboard-wrap onboard-wrap-wide">
              <div className="onboard-step">Step 1 of 5</div>
              <h1 className="onboard-title">Choose the plan that fits your church.</h1>
              <p className="onboard-copy">
                Start simple today. We&apos;ll save your selected plan and continue into workspace setup next.
              </p>

              <div className="onboard-plan-stage">
                <div className="onboard-plan-intro-card">
                  <div className="onboard-plan-intro-title">Start with the shape that fits your ministry today.</div>
                  <div className="onboard-plan-intro-copy">
                    Plans stay flexible. You can refine billing, centers, and team scale later without rebuilding your setup.
                  </div>
                </div>

                <div className="onboard-plan-stage-preview">
                  <div className="onboard-plan-stage-preview-shell">
                    <div className="onboard-plan-stage-badge">Workspace Preview</div>
                    <div className="onboard-plan-stage-headline">A calm foundation for centers, members, and Sunday attendance.</div>
                    <div className="onboard-plan-stage-copy">
                      Choose the operational shape first. The church identity, branding, and team access layers come next.
                    </div>

                    <div className="onboard-plan-stage-metrics">
                      <div className="onboard-plan-stage-metric">
                        <span>Setup</span>
                        <strong>5 guided steps</strong>
                      </div>
                      <div className="onboard-plan-stage-metric">
                        <span>Mobile</span>
                        <strong>Church code first</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="plan-selection-grid">
                {PLAN_DEFINITIONS.map((plan) => {
                  const isSelected = plan.id === selectedPlanId;
                  const centerLimit = plan.limits.centers === null ? 'Unlimited centers' : `Up to ${plan.limits.centers} centers`;
                  const memberLimit = plan.limits.members === null ? 'Unlimited members' : `Up to ${plan.limits.members} members`;

                  return (
                    <button
                      type="button"
                      key={plan.id}
                      className={`plan-card tone-${plan.accent}${isSelected ? ' selected' : ''}`}
                      onClick={() => setSelectedPlanId(plan.id)}
                    >
                      <div className="plan-card-selection-indicator" aria-hidden={!isSelected}>
                        {isSelected ? '✓' : null}
                      </div>

                      <div className="plan-card-head">
                        <div>
                          <div className="plan-card-name">{plan.name}</div>
                          <div className="plan-card-price">{plan.priceLabel}</div>
                        </div>
                      </div>
                      {isSelected ? <span className="plan-card-pill">Selected</span> : null}
                      <div className="plan-card-subtitle">{plan.subtitle}</div>
                      <div className="plan-card-description">{plan.description}</div>

                      <div className="plan-card-limits">
                        <div>{centerLimit}</div>
                        <div>{memberLimit}</div>
                      </div>

                      <div className="plan-card-list">
                        {plan.features.map((feature) => (
                          <div key={feature} className="plan-card-item">
                            <span className="plan-card-check">✓</span>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="plan-note-card">
                <div className="plan-note-copy">
                  Every new workspace currently starts in a simple trial/manual activation state while PrayLoom subscription handling continues to mature.
                </div>
              </div>

              {error ? (
                <div style={{ background: '#ffdad6', color: '#93000a', padding: '12px 14px', borderRadius: '12px', fontSize: '13px', marginTop: '18px' }}>
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <div className="onboard-footer-bar">
            <div className="onboard-footer-actions">
              <Link href="/signup" className="onboard-ghost-btn">
                Back
              </Link>
              <div className="onboard-footer-group">
                <div className="onboard-footer-note">Plan first, workspace next.</div>
                <button type="button" className="onboard-primary-btn" onClick={handleContinue} disabled={saving}>
                  {saving ? 'Saving...' : 'Continue to Workspace Setup'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
