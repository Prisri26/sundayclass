'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addOnboardingCenter } from '../../../lib/onboarding';

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
        <aside className="onboard-sidebar">
          <div className="onboard-sidebar-content">
            <Link href="/" className="onboard-brand">
              <Image src="/prayloomlogo.svg" alt="PrayLoom" width={196} height={58} className="onboard-brand-logo" />
            </Link>
            <div className="onboard-progress-block">
              <div className="onboard-progress-label">Progress</div>
              <div className="onboard-progress-bar">
                <span style={{ width: '80%' }} />
              </div>
              <div className="onboard-progress-copy">Step 4 of 5: Center Setup</div>
              <div className="onboard-checklist">
                <div className="onboard-check-item"><div className="onboard-check-icon">✓</div><span>Plan Selection</span></div>
                <div className="onboard-check-item"><div className="onboard-check-icon">✓</div><span>Workspace Basics</span></div>
                <div className="onboard-check-item"><div className="onboard-check-icon">✓</div><span>Identity &amp; Branding</span></div>
                <div className="onboard-check-item active"><div className="onboard-check-icon">4</div><span>Center Setup</span></div>
                <div className="onboard-check-item"><div className="onboard-check-icon">5</div><span>Team Invitation</span></div>
              </div>
            </div>
          </div>
          <div className="onboard-sidebar-footer">
            <div className="onboard-sidebar-quote">
              &ldquo;For where two or three are gathered, structure still matters.&rdquo;
            </div>
          </div>
        </aside>

        <main className="onboard-main">
          <div className="onboard-scroll-region">
            <div className="onboard-wrap" style={{ maxWidth: '1120px' }}>
              <div className="onboard-step">Step 4 of 5</div>
              <h1 className="onboard-title">Create your Sunday class centers.</h1>
              <p className="onboard-copy">Add the church campus and any local centers where Sunday class is conducted.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 0.92fr) minmax(360px, 1.08fr)', gap: '42px', marginTop: '38px' }}>
              <section>
                <div className="onboard-panel" style={{ marginTop: 0, background: '#f2f3ff' }}>
                  <div className="onboard-panel-intro">
                    <div className="onboard-panel-intro-title">Center structure</div>
                    <div className="onboard-panel-intro-copy">
                      Add the church campus and any local teaching centers now. You can refine hosts, addresses, and attendance ownership later in the full workspace.
                    </div>
                  </div>
                  <div className="onboard-grid-2">
                    <div className="onboard-field">
                      <label className="onboard-label">Center Name</label>
                      <input className="onboard-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Center 1" />
                    </div>
                    <div className="onboard-field">
                      <label className="onboard-label">Center Code</label>
                      <input className="onboard-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CTR-01" />
                    </div>
                    <div className="onboard-field">
                      <label className="onboard-label">Host Name</label>
                      <input className="onboard-input" value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })} placeholder="John Doe" />
                    </div>
                    <div className="onboard-field">
                      <label className="onboard-label">Host Phone</label>
                      <input className="onboard-input" value={form.hostPhone} onChange={(e) => setForm({ ...form, hostPhone: e.target.value })} placeholder="+1 (555) 000-0000" />
                    </div>
                    <div className="onboard-field full">
                      <label className="onboard-label">Area</label>
                      <input className="onboard-input" value={form.areaName} onChange={(e) => setForm({ ...form, areaName: e.target.value })} placeholder="Downtown Parish District" />
                    </div>
                    <div className="onboard-field full">
                      <label className="onboard-label">Address</label>
                      <textarea className="onboard-textarea" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Faith Lane, Grace City" />
                    </div>
                  </div>

                  <button type="button" className="onboard-primary-btn" style={{ width: '100%', marginTop: '22px' }} onClick={addDraftCenter}>
                    Add Center
                  </button>
                </div>
              </section>

              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h3 className="font-editorial" style={{ fontSize: '40px', fontStyle: 'italic', color: '#131b2e' }}>Added Centers</h3>
                  <span className="onboard-chip">{centers.length} Center{centers.length === 1 ? '' : 's'} Created</span>
                </div>

                <div className="onboard-center-list">
                  {centers.map((center) => (
                    <div key={center.id} className="onboard-center-card">
                      <div>
                        <div className="onboard-chip" style={{ marginBottom: '12px' }}>{center.code}</div>
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
                    <div className="onboard-center-card" style={{ border: '2px dashed rgba(199,196,216,0.35)', background: '#f2f3ff', justifyContent: 'center', textAlign: 'center' }}>
                      <div>
                        <div className="font-editorial" style={{ fontSize: '28px', fontStyle: 'italic', color: '#777587' }}>Add another local center</div>
                        <div className="onboard-helper-copy" style={{ marginTop: '8px' }}>Manage distributed Sunday classes in one place.</div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {error ? (
                  <div style={{ background: '#ffdad6', color: '#93000a', padding: '12px 14px', borderRadius: '12px', fontSize: '13px', marginTop: '18px' }}>
                    {error}
                  </div>
                ) : null}
              </section>
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
