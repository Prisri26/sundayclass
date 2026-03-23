'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import Sidebar from '../../components/Sidebar';
import { getAttendance, getStudentCenterLabel, getStudents, AttendanceRecord, Student } from '../../lib/api';

export default function ReportsPage() {
    const { user, loading } = useAuth();
    const { activeChurchId, activeMembership, activeChurch, branding, multiTenantEnabled } = useChurch();
    const router = useRouter();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [exporting, setExporting] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        if (!loading && !user) router.replace('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (!user || !activeChurchId || !activeMembership) return;
        Promise.all([
            getAttendance(activeChurchId ?? undefined),
            getStudents(activeChurchId ?? undefined)
        ]).then(([att, stu]) => {
            setRecords(att);
            setStudents(stu);
        });
    }, [user, activeChurchId, activeMembership]);

    if (loading || !user) return <div className="loading-page"><div className="spinner" /></div>;

    const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

    const filtered = records.filter((r) => {
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo && r.date > dateTo) return false;
        return true;
    });

    const buildRows = () =>
        filtered.map((r) => {
            const stu = studentMap[r.studentId];
            return {
                Date: r.date,
                'Student Name': stu?.name || 'Unknown',
                Center: stu ? getStudentCenterLabel(stu) : '',
                Status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
            };
        });

    const exportCSV = () => {
        setExporting(true);
        const rows = buildRows();
        const headers = Object.keys(rows[0] || { Date: '', 'Student Name': '', Center: '', Status: '' });
        const csv = [
            headers.join(','),
            ...rows.map((r) => headers.map((h) => `"${(r as any)[h]}"`).join(',')),
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setExporting(false);
    };

    const exportExcel = async () => {
        setExporting(true);
        try {
            const xlsx = await import('xlsx');
            const rows = buildRows();
            const ws = xlsx.utils.json_to_sheet(rows);
            const wb = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(wb, ws, 'Attendance');
            // Style column widths
            ws['!cols'] = [{ wch: 12 }, { wch: 24 }, { wch: 16 }, { wch: 10 }];
            xlsx.writeFile(wb, `attendance_report_${new Date().toISOString().split('T')[0]}.xlsx`);
        } finally {
            setExporting(false);
        }
    };

    // Summary stats
    const presentCount = filtered.filter((r) => r.status === 'present').length;
    const absentCount = filtered.filter((r) => r.status === 'absent').length;
    const uniqueDates = [...new Set(filtered.map((r) => r.date))].length;
    const uniqueStudents = new Set(filtered.map((r) => r.studentId)).size;
    const growthRate = filtered.length > 0 ? Math.round((presentCount / filtered.length) * 100) : 0;
    const workspaceName = branding?.churchDisplayName || activeChurch?.name || 'your church workspace';

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="studio-page">
                    <section className="studio-head">
                        <div className="studio-head-copy">
                            <div className="studio-kicker">Reports & analytics</div>
                            <h1 className="studio-title">Reports and Analytics</h1>
                            <p className="studio-copy">Track ministry attendance patterns and center performance over time. A comprehensive view of spiritual engagement across your workspace.</p>
                        </div>
                        <div className="studio-head-actions">
                            <button className="studio-action is-soft" type="button">{workspaceName}</button>
                            <button className="studio-action" type="button">Export</button>
                        </div>
                    </section>

                {multiTenantEnabled && !activeMembership ? (
                    <div className="studio-panel studio-empty">No church membership linked yet. Ask your church admin to add your UID in the Members page.</div>
                ) : (
                <>
                <section className="studio-metrics">
                    <div className="studio-metric">
                        <div className="studio-metric-label">Total attendance</div>
                        <div className="studio-metric-value">{filtered.length.toLocaleString()}</div>
                    </div>
                    <div className="studio-metric">
                        <div className="studio-metric-label">Growth rate</div>
                        <div className="studio-metric-value">{growthRate}%</div>
                    </div>
                    <div className="studio-metric">
                        <div className="studio-metric-label">Top center</div>
                        <div className="studio-metric-value">{students[0] ? getStudentCenterLabel(students[0]) : '—'}</div>
                    </div>
                    <div className="studio-metric">
                        <div className="studio-metric-label">Students covered</div>
                        <div className="studio-metric-value">{uniqueStudents}</div>
                    </div>
                </section>

                <section className="studio-panel">
                    <div className="studio-section-title">Attendance Trends</div>
                    <div className="studio-section-copy">Review the last quarter of ministry attendance and export the filtered records when needed.</div>
                    <div className="soft-panel" style={{ marginTop: 20, marginBottom: '24px' }}>
                    <div className="toolbar" style={{ marginBottom: 0 }}>
                        <div className="filter-bar">
                            <span className="filter-label">From:</span>
                            <input type="date" className="form-input" style={{ width: 'auto' }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                            <span className="filter-label">To:</span>
                            <input type="date" className="form-input" style={{ width: 'auto' }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                            {(dateFrom || dateTo) && (
                                <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>✕ Clear</button>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="studio-action is-soft" onClick={exportCSV} disabled={exporting || filtered.length === 0}>
                                {exporting ? <span className="spinner" style={{ borderTopColor: 'var(--primary)' }} /> : '📄'} Export CSV
                            </button>
                            <button className="studio-action" onClick={exportExcel} disabled={exporting || filtered.length === 0}>
                                {exporting ? <span className="spinner" /> : '📊'} Export Excel
                            </button>
                        </div>
                    </div>
                    </div>
                    {filtered.length === 0 ? (
                        <div className="studio-empty">No records in the selected range. Adjust the dates or mark attendance first.</div>
                    ) : (
                        <>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', marginTop: '18px' }}>
                                Previewing {filtered.length} records
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
                                        {filtered.slice(0, 50).map((r) => {
                                            const stu = studentMap[r.studentId];
                                            return (
                                                <tr key={r.id}>
                                                    <td>{r.date}</td>
                                                    <td>
                                                        <div className="name-cell">
                                                            <div className="avatar">{(stu?.name || '?').charAt(0)}</div>
                                                            <span style={{ fontWeight: 600 }}>{stu?.name || 'Unknown'}</span>
                                                        </div>
                                                    </td>
                                                    <td>{stu ? getStudentCenterLabel(stu) : '—'}</td>
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
                                {filtered.length > 50 && (
                                    <div style={{ textAlign: 'center', padding: '14px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                        Showing first 50 of {filtered.length} records. Export to see all.
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </section>
                </>
                )}
                </div>
            </main>
        </div>
    );
}
