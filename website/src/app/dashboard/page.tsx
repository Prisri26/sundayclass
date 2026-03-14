'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import Sidebar from '../../components/Sidebar';
import { subscribeStudents, subscribeAttendance, Student, AttendanceRecord, getTodayDate } from '../../lib/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const { activeChurchId } = useChurch();
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const today = getTodayDate();

    useEffect(() => {
        if (!loading && !user) router.replace('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        const unsub1 = subscribeStudents(setStudents, activeChurchId ?? undefined);
        const unsub2 = subscribeAttendance(setAttendance, activeChurchId ?? undefined);
        return () => { unsub1(); unsub2(); };
    }, [user, activeChurchId]);

    if (loading || !user) {
        return <div className="loading-page"><div className="spinner" /></div>;
    }

    const todayRecords = attendance.filter((r) => r.date === today);
    const presentToday = todayRecords.filter((r) => r.status === 'present').length;
    const absentToday = todayRecords.filter((r) => r.status === 'absent').length;
    const totalStudents = students.length;
    const attendancePercent = totalStudents > 0 && todayRecords.length > 0
        ? Math.round((presentToday / totalStudents) * 100)
        : 0;

    // Build weekly chart data (last 7 dates with attendance)
    const dateMap: Record<string, { date: string; Present: number; Absent: number }> = {};
    attendance.forEach((r) => {
        if (!dateMap[r.date]) dateMap[r.date] = { date: r.date, Present: 0, Absent: 0 };
        if (r.status === 'present') dateMap[r.date].Present++;
        else dateMap[r.date].Absent++;
    });
    const chartData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);

    const pieData = [
        { name: 'Present', value: presentToday, color: '#10B981' },
        { name: 'Absent', value: Math.max(0, totalStudents - presentToday), color: '#EF4444' },
    ];

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {/* Topbar */}
                <div className="topbar">
                    <div>
                        <div className="topbar-title">📊 Dashboard</div>
                        <div className="topbar-meta">Real-time attendance overview</div>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg)', padding: '8px 14px', borderRadius: '8px' }}>
                        📅 {today}
                    </div>
                </div>

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#EEF2FF' }}>👥</div>
                        <div>
                            <div className="stat-num">{totalStudents}</div>
                            <div className="stat-label">Total Students</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#D1FAE5' }}>✅</div>
                        <div>
                            <div className="stat-num" style={{ color: 'var(--present)' }}>{presentToday}</div>
                            <div className="stat-label">Present Today</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#FEE2E2' }}>❌</div>
                        <div>
                            <div className="stat-num" style={{ color: 'var(--absent)' }}>{absentToday}</div>
                            <div className="stat-label">Absent Today</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#FEF3C7' }}>📈</div>
                        <div>
                            <div className="stat-num" style={{ color: '#D97706' }}>{attendancePercent}%</div>
                            <div className="stat-label">Attendance Rate</div>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                    {/* Bar Chart */}
                    <div className="card">
                        <div className="card-title">📅 Weekly Attendance Trend</div>
                        {chartData.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📊</div>
                                <div className="empty-state-text">No data yet</div>
                                <div className="empty-state-sub">Attendance will appear here after teachers mark it</div>
                            </div>
                        ) : (
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="Present" fill="#10B981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Absent" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Pie Chart */}
                    <div className="card">
                        <div className="card-title">🍩 Today&apos;s Breakdown</div>
                        {totalStudents === 0 ? (
                            <div className="empty-state" style={{ padding: '20px' }}>
                                <div className="empty-state-icon">👥</div>
                                <div className="empty-state-sub">No students yet</div>
                            </div>
                        ) : (
                            <>
                                <div className="chart-container" style={{ height: 200 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={4}>
                                                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '8px' }}>
                                    {pieData.map((d) => (
                                        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                                            <span style={{ color: 'var(--text-secondary)' }}>{d.name}: </span>
                                            <strong>{d.value}</strong>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
