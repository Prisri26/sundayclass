'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import {
    subscribeStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudentAttendance,
    uploadToCloudinary,
    Student,
    AttendanceRecord,
} from '../../lib/api';

const CLASSES = ['LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

const CLASS_COLORS: Record<string, { bg: string; color: string }> = {
    'LKG': { bg: '#FEF9C3', color: '#92400E' },
    'UKG': { bg: '#FEF3C7', color: '#92400E' },
    '1st': { bg: '#DBEAFE', color: '#1E40AF' },
    '2nd': { bg: '#E0E7FF', color: '#3730A3' },
    '3rd': { bg: '#EDE9FE', color: '#5B21B6' },
    '4th': { bg: '#FCE7F3', color: '#9D174D' },
    '5th': { bg: '#FEE2E2', color: '#991B1B' },
    '6th': { bg: '#FFEDD5', color: '#9A3412' },
    '7th': { bg: '#D1FAE5', color: '#065F46' },
    '8th': { bg: '#ECFDF5', color: '#047857' },
    '9th': { bg: '#CFFAFE', color: '#155E75' },
    '10th': { bg: '#EEF2FF', color: '#3730A3' },
    '11th': { bg: '#F0FDF4', color: '#166534' },
    '12th': { bg: '#FDF4FF', color: '#6B21A8' },
};

const emptyForm = { name: '', class: '', phone: '', dob: '' };

function StudentCard({ student, onView, onEdit, onDelete }: {
    student: Student;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [imgErr, setImgErr] = useState(false);
    const clsColor = CLASS_COLORS[student.class] ?? { bg: '#EEF2FF', color: '#3730A3' };

    // Calculate age from DOB
    let displayAge = '';
    if (student.dob) {
        const today = new Date();
        const birth = new Date(student.dob);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        displayAge = `${age} yrs`;
    } else if (student.age) {
        displayAge = `${student.age} yrs`;
    }

    return (
        <div style={{
            background: 'white',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            border: '1px solid #E2E8F0',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
        }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(79,70,229,0.15)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)';
            }}
        >
            {/* Photo area */}
            <div style={{ position: 'relative', background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', height: 180 }} onClick={onView}>
                {student.photoUrl && !imgErr ? (
                    <img
                        src={student.photoUrl}
                        alt={student.name}
                        onError={() => setImgErr(true)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, #818CF8, #4F46E5)',
                        fontSize: 64, color: 'white', fontWeight: 800,
                        textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        userSelect: 'none',
                    }}>
                        {student.name.charAt(0).toUpperCase()}
                    </div>
                )}
                {/* Class badge overlay */}
                <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: clsColor.bg, color: clsColor.color,
                    padding: '3px 10px', borderRadius: 999,
                    fontSize: 11, fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                }}>
                    Class {student.class}
                </div>
            </div>

            {/* Info area */}
            <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }} onClick={onView}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {student.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B' }}>
                    <span>📞</span><span>{student.phone}</span>
                </div>
                {displayAge && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B' }}>
                        <span>🎂</span><span>{displayAge}</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div style={{
                display: 'flex', gap: 0, borderTop: '1px solid #F1F5F9',
            }}>
                <button onClick={onView} style={{
                    flex: 1, padding: '10px 0', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#4F46E5',
                    transition: 'background 0.15s', fontFamily: 'inherit',
                    borderBottomLeftRadius: 20,
                }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#EEF2FF')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >📋 View</button>
                <div style={{ width: 1, background: '#F1F5F9' }} />
                <button onClick={onEdit} style={{
                    flex: 1, padding: '10px 0', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748B',
                    transition: 'background 0.15s', fontFamily: 'inherit',
                }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >✏️ Edit</button>
                <div style={{ width: 1, background: '#F1F5F9' }} />
                <button onClick={onDelete} style={{
                    flex: 1, padding: '10px 0', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#EF4444',
                    transition: 'background 0.15s', fontFamily: 'inherit',
                    borderBottomRightRadius: 20,
                }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >🗑️ Del</button>
            </div>
        </div>
    );
}

export default function StudentsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [modal, setModal] = useState<'add' | 'edit' | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [editId, setEditId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [formError, setFormError] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Detail modal
    const [detailStudent, setDetailStudent] = useState<Student | null>(null);
    const [detailAttendance, setDetailAttendance] = useState<AttendanceRecord[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.replace('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        return subscribeStudents(setStudents);
    }, [user]);

    if (loading || !user) return <div className="loading-page"><div className="spinner" /></div>;

    const openAdd = () => { setForm(emptyForm); setFormError(''); setEditId(null); setPhotoFile(null); setPhotoPreview(null); setModal('add'); };
    const openEdit = (s: Student) => {
        setForm({ name: s.name, class: s.class, phone: s.phone, dob: s.dob ?? '' });
        setEditId(s.id); setFormError(''); setPhotoFile(null);
        setPhotoPreview(s.photoUrl ?? null); setModal('edit');
    };
    const closeModal = () => { setModal(null); setForm(emptyForm); setEditId(null); setFormError(''); setPhotoFile(null); setPhotoPreview(null); };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        const missing: string[] = [];
        if (!form.name.trim()) missing.push('Full Name');
        if (!form.class) missing.push('Class');
        if (missing.length > 0) { setFormError(`Please fill in: ${missing.join(', ')}`); return; }
        setFormError('');
        setSaving(true);
        try {
            let photoUrl: string | undefined;
            if (photoFile) {
                photoUrl = await uploadToCloudinary(photoFile);
            } else if (modal === 'edit' && photoPreview?.startsWith('http')) {
                photoUrl = photoPreview;
            }

            // Calc age from DOB
            let age: number | undefined;
            if (form.dob) {
                const today = new Date();
                const birth = new Date(form.dob);
                let a = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
                age = a;
            }

            const payload: Omit<Student, 'id' | 'createdAt'> = {
                name: form.name.trim(),
                class: form.class,
                phone: form.phone.trim(),
                ...(form.dob ? { dob: form.dob } : {}),
                ...(age !== undefined ? { age } : {}),
                ...(photoUrl ? { photoUrl } : {}),
            };

            if (modal === 'add') await addStudent(payload);
            else if (modal === 'edit' && editId) await updateStudent(editId, payload);
            closeModal();
        } catch { setFormError('Failed to save. Please try again.'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => { await deleteStudent(id); setDeleteConfirm(null); };

    const openDetail = async (s: Student) => {
        setDetailStudent(s);
        setDetailLoading(true);
        try { setDetailAttendance(await getStudentAttendance(s.id)); }
        finally { setDetailLoading(false); }
    };
    const closeDetail = () => { setDetailStudent(null); setDetailAttendance([]); };

    const filtered = students.filter(s =>
        (s.name.toLowerCase().includes(search.toLowerCase()) || s.class.toLowerCase().includes(search.toLowerCase())) &&
        (!classFilter || s.class === classFilter)
    );

    const presentCount = detailAttendance.filter(r => r.status === 'present').length;
    const absentCount = detailAttendance.filter(r => r.status === 'absent').length;
    const pct = detailAttendance.length ? Math.round((presentCount / detailAttendance.length) * 100) : null;

    // Class breakdown for summary
    const classBreakdown = CLASSES.map(c => ({
        cls: c,
        count: students.filter(s => s.class === c).length,
        color: CLASS_COLORS[c] ?? { bg: '#EEF2FF', color: '#3730A3' },
    })).filter(x => x.count > 0);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {/* Topbar */}
                <div className="topbar">
                    <div>
                        <div className="topbar-title">👥 Students</div>
                        <div className="topbar-meta">{students.length} registered students</div>
                    </div>
                    <button className="btn btn-primary" onClick={openAdd}>➕ Add Student</button>
                </div>

                {/* Class summary pills */}
                {classBreakdown.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                        <button
                            onClick={() => setClassFilter('')}
                            style={{
                                padding: '5px 14px', borderRadius: 999, fontWeight: 600, fontSize: 12,
                                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                background: !classFilter ? '#4F46E5' : '#E2E8F0',
                                color: !classFilter ? 'white' : '#64748B',
                                transition: 'all 0.15s',
                            }}
                        >All ({students.length})</button>
                        {classBreakdown.map(({ cls, count, color }) => (
                            <button key={cls}
                                onClick={() => setClassFilter(cls === classFilter ? '' : cls)}
                                style={{
                                    padding: '5px 14px', borderRadius: 999, fontWeight: 600, fontSize: 12,
                                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                    background: classFilter === cls ? color.color : color.bg,
                                    color: classFilter === cls ? 'white' : color.color,
                                    transition: 'all 0.15s',
                                }}
                            >Class {cls} ({count})</button>
                        ))}
                    </div>
                )}

                {/* Search bar */}
                <div className="card" style={{ marginBottom: 24, padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div className="search-wrapper">
                            <span className="search-icon">🔍</span>
                            <input className="search-input" placeholder="Search by name or class..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 300 }} />
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            Showing <strong>{filtered.length}</strong> of <strong>{students.length}</strong> students
                        </span>
                    </div>
                </div>

                {/* Student Cards Grid */}
                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">👥</div>
                        <div className="empty-state-text">No students found</div>
                        <div className="empty-state-sub">Try a different search or add a new student.</div>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: 20,
                    }}>
                        {filtered.map(s => (
                            <StudentCard
                                key={s.id}
                                student={s}
                                onView={() => openDetail(s)}
                                onEdit={() => openEdit(s)}
                                onDelete={() => setDeleteConfirm(s.id)}
                            />
                        ))}
                    </div>
                )}

                {/* ───── Student Detail Modal ───── */}
                {detailStudent && (
                    <div className="modal-overlay" onClick={closeDetail}>
                        <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <span className="modal-title">📋 Student Profile</span>
                                <button className="modal-close" onClick={closeDetail}>✕</button>
                            </div>

                            {/* Hero photo */}
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                {detailStudent.photoUrl ? (
                                    <img src={detailStudent.photoUrl} alt={detailStudent.name}
                                        style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', border: '4px solid #EEF2FF', boxShadow: '0 4px 20px rgba(79,70,229,0.2)' }} />
                                ) : (
                                    <div style={{
                                        width: 110, height: 110, borderRadius: '50%', margin: '0 auto',
                                        background: 'linear-gradient(135deg, #818CF8, #4F46E5)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 48, color: 'white', fontWeight: 800,
                                        boxShadow: '0 4px 20px rgba(79,70,229,0.3)',
                                    }}>{detailStudent.name.charAt(0)}</div>
                                )}
                                <div style={{ fontWeight: 800, fontSize: 22, marginTop: 12, color: '#0F172A' }}>{detailStudent.name}</div>
                                <span style={{
                                    display: 'inline-block', marginTop: 6, padding: '4px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                                    background: CLASS_COLORS[detailStudent.class]?.bg ?? '#EEF2FF',
                                    color: CLASS_COLORS[detailStudent.class]?.color ?? '#3730A3',
                                }}>Class {detailStudent.class}</span>
                            </div>

                            {/* Info pills */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>📞 Parent Phone</div>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{detailStudent.phone}</div>
                                </div>
                                {(detailStudent.dob || detailStudent.age) && (
                                    <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>🎂 Date of Birth</div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{detailStudent.dob ?? `${detailStudent.age} yrs`}</div>
                                    </div>
                                )}
                            </div>

                            {/* Attendance Stats */}
                            <div style={{ background: '#F8FAFC', borderRadius: 14, padding: 16, marginBottom: 8 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>📊 Attendance Summary</div>
                                {detailLoading ? (
                                    <div style={{ textAlign: 'center', padding: 12 }}><div className="spinner" style={{ borderTopColor: '#4F46E5', borderColor: 'rgba(79,70,229,0.2)', margin: '0 auto' }} /></div>
                                ) : detailAttendance.length === 0 ? (
                                    <div style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center' }}>No attendance records yet.</div>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                                            <div style={{ background: '#DCFCE7', borderRadius: 12, padding: '14px 8px', textAlign: 'center' }}>
                                                <div style={{ fontSize: 28, fontWeight: 800, color: '#16A34A' }}>{presentCount}</div>
                                                <div style={{ fontSize: 11, color: '#15803D', fontWeight: 600 }}>Present</div>
                                            </div>
                                            <div style={{ background: '#FEE2E2', borderRadius: 12, padding: '14px 8px', textAlign: 'center' }}>
                                                <div style={{ fontSize: 28, fontWeight: 800, color: '#DC2626' }}>{absentCount}</div>
                                                <div style={{ fontSize: 11, color: '#B91C1C', fontWeight: 600 }}>Absent</div>
                                            </div>
                                            <div style={{ background: '#EEF2FF', borderRadius: 12, padding: '14px 8px', textAlign: 'center' }}>
                                                <div style={{ fontSize: 28, fontWeight: 800, color: '#4F46E5' }}>{pct}%</div>
                                                <div style={{ fontSize: 11, color: '#4F46E5', fontWeight: 600 }}>Rate</div>
                                            </div>
                                        </div>
                                        {/* Attendance bar */}
                                        <div style={{ background: '#FEE2E2', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                                            <div style={{ background: 'linear-gradient(90deg, #10B981, #34D399)', height: '100%', width: `${pct}%`, borderRadius: 999, transition: 'width 0.6s ease' }} />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="modal-actions" style={{ marginTop: 16 }}>
                                <button className="btn btn-ghost" onClick={closeDetail}>Close</button>
                                <button className="btn btn-primary" onClick={() => { closeDetail(); openEdit(detailStudent); }}>✏️ Edit Student</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ───── Add / Edit Modal ───── */}
                {modal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <span className="modal-title">{modal === 'add' ? '➕ Add Student' : '✏️ Edit Student'}</span>
                                <button className="modal-close" onClick={closeModal}>✕</button>
                            </div>

                            {/* Photo picker */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                <div onClick={() => fileInputRef.current?.click()} style={{
                                    width: 100, height: 100, borderRadius: '50%',
                                    border: '3px dashed #818CF8', overflow: 'hidden',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', background: '#F0F4FF',
                                    transition: 'border-color 0.2s, background 0.2s',
                                }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#E0E7FF'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#F0F4FF'; }}
                                >
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ textAlign: 'center', color: '#818CF8' }}>
                                            <div style={{ fontSize: 28 }}>📷</div>
                                            <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>ADD PHOTO</div>
                                        </div>
                                    )}
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                                {photoPreview && (
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}>✕ Remove</button>
                                )}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Arun Kumar" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Class *</label>
                                    <select className="form-input" value={form.class} onChange={e => setForm({ ...form, class: e.target.value })}>
                                        <option value="">Select class...</option>
                                        {CLASSES.map(c => (
                                            <option key={c} value={c}>Class {c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Parent Phone (optional)</label>
                                    <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date of Birth</label>
                                    <input
                                        className="form-input"
                                        type="date"
                                        value={form.dob}
                                        onChange={e => setForm({ ...form, dob: e.target.value })}
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            {formError && (
                                <div style={{ color: '#991B1B', fontSize: 13, background: '#FEE2E2', borderRadius: 8, padding: '10px 14px', marginTop: 4 }}>
                                    ⚠️ {formError}
                                </div>
                            )}
                            <div className="modal-actions">
                                <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                    {saving ? <span className="spinner" /> : (modal === 'add' ? '💾 Save Student' : '✅ Update Student')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ───── Delete Confirm ───── */}
                {deleteConfirm && (
                    <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                        <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <span className="modal-title">🗑️ Delete Student</span>
                                <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
                            </div>
                            <p style={{ color: '#64748B', lineHeight: 1.6 }}>Are you sure you want to delete this student? This cannot be undone.</p>
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
