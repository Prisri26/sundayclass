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
        <section className="admin-hero">
          <div className="admin-hero-grid">
            <div>
              <div className="admin-hero-eyebrow">Team Access</div>
              <div className="admin-hero-title">Manage the people who can run your church workspace</div>
              <div className="admin-hero-copy">
                Link teachers, volunteers, and admins using their Firebase UID so the right people see the right centers and student data.
              </div>
              <div className="admin-hero-actions">
                <div className="admin-hero-chip">🪪 {members.length} linked members</div>
                <div className="admin-hero-chip">🏠 {activeCenters.length} active centers</div>
              </div>
            </div>
            <div className="admin-hero-panel">
              <div className="admin-hero-panel-title">Access snapshot</div>
              <div className="admin-hero-panel-list">
                <div className="admin-hero-panel-item">
                  <div className="admin-hero-panel-label">Church admins</div>
                  <div className="admin-hero-panel-value">{adminCount}</div>
                </div>
                <div className="admin-hero-panel-item">
                  <div className="admin-hero-panel-label">Teachers</div>
                  <div className="admin-hero-panel-value">{teacherCount}</div>
                </div>
                <div className="admin-hero-panel-item">
                  <div className="admin-hero-panel-label">Active accounts</div>
                  <div className="admin-hero-panel-value">{activeMembersCount}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {multiTenantEnabled && !activeMembership ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🔒</div>
              <div className="empty-state-text">No church membership linked yet</div>
              <div className="empty-state-sub">Ask your church admin to add your UID before opening member tools.</div>
            </div>
          </div>
        ) : !canManageMembers ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🔒</div>
              <div className="empty-state-text">Only church admins can manage members</div>
              <div className="empty-state-sub">Ask your church admin to assign members and center access.</div>
            </div>
          </div>
        ) : (
          <>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-label">Total linked members</div>
                <div className="summary-value">{members.length}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Active members</div>
                <div className="summary-value">{activeMembersCount}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Teachers</div>
                <div className="summary-value">{teacherCount}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Church admins</div>
                <div className="summary-value">{adminCount}</div>
              </div>
            </div>

            <div className="card section-card" style={{ marginBottom: 20 }}>
              <div className="section-head">
                <div>
                  <div className="section-title">Add member access</div>
                  <div className="section-copy">Paste the user UID, choose their role, and grant the centers they can work with.</div>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 16 }}>
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
                  Each member should first create their own email/password account and sign in once. After that, paste their Firebase UID here to link them to this church.
                </div>

                <div className="soft-panel" style={{ display: 'grid', gap: 10, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Recommended flow</strong></div>
                  <div>1. Member creates their own account</div>
                  <div>2. Member signs in once so their user profile is created</div>
                  <div>3. Church admin pastes the UID and assigns role + centers</div>
                  <div>4. Member signs in again and the app resolves the church automatically</div>
                </div>

                <div className="soft-panel" style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Your current UID:</strong>{' '}
                  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{user.uid}</span>
                </div>

                <div>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <span className="spinner" /> : 'Save Member'}
                  </button>
                </div>
              </div>
            </div>

            <div className="card section-card">
              <div className="section-head">
                <div>
                  <div className="section-title">Current members</div>
                  <div className="section-copy">Review the people already linked to this church and the centers they can access.</div>
                </div>
              </div>
              {members.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🪪</div>
                  <div className="empty-state-text">No members added yet</div>
                  <div className="empty-state-sub">Add teacher, volunteer, or viewer access using their Firebase user ID.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {members.map((member) => (
                    <div key={member.id} className="soft-panel" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{member.displayName || member.email || member.userId}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{member.email || 'No email saved'}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>UID: {member.userId}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span className="badge">{member.role}</span>
                          <span className="badge">{member.status}</span>
                        </div>
                      </div>
                      {member.centerIds && member.centerIds.length > 0 && (
                        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {member.centerIds.map((centerId) => {
                            const center = activeCenters.find((item) => item.id === centerId);
                            return (
                              <span key={centerId} className="badge" style={{ background: '#EEF4FF', color: '#3730A3' }}>
                                {center?.name || centerId}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
