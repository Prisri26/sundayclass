'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import Sidebar from '../../components/Sidebar';
import { addCenter, Center, deleteCenter, Student, subscribeCenters, subscribeStudents, updateCenter } from '../../lib/api';

const emptyForm = {
    name: '',
    code: '',
    hostName: '',
    hostPhone: '',
    areaName: '',
    address: '',
    isChurchLevel: false,
};

function isLegacyStyleCenter(center: Center) {
    const value = `${center.name} ${center.code}`.toLowerCase().trim();
    if (center.isChurchLevel) return false;
    if (value === 'church' || value === 'church church') return false;
    if (/^a\d+$/.test(center.name.trim().toLowerCase())) return false;
    if (/^a\d+$/.test(center.code.trim().toLowerCase())) return false;
    return /(^|\b)(lkg|ukg|\d+(st|nd|rd|th))(\b|$)/.test(value);
}

export default function CentersPage() {
    const { user, loading } = useAuth();
    const { activeChurchId, activeMembership, multiTenantEnabled } = useChurch();
    const router = useRouter();
    const [centers, setCenters] = useState<Center[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [form, setForm] = useState(emptyForm);
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [creatingStarters, setCreatingStarters] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.replace('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (!user || !activeChurchId || !activeMembership) return;
        return subscribeCenters(setCenters, activeChurchId ?? undefined);
    }, [user, activeChurchId, activeMembership]);

    useEffect(() => {
        if (!user || !activeChurchId || !activeMembership) return;
        return subscribeStudents(setStudents, activeChurchId ?? undefined);
    }, [user, activeChurchId, activeMembership]);

    if (loading || !user) return <div className="loading-page"><div className="spinner" /></div>;

    const openAdd = () => {
        setForm(emptyForm);
        setEditId(null);
        setError('');
        setModalOpen(true);
    };

    const openEdit = (center: Center) => {
        setForm({
            name: center.name,
            code: center.code,
            hostName: center.hostName ?? '',
            hostPhone: center.hostPhone ?? '',
            areaName: center.areaName ?? '',
            address: center.address ?? '',
            isChurchLevel: center.isChurchLevel ?? false,
        });
        setEditId(center.id);
        setError('');
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setForm(emptyForm);
        setEditId(null);
        setError('');
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.code.trim()) {
            setError('Center name and code are required.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const payload = {
                name: form.name.trim(),
                code: form.code.trim(),
                hostName: form.hostName.trim() || undefined,
                hostPhone: form.hostPhone.trim() || undefined,
                areaName: form.areaName.trim() || undefined,
                address: form.address.trim() || undefined,
                active: true,
                isChurchLevel: form.isChurchLevel,
            };

            if (editId) await updateCenter(editId, payload, activeChurchId ?? undefined);
            else await addCenter(payload, activeChurchId ?? undefined);
            closeModal();
        } catch {
            setError('Failed to save center. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (centerId: string) => {
        const assignedStudents = students.filter((student) => student.centerId === centerId).length;
        if (assignedStudents > 0) {
            setError(`Move ${assignedStudents} student${assignedStudents === 1 ? '' : 's'} to another center before deleting this one.`);
            return;
        }
        await deleteCenter(centerId, activeChurchId ?? undefined);
    };

    const handleCreateStarterCenters = async () => {
        if (!activeChurchId) return;
        const templates = [
            { name: 'A1', code: 'A1' },
            { name: 'A2', code: 'A2' },
            { name: 'A3', code: 'A3' },
        ].filter((template) => !centers.some((center) => center.name === template.name || center.code === template.code));

        if (templates.length === 0) {
            setError('Starter centers already exist.');
            return;
        }

        setCreatingStarters(true);
        setError('');
        try {
            for (const template of templates) {
                await addCenter({
                    ...template,
                    active: true,
                    isChurchLevel: false,
                }, activeChurchId);
            }
        } catch {
            setError('Failed to create starter centers. Please try again.');
        } finally {
            setCreatingStarters(false);
        }
    };

    const centerStats = centers.map((center) => ({
        center,
        studentCount: students.filter((student) => student.centerId === center.id).length,
    }));
    const legacyCenters = centerStats.filter(({ center }) => isLegacyStyleCenter(center));
    const emptyCenters = centerStats.filter(({ center, studentCount }) => !center.isChurchLevel && studentCount === 0);
    const activeAreaCenters = centerStats.filter(({ center }) => !center.isChurchLevel).length;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <section className="admin-hero">
                    <div className="admin-hero-grid">
                        <div>
                            <div className="admin-hero-eyebrow">Center Structure</div>
                            <div className="admin-hero-title">Organize every Sunday class center under one church workspace</div>
                            <div className="admin-hero-copy">
                                Keep church-level classes and area centers like A1, A2, and A3 structured clearly so students, members, and attendance all stay aligned.
                            </div>
                            <div className="admin-hero-actions">
                                <div className="admin-hero-chip">🏠 {centers.length} total centers</div>
                                <div className="admin-hero-chip">👥 {students.length} assigned students</div>
                            </div>
                        </div>
                        <div className="admin-hero-panel">
                            <div className="admin-hero-panel-title">Center health</div>
                            <div className="admin-hero-panel-list">
                                <div className="admin-hero-panel-item">
                                    <div className="admin-hero-panel-label">Area centers</div>
                                    <div className="admin-hero-panel-value">{activeAreaCenters}</div>
                                </div>
                                <div className="admin-hero-panel-item">
                                    <div className="admin-hero-panel-label">Empty centers</div>
                                    <div className="admin-hero-panel-value">{emptyCenters.length}</div>
                                </div>
                                <div className="admin-hero-panel-item">
                                    <div className="admin-hero-panel-label">Legacy labels</div>
                                    <div className="admin-hero-panel-value">{legacyCenters.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="topbar">
                    <div>
                        <div className="topbar-title">🏠 Centers</div>
                        <div className="topbar-meta">Manage Sunday class centers and church-level groups.</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost" onClick={handleCreateStarterCenters} disabled={creatingStarters}>
                            {creatingStarters ? 'Creating...' : '⚡ Add A1/A2/A3'}
                        </button>
                        <button className="btn btn-primary" onClick={openAdd}>➕ Add Center</button>
                    </div>
                </div>

                {multiTenantEnabled && !activeMembership ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">🔒</div>
                            <div className="empty-state-text">No church membership linked yet</div>
                            <div className="empty-state-sub">Ask your church admin to add your UID in the Members page.</div>
                        </div>
                    </div>
                ) : (
                <>
                <div className="summary-grid">
                    <div className="summary-card">
                        <div className="summary-label">Total centers</div>
                        <div className="summary-value">{centers.length}</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-label">Area centers</div>
                        <div className="summary-value">{activeAreaCenters}</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-label">Empty centers</div>
                        <div className="summary-value" style={{ color: '#B7791F' }}>{emptyCenters.length}</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-label">Legacy labels</div>
                        <div className="summary-value" style={{ color: '#D97706' }}>{legacyCenters.length}</div>
                    </div>
                </div>

                {(legacyCenters.length > 0 || emptyCenters.length > 0) && (
                    <div className="card section-card" style={{ marginBottom: 20 }}>
                        <div className="section-head">
                            <div>
                                <div className="section-title">Center cleanup</div>
                                <div className="section-copy">
                                    Review old labels and unused centers so the church uses clean center names like A1, A2, A3, or Church.
                                </div>
                            </div>
                            <button className="btn btn-ghost" onClick={() => router.push('/students')}>Open Students</button>
                        </div>
                        <div style={{ display: 'grid', gap: 12 }}>
                            {legacyCenters.map(({ center, studentCount }) => (
                                <div
                                    key={`legacy-${center.id}`}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: 14,
                                        borderRadius: 16,
                                        background: '#FFF7ED',
                                        border: '1px solid #FED7AA',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#9A3412' }}>{center.name}</div>
                                        <div style={{ fontSize: 13, color: '#9A3412' }}>
                                            This looks like a legacy school grade label. Rename it to a real center or move students out and delete it.
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ background: '#FFEDD5', color: '#9A3412', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                                            {studentCount} students
                                        </span>
                                        <button className="btn btn-ghost" onClick={() => openEdit(center)}>Rename</button>
                                    </div>
                                </div>
                            ))}
                            {emptyCenters.map(({ center }) => (
                                <div
                                    key={`empty-${center.id}`}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: 14,
                                        borderRadius: 16,
                                        background: '#F8FAFD',
                                        border: '1px solid #E2E8F0',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>{center.name}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                            No students are assigned here. If you no longer use this center, you can remove it.
                                        </div>
                                    </div>
                                    <button className="btn btn-danger" onClick={() => handleDelete(center.id)}>Delete</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {centers.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🏠</div>
                        <div className="empty-state-text">No centers yet</div>
                        <div className="empty-state-sub">Create your church center and area centers like A1, A2, and A3.</div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 16 }}>
                        {centers.map((center) => (
                            <div key={center.id} className="card section-card" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        <strong style={{ fontSize: 18 }}>{center.name}</strong>
                                        <span style={{ background: '#EEF2FF', color: '#3730A3', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                                            {center.code}
                                        </span>
                                        {center.isChurchLevel && (
                                            <span style={{ background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                                                Church Level
                                            </span>
                                        )}
                                        <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                                            {students.filter((student) => student.centerId === center.id).length} students
                                        </span>
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                                        {center.areaName ? `Area: ${center.areaName}` : 'Area not set'}
                                        {center.hostName ? ` • Host: ${center.hostName}` : ''}
                                        {center.hostPhone ? ` • ${center.hostPhone}` : ''}
                                    </div>
                                    {center.address && (
                                        <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6 }}>{center.address}</div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button className="btn btn-ghost" onClick={() => openEdit(center)}>✏️ Edit</button>
                                    {!center.isChurchLevel && (
                                        <button className="btn btn-danger" onClick={() => handleDelete(center.id)}>🗑️ Delete</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </>
                )}

                {modalOpen && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal" style={{ maxWidth: 560 }} onClick={(event) => event.stopPropagation()}>
                            <div className="modal-header">
                                <span className="modal-title">{editId ? '✏️ Edit Center' : '➕ Add Center'}</span>
                                <button className="modal-close" onClick={closeModal}>✕</button>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Center Name *</label>
                                    <input className="form-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="A1 or Church Sunday Class" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Center Code *</label>
                                    <input className="form-input" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="A1 or CHURCH" />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Host Name</label>
                                    <input className="form-input" value={form.hostName} onChange={(event) => setForm({ ...form, hostName: event.target.value })} placeholder="Member conducting the class" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Host Phone</label>
                                    <input className="form-input" value={form.hostPhone} onChange={(event) => setForm({ ...form, hostPhone: event.target.value })} placeholder="+91 98765 43210" />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Area Name</label>
                                    <input className="form-input" value={form.areaName} onChange={(event) => setForm({ ...form, areaName: event.target.value })} placeholder="Neighborhood or area" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <input className="form-input" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="House address" />
                                </div>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, color: 'var(--text-secondary)' }}>
                                <input type="checkbox" checked={form.isChurchLevel} onChange={(event) => setForm({ ...form, isChurchLevel: event.target.checked })} />
                                This center is the church-level Sunday class
                            </label>

                            {error && (
                                <div style={{ color: '#991B1B', fontSize: 13, background: '#FEE2E2', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
                                    ⚠️ {error}
                                </div>
                            )}

                            <div className="modal-actions">
                                <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                    {saving ? <span className="spinner" /> : 'Save Center'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
