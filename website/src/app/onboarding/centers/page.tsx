'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addOnboardingCenter } from '../../../lib/onboarding';
import OnboardingSidebar from '../../../components/onboarding/OnboardingSidebar';

const emptyForm = {
  name: '',
  code: '',
  hostName: '',
  hostPhone: '',
  areaName: '',
  address: '',
};

type CenterDraft = typeof emptyForm & { id: string };

function createDraftCenterId() {
  return `center_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function CentersOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const churchId = searchParams.get('church') || '';
  const [form, setForm] = useState(emptyForm);
  const [centers, setCenters] = useState<CenterDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addDraftCenter = () => {
    if (!form.name.trim() || !form.code.trim()) {
      setError('Center name and code are required.');
      return;
    }

    setCenters((current) => [...current, { ...form, id: createDraftCenterId() }]);
    setForm(emptyForm);
    setError('');
  };

  const removeDraftCenter = (id: string) => {
    setCenters((current) => current.filter((center) => center.id !== id));
  };

  const goNext = async (skip = false) => {
    if (!churchId) {
      setError('Missing church workspace reference. Please restart onboarding.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (!skip) {
        for (const center of centers) {
          await addOnboardingCenter(churchId, center);
        }
      }

      router.push(`/onboarding/members?church=${encodeURIComponent(churchId)}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to save centers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onboard-shell">
      <div className="onboard-layout">
        <OnboardingSidebar
          progressPercent={80}
          progressCopy="Step 4 of 5: Center Setup"
          quote="For where two or three are gathered, structure still matters."
          contextEyebrow="Center Design"
          contextTitle="Map where ministry actually happens."
          contextCopy="Use this step to turn one church workspace into a real operating network of campuses, houses, or local centers."
          steps={[
            { label: 'Plan Selection', status: 'done' },
            { label: 'Workspace Basics', status: 'done' },
            { label: 'Identity & Branding', status: 'done' },
            { label: 'Center Setup', status: 'active' },
            { label: 'Team Invitation', status: 'upcoming' },
          ]}
        />

        <main className="onboard-main">
          <div className="onboard-scroll-region">
            <div className="onboard-wrap" style={{ maxWidth: '1120px' }}>
              <div className="onboard-step">Step 4 of 5</div>
              <h1 className="onboard-title">Create your Sunday class centers.</h1>
              <p className="onboard-copy">Add the church campus and any local centers where Sunday class is conducted.</p>

              <div className="onboard-info-strip">
                <div className="onboard-info-strip-item">
                  <span className="onboard-info-strip-label">What this unlocks</span>
                  <strong>Teachers, attendance, and students can all be scoped to the right local center instead of one flat list.</strong>
                </div>
                <div className="onboard-info-strip-item">
                  <span className="onboard-info-strip-label">Good default</span>
                  <strong>Start with the main church and only add more centers where class leadership actually needs separate access.</strong>
                </div>
              </div>

              <div className="onboard-centers-layout">
                <section className="onboard-centers-form">
                  <div className="onboard-workspace-section">
                    <div className="onboard-workspace-section-title">Center Details</div>
                    <div className="onboard-workspace-grid">
                      <div className="onboard-field">
                        <label className="onboard-label">Center Name</label>
                        <input className="onboard-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Center 1" />
                      </div>
                      <div className="onboard-field">
                        <label className="onboard-label">Center Code</label>
                        <input className="onboard-input onboard-input-mono" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CTR-01" />
                      </div>
                    </div>
                  </div>

                  <div className="onboard-workspace-section">
                    <div className="onboard-workspace-section-title">Center Host / Leader</div>
                    <div className="onboard-workspace-grid">
                      <div className="onboard-field">
                        <label className="onboard-label">Host Name</label>
                        <input className="onboard-input" value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })} placeholder="John Doe" />
                      </div>
                      <div className="onboard-field">
                        <label className="onboard-label">Host Phone</label>
                        <input className="onboard-input" value={form.hostPhone} onChange={(e) => setForm({ ...form, hostPhone: e.target.value })} placeholder="+1 (555) 000-0000" />
                      </div>
                    </div>
                  </div>

                  <div className="onboard-workspace-section">
                    <div className="onboard-workspace-section-title">Location</div>
                    <div className="onboard-workspace-grid">
                      <div className="onboard-field full">
                        <label className="onboard-label">Area</label>
                        <input className="onboard-input" value={form.areaName} onChange={(e) => setForm({ ...form, areaName: e.target.value })} placeholder="Downtown Parish District" />
                      </div>
                      <div className="onboard-field full">
                        <label className="onboard-label">Address</label>
                        <textarea className="onboard-textarea" rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Faith Lane, Grace City" />
                      </div>
                    </div>
                  </div>

                  <div className="onboard-workspace-tip">
                    <strong>Recommended:</strong> add only the locations where you need separate hosts, attendance ownership, or teacher access. You can expand later without restructuring your workspace.
                  </div>

                  <button type="button" className="onboard-primary-btn" style={{ width: '100%' }} onClick={addDraftCenter}>
                    Add Center
                  </button>

                  {error ? (
                    <div className="onboard-error-banner">
                      {error}
                    </div>
                  ) : null}
                </section>

                <aside className="onboard-centers-preview">
                  <div className="onboard-preview-panel">
                    <div className="onboard-preview-eyebrow">Center Network</div>
                    <div className="onboard-preview-title">Added Centers</div>
                    <div className="onboard-preview-copy">
                      The church workspace will use these local centers for team assignment, attendance, and student stewardship.
                    </div>

                    <div className="onboard-center-list">
                      {centers.map((center) => (
                        <div key={center.id} className="onboard-center-card">
                          <div className="onboard-center-card-main">
                            <div className="onboard-chip">{center.code}</div>
                            <div className="onboard-center-title">{center.name}</div>
                            <div className="onboard-center-meta">
                              {center.hostName ? <div>Host: {center.hostName}</div> : null}
                              {center.areaName ? <div>Area: {center.areaName}</div> : null}
                              {center.address ? <div>{center.address}</div> : null}
                            </div>
                          </div>
                          <button type="button" className="onboard-ghost-btn" onClick={() => removeDraftCenter(center.id)}>
                            Remove
                          </button>
                        </div>
                      ))}

                      {!centers.length ? (
                        <div className="onboard-center-empty">
                          <div className="onboard-preview-mini-badge">Starting point</div>
                          <div className="onboard-center-empty-title">Add your first center</div>
                          <div className="onboard-helper-copy">Begin with the main church campus, then add satellite or neighborhood centers as needed.</div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>

          <div className="onboard-footer-bar">
            <div className="onboard-footer-actions">
              <button type="button" className="onboard-ghost-btn" onClick={() => router.push(`/onboarding/branding?church=${encodeURIComponent(churchId)}`)} disabled={saving}>
                Back
              </button>
              <div className="onboard-footer-group">
                <button type="button" className="onboard-ghost-btn" onClick={() => goNext(true)} disabled={saving}>
                  Skip for now
                </button>
                <button type="button" className="onboard-primary-btn" onClick={() => goNext(false)} disabled={saving}>
                  {saving ? 'Saving...' : 'Continue to Members'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function CentersOnboardingPage() {
  return (
    <Suspense fallback={<div className="loading-page"><div className="spinner" /></div>}>
      <CentersOnboardingContent />
    </Suspense>
  );
}
