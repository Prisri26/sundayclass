'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import Sidebar from '../../components/Sidebar';
import { subscribeAttendance, subscribeStudents, AttendanceRecord, Student } from '../../lib/api';

export default function AttendancePage() {
    const { user, loading } = useAuth();
    const { activeChurchId } = useChurch();
    const router = useRouter();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        if (!loading && !user) router.replace('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        const u1 = subscribeAttendance(setRecords, activeChurchId ?? undefined);
        const u2 = subscribeStudents(setStudents, activeChurchId ?? undefined);
        return () => { u1(); u2(); };
    }, [user, activeChurchId]);

    if (loading || !user) return <div className="loading-page"><div className="spinner" /></div>;

    const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

    const filtered = records.filter((r) => {
        if (dateFilter && r.date !== dateFilter) return false;
        if (statusFilter && r.status !== statusFilter) return false;
        return true;
    });

    // Unique dates for the date picker
    const dates = [...new Set(records.map((r) => r.date))].sort().reverse();

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="topbar">
                    <div>
                        <div className="topbar-title">📋 Attendance Records</div>
                        <div className="topbar-meta">{filtered.length} records</div>
                    </div>
                </div>

                <div className="card">
                    {/* Filters */}
                    <div className="toolbar" style={{ marginBottom: '20px' }}>
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

                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <div className="empty-state-text">No attendance records found</div>
                            <div className="empty-state-sub">Records appear here after teachers mark attendance on the mobile app.</div>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Student Name</th>
                                        <th>Class</th>
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
                                                    {stu?.class ? (
                                                        <span style={{ background: '#EEF2FF', color: 'var(--primary)', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
                                                            {stu.class}
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
                    )}
                </div>
            </main>
        </div>
    );
}
