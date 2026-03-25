'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  listOnboardingCenters,
  saveProvisioningMembers,
  setOnboardingState,
  type OnboardingCenterOption,
  type ProvisioningMemberRecord,
} from '../../../lib/onboarding';
import OnboardingSidebar from '../../../components/onboarding/OnboardingSidebar';

type DraftRole = 'church_admin' | 'teacher' | 'volunteer' | 'viewer';

type ProvisioningDraft = {
  id: string;
  fullName: string;
  role: DraftRole;
  centerIds: string[];
  centerNames: string[];
};

function createDraftId() {
  return `member_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function MembersOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const churchId = searchParams.get('church') || '';
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<DraftRole>('teacher');
  const [selectedCenterId, setSelectedCenterId] = useState('all');
  const [centers, setCenters] = useState<OnboardingCenterOption[]>([]);
  const [drafts, setDrafts] = useState<ProvisioningDraft[]>([]);
  const [createdCredentials, setCreatedCredentials] = useState<ProvisioningMemberRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadCenters() {
      if (!churchId) {
        setLoadingCenters(false);
        return;
      }

      try {
        const result = await listOnboardingCenters(churchId);
        if (cancelled) return;
        setCenters(result);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || 'Unable to load church centers for member provisioning.');
      } finally {
        if (!cancelled) setLoadingCenters(false);
      }
    }

    void loadCenters();
    return () => {
      cancelled = true;
    };
  }, [churchId]);

  const addDraft = () => {
    if (!fullName.trim()) {
      setError('Member name is required.');
      return;
    }

    const selectedCenters =
      selectedCenterId === 'all'
        ? centers
        : centers.filter((center) => center.id === selectedCenterId);

    const centerIds = role === 'church_admin' || selectedCenterId === 'all'
      ? centers.map((center) => center.id)
      : selectedCenters.map((center) => center.id);

    const centerNames = role === 'church_admin' || selectedCenterId === 'all'
      ? ['All Centers']
      : selectedCenters.map((center) => center.name);

    if (!centerIds.length) {
      setError('Select at least one center before adding the member.');
      return;
    }

    setDrafts((current) => [
      ...current,
      {
        id: createDraftId(),
        fullName: fullName.trim(),
        role,
        centerIds,
        centerNames,
      },
    ]);

    setFullName('');
    setRole('teacher');
    setSelectedCenterId('all');
    setError('');
  };

  const removeDraft = (id: string) => {
    setDrafts((current) => current.filter((entry) => entry.id !== id));
  };

  const finishSetup = async (skip = false) => {
    if (!churchId) {
      setError('Missing church workspace reference. Please restart onboarding.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const created = skip || drafts.length === 0
        ? []
        : await saveProvisioningMembers(
            churchId,
            drafts.map((draft) => ({
              fullName: draft.fullName,
              role: draft.role,
              centerIds: draft.centerIds,
              centerNames: draft.centerNames,
            })),
          );

      if (created.length) {
        setCreatedCredentials(created);
      }

      await setOnboardingState(churchId, 'setup_completed');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Failed to finish setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onboard-shell">
      <div className="onboard-layout">
        <OnboardingSidebar
          progressPercent={100}
          progressCopy="Step 5 of 5: Team Provisioning"
          quote="Prayerful access is also disciplined access. Give every teacher a real identity from day one."
          contextEyebrow="Account Provisioning"
          contextTitle="Create real identities before ministry begins."
          contextCopy="Each teacher, volunteer, or viewer should receive a unique PrayLoom login instead of shared credentials or borrowed devices."
          steps={[
            { label: 'Plan Selection', status: 'done' },
            { label: 'Workspace Basics', status: 'done' },
            { label: 'Identity & Branding', status: 'done' },
            { label: 'Center Setup', status: 'done' },
            { label: 'Team Invitation', status: 'active' },
          ]}
        />

        <main className="onboard-main">
          <div className="onboard-scroll-region">
            <div className="onboard-wrap" style={{ maxWidth: '1160px' }}>
              <div className="onboard-step">Step 5 of 5</div>
              <h1 className="onboard-title">Provision your ministry team.</h1>
              <p className="onboard-copy">
                Generate PrayLoom login IDs for teachers and volunteers so your church can start with structured access instead of shared credentials.
              </p>

              <div className="onboard-info-strip">
                <div className="onboard-info-strip-item">
                  <span className="onboard-info-strip-label">Teacher experience</span>
                  <strong>Members can enter the mobile app through church code, see branded context first, then sign in with their PrayLoom login ID.</strong>
                </div>
                <div className="onboard-info-strip-item">
                  <span className="onboard-info-strip-label">Security standard</span>
                  <strong>Temporary passwords are for first entry only. PrayLoom then forces a personal password change immediately.</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 0.92fr) minmax(360px, 1.08fr)', gap: '42px', marginTop: '38px' }}>
                <section>
                  <div className="onboard-panel" style={{ marginTop: 0, background: '#f2f3ff' }}>
                    <div className="onboard-panel-intro">
                      <div className="onboard-panel-intro-title">Member provisioning</div>
                      <div className="onboard-panel-intro-copy">
                        Each member gets a generated PrayLoom login ID such as <strong>john@hosanna.prayloom</strong>. Temporary passwords are generated for the provisioning queue and can be rotated later.
                      </div>
                    </div>
                    <h2 className="font-editorial" style={{ fontSize: '34px', color: '#131b2e', marginBottom: '24px' }}>New Team Member</h2>

                    <div className="onboard-panel-form">
                      <div className="onboard-field">
                        <label className="onboard-label">Full Name</label>
                        <input className="onboard-input" placeholder="John Samuel" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      </div>

                      <div className="onboard-field">
                        <label className="onboard-label">Role</label>
                        <select className="onboard-select" value={role} onChange={(e) => setRole(e.target.value as DraftRole)}>
                          <option value="church_admin">Church Admin</option>
                          <option value="teacher">Teacher</option>
                          <option value="volunteer">Volunteer</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>

                      <div className="onboard-field">
                        <label className="onboard-label">Center Access</label>
                        <select
                          className="onboard-select"
                          value={role === 'church_admin' ? 'all' : selectedCenterId}
                          onChange={(e) => setSelectedCenterId(e.target.value)}
                          disabled={loadingCenters || role === 'church_admin'}
                        >
                          <option value="all">All Centers</option>
                          {centers.map((center) => (
                            <option key={center.id} value={center.id}>
                              {center.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button type="button" className="onboard-primary-btn" style={{ width: '100%' }} onClick={addDraft} disabled={loadingCenters}>
                        Add Provisioning Record
                      </button>
                    </div>
                  </div>

                  {error ? (
                    <div style={{ background: '#ffdad6', color: '#93000a', padding: '12px 14px', borderRadius: '12px', fontSize: '13px', marginTop: '18px' }}>
                      {error}
                    </div>
                  ) : null}
                </section>

                <section className="onboard-table-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 className="font-editorial" style={{ fontSize: '34px', color: '#131b2e' }}>Provisioning Queue</h2>
                    <span className="onboard-chip">{drafts.length} Draft{drafts.length === 1 ? '' : 's'}</span>
                  </div>

                  {createdCredentials.length ? (
                    <div style={{ marginBottom: '24px', border: '1px solid rgba(57,44,193,0.14)', background: 'rgba(242,243,255,0.72)', borderRadius: '20px', padding: '18px' }}>
                      <div className="onboard-helper-title">Generated credentials</div>
                      <div className="onboard-helper-copy" style={{ marginTop: '8px' }}>
                        Save these credentials securely. This provisioning queue is ready for the next account-creation stage.
                      </div>
                      <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                        {createdCredentials.map((credential) => (
                          <div key={credential.id} style={{ borderRadius: '16px', background: '#ffffff', border: '1px solid rgba(214,220,236,0.8)', padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#131b2e' }}>{credential.fullName}</div>
                            <div style={{ marginTop: '6px', color: '#465069', fontSize: '14px' }}>Login ID: {credential.loginId}</div>
                            <div style={{ marginTop: '4px', color: '#465069', fontSize: '14px' }}>Temporary Password: {credential.temporaryPassword}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <table className="onboard-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Role</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drafts.map((draft) => (
                        <tr key={draft.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#131b2e' }}>{draft.fullName}</div>
                            <div style={{ fontSize: '12px', color: '#777587' }}>{draft.centerNames.join(', ')}</div>
                          </td>
                          <td style={{ textTransform: 'capitalize' }}>{draft.role.replace('_', ' ')}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button type="button" className="onboard-ghost-btn" onClick={() => removeDraft(draft.id)}>
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!drafts.length ? (
                        <tr>
                          <td colSpan={3} style={{ paddingTop: '28px', color: '#777587' }}>
                            Add teachers, volunteers, and church leaders here. PrayLoom will generate login IDs in the format <strong>name@churchslug.prayloom</strong>.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </section>
              </div>
            </div>
          </div>

          <div className="onboard-footer-bar">
            <div className="onboard-footer-actions">
              <button type="button" className="onboard-ghost-btn" onClick={() => router.push(`/onboarding/centers?church=${encodeURIComponent(churchId)}`)} disabled={saving}>
                Back
              </button>
              <div className="onboard-footer-group">
                <button type="button" className="onboard-secondary-btn" onClick={() => void finishSetup(true)} disabled={saving}>
                  Skip for now
                </button>
                <button type="button" className="onboard-primary-btn" onClick={() => void finishSetup(false)} disabled={saving || loadingCenters}>
                  {saving ? 'Finishing...' : 'Finish Setup & Generate Credentials'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function MembersOnboardingPage() {
  return (
    <Suspense fallback={<div className="loading-page"><div className="spinner" /></div>}>
      <MembersOnboardingContent />
    </Suspense>
  );
}
