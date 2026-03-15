'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import Sidebar from '../../components/Sidebar';
import { getStudentCenterLabel, subscribeAttendance, subscribeStudents, AttendanceRecord, Student } from '../../lib/api';

export default function AttendancePage() {
    const { user, loading } = useAuth();
    const { activeChurchId, activeMembership, activeChurch, branding, multiTenantEnabled } = useChurch();
    const router = useRouter();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        if (!loading && !user) router.replace('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (!user || !activeChurchId || !activeMembership) return;
        const u1 = subscribeAttendance(setRecords, activeChurchId ?? undefined);
        const u2 = subscribeStudents(setStudents, activeChurchId ?? undefined);
        return () => { u1(); u2(); };
    }, [user, activeChurchId, activeMembership]);

    if (loading || !user) return <div className="loading-page"><div className="spinner" /></div>;

    const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

    const filtered = records.filter((r) => {
        if (dateFilter && r.date !== dateFilter) return false;
        if (statusFilter && r.status !== statusFilter) return false;
        return true;
    });

    // Unique dates for the date picker
    const dates = [...new Set(records.map((r) => r.date))].sort().reverse();
    const presentCount = filtered.filter((record) => record.status === 'present').length;
    const absentCount = filtered.filter((record) => record.status === 'absent').length;
    const uniqueStudents = new Set(filtered.map((record) => record.studentId)).size;
    const workspaceName = branding?.churchDisplayName || activeChurch?.name || 'your church workspace';

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <section className="admin-hero">
                    <div className="admin-hero-grid">
                        <div>
                            <div className="admin-hero-eyebrow">Attendance Records</div>
                            <div className="admin-hero-title">Review every marked Sunday attendance entry in one place</div>
                            <div className="admin-hero-copy">
                                Filter by day and status, verify which students were marked present or absent, and keep the church attendance history easy to audit.
                            </div>
                            <div className="admin-hero-actions">
                                <div className="admin-hero-chip">⛪ {workspaceName}</div>
                                <div className="admin-hero-chip">📋 {records.length} total records</div>
                            </div>
                        </div>
                        <div className="admin-hero-panel">
                            <div className="admin-hero-panel-title">Filter snapshot</div>
                            <div className="admin-hero-panel-list">
                                <div className="admin-hero-panel-item">
                                    <div className="admin-hero-panel-label">Visible records</div>
                                    <div className="admin-hero-panel-value">{filtered.length}</div>
                                </div>
                                <div className="admin-hero-panel-item">
                                    <div className="admin-hero-panel-label">Tracked Sundays</div>
                                    <div className="admin-hero-panel-value">{dates.length}</div>
                                </div>
                                <div className="admin-hero-panel-item">
                                    <div className="admin-hero-panel-label">Students covered</div>
                                    <div className="admin-hero-panel-value">{uniqueStudents}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="topbar">
                    <div>
                        <div className="topbar-title">📋 Attendance Records</div>
                        <div className="topbar-meta">{filtered.length} visible records</div>
                    </div>
                </div>

                {multiTenantEnabled && !activeMembership && (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">🔒</div>
                            <div className="empty-state-text">No church membership linked yet</div>
                            <div className="empty-state-sub">Ask your church admin to add your UID in the Members page.</div>
                        </div>
                    </div>
                )}

                {(!multiTenantEnabled || activeMembership) && <div className="card">
                    <div className="summary-grid">
                        <div className="summary-card">
                            <div className="summary-label">Visible records</div>
                            <div className="summary-value">{filtered.length}</div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-label">Present</div>
                            <div className="summary-value" style={{ color: 'var(--present)' }}>{presentCount}</div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-label">Absent</div>
                            <div className="summary-value" style={{ color: 'var(--absent)' }}>{absentCount}</div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-label">Dates tracked</div>
                            <div className="summary-value">{dates.length}</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="soft-panel" style={{ marginBottom: '20px' }}>
                    <div className="toolbar" style={{ marginBottom: 0 }}>
                        <div className="filter-bar">
                            <span className="filter-label">📅 Date:</span>
                            <select
                                className="form-input"
                                style={{ width: 'auto', padding: '8px 14px' }}
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            >
                                <option value="">All Dates</option>
                                {dates.map((d) => <option key={d}>{d}</option>)}
                            </select>

                            <span className="filter-label">🏷️ Status:</span>
                            <select
                                className="form-input"
                                style={{ width: 'auto', padding: '8px 14px' }}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                            </select>
                        </div>
                        {(dateFilter || statusFilter) && (
                            <button className="btn btn-ghost btn-sm" onClick={() => { setDateFilter(''); setStatusFilter(''); }}>
                                ✕ Clear Filters
                            </button>
                        )}
                    </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <div className="empty-state-text">No attendance records found</div>
                            <div className="empty-state-sub">Records appear here after teachers mark attendance on the mobile app.</div>
                        </div>
                    ) : (
                        <>
                        <div className="section-head" style={{ marginTop: 22 }}>
                            <div>
                                <div className="section-title">Attendance table</div>
                                <div className="section-copy">A live register of every marked student record for the selected filters.</div>
                            </div>
                        </div>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Student Name</th>
                                        <th>Center</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((r) => {
                                        const stu = studentMap[r.studentId];
                                        return (
                                            <tr key={r.id}>
                                                <td style={{ fontWeight: 500 }}>
                                                    📅 {r.date}
                                                </td>
                                                <td>
                                                    <div className="name-cell">
                                                        <div className="avatar">{(stu?.name || '?').charAt(0)}</div>
                                                        <span style={{ fontWeight: 600 }}>{stu?.name || 'Unknown'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {stu ? (
                                                        <span style={{ background: '#EEF2FF', color: 'var(--primary)', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
                                                            {getStudentCenterLabel(stu)}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                <td>
                                                    <span className={`badge badge-${r.status}`}>
                                                        {r.status === 'present' ? '✓' : '✗'} {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        </>
                    )}
                </div>}
            </main>
        </div>
    );
}
