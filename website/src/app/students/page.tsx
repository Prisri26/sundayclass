'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { subscribeStudents, addStudent, updateStudent, deleteStudent, Student } from '../../lib/api';

const CLASSES = ['Beginners', 'Primary', 'Juniors', 'Teens', 'Young Adults'];

const emptyForm = { name: '', class: '', phone: '', age: '' };

export default function StudentsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<'add' | 'edit' | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [editId, setEditId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (!loading && !user) router.replace('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        return subscribeStudents(setStudents);
    }, [user]);

    if (loading || !user) return <div className="loading-page"><div className="spinner" /></div>;

    const openAdd = () => { setForm(emptyForm); setFormError(''); setEditId(null); setModal('add'); };
    const openEdit = (s: Student) => {
        setForm({ name: s.name, class: s.class, phone: s.phone, age: String(s.age) });
        setEditId(s.id);
        setFormError('');
        setModal('edit');
    };
    const closeModal = () => { setModal(null); setForm(emptyForm); setEditId(null); setFormError(''); };

    const handleSave = async () => {
        const missing = [];
        if (!form.name.trim()) missing.push('Full Name');
        if (!form.class) missing.push('Class');
        if (!form.phone.trim()) missing.push('Parent Phone');
        if (!form.age) missing.push('Age');
        if (missing.length > 0) {
            setFormError(`Please fill in: ${missing.join(', ')}`);
            return;
        }
        setFormError('');
        setSaving(true);
        try {
            const payload = { name: form.name.trim(), class: form.class, phone: form.phone.trim(), age: parseInt(form.age) };
            if (modal === 'add') await addStudent(payload);
            else if (modal === 'edit' && editId) await updateStudent(editId, payload);
            closeModal();
        } catch {
            setFormError('Failed to save. Please try again.');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        await deleteStudent(id);
        setDeleteConfirm(null);
    };

    const filtered = students.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.class.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="topbar">
                    <div>
                        <div className="topbar-title">👥 Students</div>
                        <div className="topbar-meta">{students.length} total students</div>
                    </div>
                    <button className="btn btn-primary" onClick={openAdd}>➕ Add Student</button>
                </div>

                <div className="card">
                    <div className="toolbar">
                        <div className="search-wrapper">
                            <span className="search-icon">🔍</span>
                            <input
                                className="search-input"
                                placeholder="Search students..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Showing {filtered.length} of {students.length}
                        </span>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">👥</div>
                            <div className="empty-state-text">No students found</div>
                            <div className="empty-state-sub">Add your first student to get started.</div>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Class</th>
                                        <th>Phone</th>
                                        <th>Age</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((s) => (
                                        <tr key={s.id}>
                                            <td>
                                                <div className="name-cell">
                                                    <div className="avatar">{s.name.charAt(0)}</div>
                                                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ background: '#EEF2FF', color: 'var(--primary)', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
                                                    {s.class}
                                                </span>
                                            </td>
                                            <td>{s.phone}</td>
                                            <td>{s.age} yrs</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>✏️ Edit</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(s.id)}>🗑️ Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Add/Edit Modal */}
                {modal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <span className="modal-title">{modal === 'add' ? '➕ Add Student' : '✏️ Edit Student'}</span>
                                <button className="modal-close" onClick={closeModal}>✕</button>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Samuel Emmanuel" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Class</label>
                                    <select className="form-input" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>
                                        <option value="">Select class...</option>
                                        {CLASSES.map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Parent Phone</label>
                                    <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234 800 000 0000" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Age</label>
                                    <input className="form-input" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="8" min={1} max={25} />
                                </div>
                            </div>
                            {formError && (
                                <div style={{ color: 'var(--danger)', fontSize: '13px', background: '#FEE2E2', borderRadius: '8px', padding: '10px 14px', marginTop: '4px' }}>
                                    ⚠️ {formError}
                                </div>
                            )}
                            <div className="modal-actions">
                                <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                    {saving ? <span className="spinner" /> : (modal === 'add' ? 'Save Student' : 'Update Student')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirm */}
                {deleteConfirm && (
                    <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                        <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <span className="modal-title">🗑️ Delete Student</span>
                                <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Are you sure you want to delete this student? This action cannot be undone and all their attendance records will remain.</p>
                            <div className="modal-actions">
                                <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
