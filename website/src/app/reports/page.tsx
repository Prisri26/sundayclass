'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import Sidebar from '../../components/Sidebar';
import { getAttendance, getStudents, AttendanceRecord, Student } from '../../lib/api';

export default function ReportsPage() {
    const { user, loading } = useAuth();
    const { activeChurchId } = useChurch();
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
        if (!user) return;
        Promise.all([
            getAttendance(activeChurchId ?? undefined),
            getStudents(activeChurchId ?? undefined)
        ]).then(([att, stu]) => {
            setRecords(att);
            setStudents(stu);
        });
    }, [user, activeChurchId]);

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
                Class: stu?.class || '',
                Status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
            };
        });

    const exportCSV = () => {
        setExporting(true);
        const rows = buildRows();
        const headers = Object.keys(rows[0] || { Date: '', 'Student Name': '', Class: '', Status: '' });
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

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="topbar">
                    <div>
                        <div className="topbar-title">📑 Reports</div>
                        <div className="topbar-meta">Export attendance data as CSV or Excel</div>
                    </div>
                </div>

                {/* Summary Tiles */}
                <div className="stats-grid" style={{ marginBottom: '20px' }}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#EEF2FF' }}>📅</div>
                        <div><div className="stat-num">{uniqueDates}</div><div className="stat-label">Days Tracked</div></div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#D1FAE5' }}>✅</div>
                        <div><div className="stat-num" style={{ color: 'var(--present)' }}>{presentCount}</div><div className="stat-label">Total Present</div></div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#FEE2E2' }}>❌</div>
                        <div><div className="stat-num" style={{ color: 'var(--absent)' }}>{absentCount}</div><div className="stat-label">Total Absent</div></div>
                    </div>
                </div>

                <div className="card">
                    {/* Date Range Filters */}
                    <div className="toolbar" style={{ marginBottom: '24px' }}>
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
                            <button className="btn btn-ghost" onClick={exportCSV} disabled={exporting || filtered.length === 0}>
                                {exporting ? <span className="spinner" style={{ borderTopColor: 'var(--primary)' }} /> : '📄'} Export CSV
                            </button>
                            <button className="btn btn-success" onClick={exportExcel} disabled={exporting || filtered.length === 0}>
                                {exporting ? <span className="spinner" /> : '📊'} Export Excel
                            </button>
                        </div>
                    </div>

                    {/* Preview Table */}
                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📑</div>
                            <div className="empty-state-text">No records in selected range</div>
                            <div className="empty-state-sub">Adjust the date range or mark attendance first.</div>
                        </div>
                    ) : (
                        <>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                Previewing {filtered.length} records
                            </div>
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
                                                    <td>{stu?.class || '—'}</td>
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
                </div>
            </main>
        </div>
    );
}
