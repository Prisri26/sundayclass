'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { Center, subscribeCenters } from '../../lib/api';
import { MemberRecord, ProvisioningMemberRecord, subscribeMembers, subscribeProvisioningMembers } from '../../lib/members';
import { listOnboardingCenters, saveProvisioningMembers } from '../../lib/onboarding';
import { ChurchSubscription, getChurchSubscription } from '../../lib/subscription';

const emptyForm: {
  fullName: string;
  role: 'church_admin' | 'teacher' | 'volunteer' | 'viewer';
} = {
  fullName: '',
  role: 'teacher',
};

export default function MembersPage() {
  const { user, loading } = useAuth();
  const { activeChurchId, activeMembership, multiTenantEnabled } = useChurch();
  const router = useRouter();
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [provisioningMembers, setProvisioningMembers] = useState<ProvisioningMemberRecord[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState('all');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<ChurchSubscription | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<ProvisioningMemberRecord[]>([]);
  const [provisioningStatus, setProvisioningStatus] = useState('');
  const [passwordResetStatus, setPasswordResetStatus] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !activeChurchId || !activeMembership) return;
    const unsubMembers = subscribeMembers(activeChurchId, setMembers, () => setMembers([]));
    const unsubProvisioning = subscribeProvisioningMembers(activeChurchId, setProvisioningMembers, () => setProvisioningMembers([]));
    const unsubCenters = subscribeCenters(setCenters, activeChurchId, () => setCenters([]));
    return () => {
      unsubMembers();
      unsubProvisioning();
      unsubCenters();
    };
  }, [user, activeChurchId]);

  useEffect(() => {
    if (!activeChurchId) return;
    getChurchSubscription(activeChurchId).then(setSubscription).catch(() => setSubscription(null));
  }, [activeChurchId]);

  const canManageMembers = activeMembership?.role === 'church_admin';

  const activeCenters = useMemo(
    () => centers.filter((center) => center.active),
    [centers]
  );
  const pendingProvisioningMembers = useMemo(
    () => provisioningMembers.filter((member) => member.status === 'pending_provisioning'),
    [provisioningMembers],
  );
  const activeMembersCount = members.filter((member) => member.status === 'active').length;
  const teacherCount = members.filter((member) => member.role === 'teacher').length;
  const adminCount = members.filter((member) => member.role === 'church_admin').length;
  const memberLimit = subscription?.limits.members ?? null;

  const handleSave = async () => {
    if (!activeChurchId) {
      setError('No active church selected.');
      return;
    }
    if (!form.fullName.trim()) {
      setError('Member name is required.');
      return;
    }
    if (memberLimit !== null && members.length + provisioningMembers.length >= memberLimit) {
      setError(`Your ${subscription?.planName || 'current'} plan allows up to ${memberLimit} members. Upgrade the plan before adding more.`);
      return;
    }

    const provisioningCenters =
      form.role === 'church_admin' || selectedCenterId === 'all'
        ? await listOnboardingCenters(activeChurchId)
        : centers
            .filter((center) => center.active && center.id === selectedCenterId)
            .map((center) => ({ id: center.id, name: center.name }));

    if (!provisioningCenters.length) {
      setError('Select a valid center before adding the member.');
      return;
    }

    setSaving(true);
    setError('');
    setProvisioningStatus('');
    setPasswordResetStatus('');
    try {
      const created = await saveProvisioningMembers(activeChurchId, [
        {
          fullName: form.fullName,
          role: form.role,
          centerIds: provisioningCenters.map((center) => center.id),
          centerNames:
            form.role === 'church_admin' || selectedCenterId === 'all'
              ? ['All Centers']
              : provisioningCenters.map((center) => center.name),
        },
      ]);
      setCreatedCredentials(created);
      setForm(emptyForm);
      setSelectedCenterId('all');
    } catch (err: any) {
      setError(err?.message || 'Failed to create provisioning record.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAccounts = async () => {
    if (!activeChurchId || !user) {
      setError('No active church selected.');
      return;
    }

    if (pendingProvisioningMembers.length === 0) {
      setProvisioningStatus('No pending provisioning records to process.');
      return;
    }

    setSaving(true);
    setError('');
    setProvisioningStatus('');
    setPasswordResetStatus('');

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/provision-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ churchId: activeChurchId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Provisioning failed.');
      }

      const createdCount = Array.isArray(payload.created) ? payload.created.length : 0;
      const failedCount = Array.isArray(payload.failed) ? payload.failed.length : 0;
      setProvisioningStatus(
        failedCount > 0
          ? `${createdCount} account${createdCount === 1 ? '' : 's'} created. ${failedCount} failed and remain in the provisioning queue.`
          : `${createdCount} account${createdCount === 1 ? '' : 's'} created successfully.`,
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to create member accounts.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetTemporaryPassword = async (memberUserId: string) => {
    if (!activeChurchId || !user) {
      setError('No active church selected.');
      return;
    }

    setSaving(true);
    setError('');
    setProvisioningStatus('');
    setPasswordResetStatus('');

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/reset-member-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ churchId: activeChurchId, memberUserId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Password reset failed.');
      }

      setPasswordResetStatus(`New temporary password for ${payload.loginId}: ${payload.temporaryPassword}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset temporary password.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="studio-page">
          <section className="studio-head">
            <div className="studio-head-copy">
              <div className="studio-kicker">Member stewardship</div>
              <h1 className="studio-title">Members</h1>
              <p className="studio-copy">
                Manage who can access your church workspace and centers. Maintain clear ministry roles and elegant digital stewardship across the congregation.
              </p>
            </div>
            {canManageMembers && <button className="studio-action" type="button">Add Member</button>}
          </section>

          {multiTenantEnabled && !activeMembership ? (
            <div className="studio-panel studio-empty">No church membership linked yet. Ask your church admin to add your UID before opening member tools.</div>
          ) : !canManageMembers ? (
            <div className="studio-panel studio-empty">Only church admins can manage members. Ask your church admin to assign members and center access.</div>
          ) : (
            <>
              <section className="studio-metrics">
                <div className="studio-metric">
                  <div className="studio-metric-label">Total members</div>
                  <div className="studio-metric-value">{members.length}</div>
                </div>
                <div className="studio-metric">
                  <div className="studio-metric-label">Active now</div>
                  <div className="studio-metric-value">{activeMembersCount}</div>
                </div>
                <div className="studio-metric">
                  <div className="studio-metric-label">Pending invites</div>
                  <div className="studio-metric-value">{pendingProvisioningMembers.length}</div>
                </div>
                <div className="studio-metric">
                  <div className="studio-metric-label">Administrators</div>
                  <div className="studio-metric-value">{adminCount}</div>
                </div>
                <div className="studio-metric">
                  <div className="studio-metric-label">Plan capacity</div>
                  <div className="studio-metric-value">{memberLimit ?? 'Unlimited'}</div>
                </div>
              </section>

              <section className="studio-panel">
                <div className="studio-section-title">Provision member access</div>
                <div className="studio-section-copy">
                  Generate PrayLoom login IDs and temporary passwords for teachers, volunteers, and church leaders.
                  {memberLimit !== null ? ` ${members.length + provisioningMembers.length}/${memberLimit} member seats are currently in use or reserved.` : ' Your plan currently supports unlimited member seats.'}
                </div>
                <div className="studio-form-card" style={{ marginTop: 22 }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Member Name *</label>
                    <input className="form-input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="John Samuel" />
                  </div>
                  <div className="form-group" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}>
                      <option value="church_admin">Church Admin</option>
                      <option value="teacher">Teacher</option>
                      <option value="volunteer">Volunteer</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Center Access</label>
                    <select className="form-input" value={form.role === 'church_admin' ? 'all' : selectedCenterId} onChange={(e) => setSelectedCenterId(e.target.value)} disabled={form.role === 'church_admin'}>
                      <option value="all">All Centers</option>
                      {activeCenters.map((center) => (
                        <option key={center.id} value={center.id}>
                          {center.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" />
                </div>

                {error && (
                  <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                    {error}
                  </div>
                )}

                {provisioningStatus && (
                  <div style={{ background: '#E8F4EC', color: '#17603A', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                    {provisioningStatus}
                  </div>
                )}

                {passwordResetStatus && (
                  <div style={{ background: '#EEF2FF', color: '#312E81', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                    {passwordResetStatus}
                  </div>
                )}

                <div className="soft-panel" style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  PrayLoom now generates a church-specific login ID such as <strong>john@hosanna.prayloom</strong> and a temporary password. These records are stored as provisioning items for the next secure account-creation step.
                </div>

                <div className="soft-panel" style={{ display: 'grid', gap: 10, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Recommended flow</strong></div>
                  <div>1. Church admin adds member name, role, and center access</div>
                  <div>2. PrayLoom generates a login ID and temporary password</div>
                  <div>3. The provisioning record is saved for secure account creation</div>
                  <div>4. The member signs in once the account is activated</div>
                </div>

                <div>
                  <button className="studio-action" onClick={handleSave} disabled={saving}>
                    {saving ? <span className="spinner" /> : 'Generate Member Credentials'}
                  </button>
                </div>

                {createdCredentials.length > 0 && (
                  <div className="soft-panel" style={{ display: 'grid', gap: 12, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Generated credentials</strong></div>
                    {createdCredentials.map((credential) => (
                      <div key={credential.id} style={{ padding: '12px 14px', borderRadius: 12, background: '#fff', border: '1px solid rgba(214,220,236,0.8)' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{credential.fullName}</div>
                        <div>Login ID: {credential.loginId}</div>
                        <div>Temporary Password: {credential.temporaryPassword}</div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </section>

              <section className="studio-panel">
                <div className="studio-section-title">Provisioning queue</div>
                <div className="studio-section-copy">These members are prepared with generated PrayLoom credentials and are waiting for secure account creation.</div>
                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="studio-action" type="button" onClick={handleCreateAccounts} disabled={saving || pendingProvisioningMembers.length === 0}>
                    {saving ? <span className="spinner" /> : 'Create Pending Accounts'}
                  </button>
                </div>
                {provisioningMembers.length === 0 ? (
                  <div className="studio-empty">No provisioning records yet. Generate member credentials above to prepare teacher and volunteer access.</div>
                ) : (
                  <div className="studio-list-shell" style={{ marginTop: 24 }}>
                    <div className="studio-list-head studio-provisioning-head">
                      <div>Member</div>
                      <div>Role</div>
                      <div>Login ID</div>
                      <div>Status</div>
                      <div />
                    </div>
                    {provisioningMembers.map((member) => (
                      <div key={member.id} className="studio-list-row studio-provisioning-row">
                        <div className="studio-identity">
                          <div className="studio-avatar is-soft">
                            {member.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="studio-primary">{member.fullName}</div>
                            <div className="studio-secondary">{member.centerNames.join(', ') || 'All Centers'}</div>
                          </div>
                        </div>
                        <div><span className="studio-pill">{member.role}</span></div>
                        <div className="studio-secondary">
                          {member.loginId}
                          {member.temporaryPassword ? (
                            <>
                              <br />
                              Temp: {member.temporaryPassword}
                            </>
                          ) : (
                            <>
                              <br />
                              Temporary password cleared after provisioning
                            </>
                          )}
                        </div>
                        <div className="studio-status">
                          <span className={`studio-status-dot ${member.status === 'failed' ? 'is-disabled' : member.status === 'provisioned' ? '' : 'is-pending'}`} />
                          {member.status}
                        </div>
                        <div className="studio-inline-actions">
                          <button className="studio-soft-button" type="button">
                            {member.status === 'pending_provisioning'
                              ? 'Ready for Account Creation'
                              : member.status === 'provisioned'
                                ? 'Auth Account Created'
                                : 'Needs Review'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="studio-panel">
                <div className="studio-section-title">Current members</div>
                <div className="studio-section-copy">Review the people already linked to this church and the centers they can access.</div>
              {members.length === 0 ? (
                <div className="studio-empty">No active members linked yet. Provision credentials above and then create the secure sign-in accounts in the next backend step.</div>
              ) : (
                <div className="studio-list-shell" style={{ marginTop: 24 }}>
                  <div className="studio-list-head studio-current-member-head">
                    <div>Member</div>
                    <div>Role</div>
                    <div>Assigned centers</div>
                    <div>Status</div>
                    <div />
                  </div>
                  {members.map((member) => (
                    <div key={member.id} className="studio-list-row studio-current-member-row">
                      <div className="studio-identity">
                        <div className={`studio-avatar ${member.role === 'church_admin' ? '' : 'is-soft'}`}>
                          {(member.displayName || member.email || member.userId).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="studio-primary">{member.displayName || member.email || member.userId}</div>
                          <div className="studio-secondary">
                            {member.email || 'No email saved'}
                            <br />
                            UID: {member.userId || 'Pending account'}
                          </div>
                        </div>
                      </div>
                      <div><span className="studio-pill">{member.role}</span></div>
                      <div className="studio-secondary">
                        {member.centerIds && member.centerIds.length > 0
                          ? member.centerIds.map((centerId) => activeCenters.find((item) => item.id === centerId)?.name || centerId).join(', ')
                          : 'All workspace visibility'}
                      </div>
                      <div className="studio-status">
                        <span className={`studio-status-dot ${member.status === 'invited' ? 'is-pending' : member.status === 'disabled' ? 'is-disabled' : ''}`} />
                        {member.status}
                      </div>
                      <div className="studio-inline-actions">
                        <button className="studio-link-button" type="button">View Profile</button>
                        <button className="studio-soft-button" type="button" onClick={() => handleResetTemporaryPassword(member.id)} disabled={saving}>
                          Reset Temp Password
                        </button>
                        <button className="studio-soft-button" type="button">Edit Access</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
