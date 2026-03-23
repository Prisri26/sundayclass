'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { Center, subscribeCenters } from '../../lib/api';
import { MemberRecord, subscribeMembers, upsertMember } from '../../lib/members';

const emptyForm = {
  userId: '',
  email: '',
  displayName: '',
  role: 'teacher' as const,
  status: 'active' as const,
};

export default function MembersPage() {
  const { user, loading } = useAuth();
  const { activeChurchId, activeMembership, multiTenantEnabled } = useChurch();
  const router = useRouter();
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCenterIds, setSelectedCenterIds] = useState<string[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !activeChurchId || !activeMembership) return;
    const unsubMembers = subscribeMembers(activeChurchId, setMembers, () => setMembers([]));
    const unsubCenters = subscribeCenters(setCenters, activeChurchId, () => setCenters([]));
    return () => {
      unsubMembers();
      unsubCenters();
    };
  }, [user, activeChurchId]);

  const canManageMembers = activeMembership?.role === 'church_admin';

  const activeCenters = useMemo(
    () => centers.filter((center) => center.active),
    [centers]
  );
  const activeMembersCount = members.filter((member) => member.status === 'active').length;
  const teacherCount = members.filter((member) => member.role === 'teacher').length;
  const adminCount = members.filter((member) => member.role === 'church_admin').length;

  const toggleCenter = (centerId: string) => {
    setSelectedCenterIds((current) =>
      current.includes(centerId)
        ? current.filter((id) => id !== centerId)
        : [...current, centerId]
    );
  };

  const handleSave = async () => {
    if (!activeChurchId) {
      setError('No active church selected.');
      return;
    }
    if (!form.userId.trim()) {
      setError('Member UID is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await upsertMember(activeChurchId, {
        userId: form.userId,
        email: form.email,
        displayName: form.displayName,
        role: form.role,
        status: form.status,
        centerIds: selectedCenterIds,
      });
      setForm(emptyForm);
      setSelectedCenterIds([]);
    } catch (err: any) {
      setError(err?.message || 'Failed to save member.');
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
                  <div className="studio-metric-value">{members.filter((member) => member.status === 'invited').length}</div>
                </div>
                <div className="studio-metric">
                  <div className="studio-metric-label">Administrators</div>
                  <div className="studio-metric-value">{adminCount}</div>
                </div>
              </section>

              <section className="studio-panel">
                <div className="studio-section-title">Add member access</div>
                <div className="studio-section-copy">Paste the Firebase UID, choose a role, and assign the centers they can work within.</div>
                <div className="studio-form-card" style={{ marginTop: 22 }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Member UID *</label>
                    <input className="form-input" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="Firebase Auth user ID" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="teacher@church.com" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Display Name</label>
                    <input className="form-input" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Teacher name" />
                  </div>
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
                    <label className="form-label">Status</label>
                    <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}>
                      <option value="active">Active</option>
                      <option value="invited">Invited</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Center Access</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8 }}>
                      {activeCenters.map((center) => (
                        <button
                          key={center.id}
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => toggleCenter(center.id)}
                          style={{
                            background: selectedCenterIds.includes(center.id) ? '#EEF4FF' : undefined,
                            borderColor: selectedCenterIds.includes(center.id) ? '#4F46E5' : undefined,
                            color: selectedCenterIds.includes(center.id) ? '#3730A3' : undefined,
                          }}
                        >
                          {center.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {error && (
                  <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <div className="soft-panel" style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  Each member should first create their own email/password account. After that, paste their Firebase UID here to link them to this church and seed their access profile automatically.
                </div>

                <div className="soft-panel" style={{ display: 'grid', gap: 10, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Recommended flow</strong></div>
                  <div>1. Member creates their own account</div>
                  <div>2. Church admin pastes the UID and assigns role + centers</div>
                  <div>3. The platform seeds the member access profile automatically</div>
                  <div>4. Member signs in and the app resolves the church automatically</div>
                </div>

                <div className="soft-panel" style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Your current UID:</strong>{' '}
                  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{user.uid}</span>
                </div>

                <div>
                  <button className="studio-action" onClick={handleSave} disabled={saving}>
                    {saving ? <span className="spinner" /> : 'Save Member'}
                  </button>
                </div>
                </div>
              </section>

              <section className="studio-panel">
                <div className="studio-section-title">Current members</div>
                <div className="studio-section-copy">Review the people already linked to this church and the centers they can access.</div>
              {members.length === 0 ? (
                <div className="studio-empty">No members added yet. Add teacher, volunteer, or viewer access using their Firebase user ID.</div>
              ) : (
                <div className="studio-list-shell" style={{ marginTop: 24 }}>
                  <div className="studio-list-head studio-member-head">
                    <div>Member</div>
                    <div>Role</div>
                    <div>Assigned centers</div>
                    <div>Status</div>
                    <div />
                  </div>
                  {members.map((member) => (
                    <div key={member.id} className="studio-list-row studio-member-row">
                      <div className="studio-identity">
                        <div className={`studio-avatar ${member.role === 'church_admin' ? '' : 'is-soft'}`}>
                          {(member.displayName || member.email || member.userId).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="studio-primary">{member.displayName || member.email || member.userId}</div>
                          <div className="studio-secondary">
                            {member.email || 'No email saved'}
                            <br />
                            UID: {member.userId}
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
