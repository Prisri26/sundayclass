'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setOnboardingState } from '../../../lib/onboarding';

type MemberDraft = {
  id: string;
  email: string;
  role: 'church_admin' | 'teacher' | 'volunteer' | 'viewer';
  centerAccess: string;
};

function createDraftId() {
  return `member_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function MembersOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const churchId = searchParams.get('church') || '';
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberDraft['role']>('teacher');
  const [centerAccess, setCenterAccess] = useState('All Centers');
  const [drafts, setDrafts] = useState<MemberDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addDraft = () => {
    if (!email.trim()) {
      setError('Member email is required.');
      return;
    }

    setDrafts((current) => [
      ...current,
      { id: createDraftId(), email: email.trim(), role, centerAccess },
    ]);
    setEmail('');
    setRole('teacher');
    setCenterAccess('All Centers');
    setError('');
  };

  const removeDraft = (id: string) => {
    setDrafts((current) => current.filter((entry) => entry.id !== id));
  };

  const finishSetup = async () => {
    if (!churchId) {
      setError('Missing church workspace reference. Please restart onboarding.');
      return;
    }

    setSaving(true);
    setError('');
    try {
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
      <div className="onboard-layout" style={{ gridTemplateColumns: '1fr' }}>
        <main className="onboard-main">
          <div className="onboard-wrap" style={{ maxWidth: '1160px' }}>
            <div className="onboard-step">Step 4 of 4</div>
            <h1 className="onboard-title">Invite your ministry team.</h1>
            <p className="onboard-copy">Add teachers, volunteers, and church leaders who will help run your centers.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 0.92fr) minmax(360px, 1.08fr)', gap: '42px', marginTop: '38px' }}>
              <section>
                <div className="onboard-panel" style={{ marginTop: 0, background: '#f2f3ff' }}>
                  <h2 className="font-editorial" style={{ fontSize: '34px', color: '#131b2e', marginBottom: '24px' }}>New Invitation</h2>

                  <div className="onboard-panel-form">
                    <div className="onboard-field">
                      <label className="onboard-label">Member Email</label>
                      <input className="onboard-input" placeholder="colleague@church.org" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div className="onboard-field">
                      <label className="onboard-label">Role</label>
                      <select className="onboard-select" value={role} onChange={(e) => setRole(e.target.value as MemberDraft['role'])}>
                        <option value="church_admin">Church Admin</option>
                        <option value="teacher">Teacher</option>
                        <option value="volunteer">Volunteer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>

                    <div className="onboard-field">
                      <label className="onboard-label">Center Access</label>
                      <select className="onboard-select" value={centerAccess} onChange={(e) => setCenterAccess(e.target.value)}>
                        <option>All Centers</option>
                        <option>Church</option>
                        <option>Center 1</option>
                        <option>Center 2</option>
                        <option>Center 3</option>
                      </select>
                    </div>

                    <button type="button" className="onboard-primary-btn" style={{ width: '100%' }} onClick={addDraft}>
                      Add Invitation
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'grid', gap: '14px' }}>
                  <button type="button" className="onboard-primary-btn" onClick={finishSetup} disabled={saving}>
                    {saving ? 'Finishing...' : 'Finish Setup'}
                  </button>
                  <button type="button" className="onboard-secondary-btn" onClick={finishSetup} disabled={saving}>
                    Skip for now
                  </button>
                </div>

                {error ? (
                  <div style={{ background: '#ffdad6', color: '#93000a', padding: '12px 14px', borderRadius: '12px', fontSize: '13px', marginTop: '18px' }}>
                    {error}
                  </div>
                ) : null}
              </section>

              <section className="onboard-table-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 className="font-editorial" style={{ fontSize: '34px', color: '#131b2e' }}>Pending Invites</h2>
                  <span className="onboard-chip">{drafts.length} Active</span>
                </div>

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
                          <div style={{ fontWeight: 700, color: '#131b2e' }}>{draft.email}</div>
                          <div style={{ fontSize: '12px', color: '#777587' }}>{draft.centerAccess}</div>
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
                          Add teachers, volunteers, and church leaders here. You can also complete this later from the Members page.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </section>
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
