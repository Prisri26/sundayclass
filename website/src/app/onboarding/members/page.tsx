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
      router.push(`/onboarding/completion?church=${encodeURIComponent(churchId)}`);
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

              <div className="onboard-members-layout">
                <section className="onboard-members-form">
                  <div className="onboard-workspace-section">
                    <div className="onboard-workspace-section-title">Member Details</div>
                    <div className="onboard-workspace-grid">
                      <div className="onboard-field full">
                        <label className="onboard-label">Full Name</label>
                        <input className="onboard-input" placeholder="John Samuel" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="onboard-workspace-section">
                    <div className="onboard-workspace-section-title">Access Role</div>
                    <div className="onboard-workspace-grid">
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
                    </div>
                  </div>

                  <div className="onboard-workspace-tip">
                    <strong>Provisioning rule:</strong> PrayLoom generates a unique login like <strong>john@churchslug.prayloom</strong> and a one-time temporary password. The member must change it on first login.
                  </div>

                  <button type="button" className="onboard-primary-btn" style={{ width: '100%' }} onClick={addDraft} disabled={loadingCenters}>
                    Add Provisioning Record
                  </button>

                  {error ? (
                    <div className="onboard-error-banner">
                      {error}
                    </div>
                  ) : null}
                </section>

                <aside className="onboard-members-preview">
                  <div className="onboard-preview-panel">
                    <div className="onboard-preview-header">
                      <div>
                        <div className="onboard-preview-eyebrow">Provisioning Queue</div>
                        <div className="onboard-preview-title">Team Access</div>
                      </div>
                      <span className="onboard-chip">{drafts.length} Draft{drafts.length === 1 ? '' : 's'}</span>
                    </div>
                    <div className="onboard-preview-copy">
                      Add teachers, volunteers, and leaders here. Each person receives a structured PrayLoom identity instead of a shared account.
                    </div>

                    {createdCredentials.length ? (
                      <div className="onboard-credential-stack">
                        {createdCredentials.map((credential) => (
                          <div key={credential.id} className="onboard-credential-card">
                            <div className="onboard-credential-name">{credential.fullName}</div>
                            <div className="onboard-credential-line">Login ID: {credential.loginId}</div>
                            <div className="onboard-credential-line">Temporary Password: {credential.temporaryPassword}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="onboard-member-queue">
                      {drafts.map((draft) => (
                        <div key={draft.id} className="onboard-member-card">
                          <div className="onboard-member-card-main">
                            <div className="onboard-member-card-name">{draft.fullName}</div>
                            <div className="onboard-member-card-meta">{draft.centerNames.join(', ')}</div>
                          </div>
                          <div className="onboard-member-card-side">
                            <span className="onboard-chip">{draft.role.replace('_', ' ')}</span>
                            <button type="button" className="onboard-ghost-btn" onClick={() => removeDraft(draft.id)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}

                      {!drafts.length ? (
                        <div className="onboard-center-empty">
                          <div className="onboard-preview-mini-badge">Identity setup</div>
                          <div className="onboard-center-empty-title">Start with one teacher</div>
                          <div className="onboard-helper-copy">You can keep this light now and add more ministry members after launch.</div>
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
