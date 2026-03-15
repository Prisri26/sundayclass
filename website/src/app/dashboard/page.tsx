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
    const { activeChurch, activeChurchId, activeMembership, branding, multiTenantEnabled } = useChurch();
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const today = getTodayDate();

    useEffect(() => {
        if (!loading && !user) router.replace('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (!user || !activeChurchId || !activeMembership) return;
        const unsubStudents = subscribeStudents(setStudents, activeChurchId ?? undefined);
        const unsubAttendance = subscribeAttendance(setAttendance, activeChurchId ?? undefined);
        return () => {
            unsubStudents();
            unsubAttendance();
        };
    }, [user, activeChurchId, activeMembership]);

    if (loading || !user) {
        return <div className="loading-page"><div className="spinner" /></div>;
    }

    const todayRecords = attendance.filter((record) => record.date === today);
    const presentToday = todayRecords.filter((record) => record.status === 'present').length;
    const absentToday = todayRecords.filter((record) => record.status === 'absent').length;
    const totalStudents = students.length;
    const attendancePercent = totalStudents > 0 && todayRecords.length > 0
        ? Math.round((presentToday / totalStudents) * 100)
        : 0;

    const dateMap: Record<string, { date: string; Present: number; Absent: number }> = {};
    attendance.forEach((record) => {
        if (!dateMap[record.date]) dateMap[record.date] = { date: record.date, Present: 0, Absent: 0 };
        if (record.status === 'present') dateMap[record.date].Present += 1;
        else dateMap[record.date].Absent += 1;
    });
    const chartData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);

    const pieData = [
        { name: 'Present', value: presentToday, color: '#10B981' },
        { name: 'Absent', value: Math.max(0, totalStudents - presentToday), color: '#EF4444' },
    ];

    const workspaceName = branding?.churchDisplayName || activeChurch?.name || 'your church workspace';
    const welcomeTitle = branding?.welcomeTitle || `Welcome to ${workspaceName}`;
    const welcomeSubtitle = branding?.welcomeSubtitle || 'Track attendance, watch center activity, and keep your ministry team aligned each Sunday.';

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="dashboard-shell">
                    <section className="dashboard-hero">
                        <div className="dashboard-hero-grid">
                            <div>
                                <div className="dashboard-hero-eyebrow">Church Dashboard</div>
                                <div className="dashboard-hero-title">{welcomeTitle}</div>
                                <div className="dashboard-hero-copy">{welcomeSubtitle}</div>
                                <div className="dashboard-hero-meta">
                                    <div className="dashboard-chip">⛪ {workspaceName}</div>
                                    <div className="dashboard-chip">🧭 {(activeMembership?.role || 'viewer').replace('_', ' ')}</div>
                                    <div className="dashboard-chip is-soft">📅 {today}</div>
                                </div>
                            </div>

                            <div className="dashboard-hero-panel">
                                <div className="dashboard-hero-panel-title">Today at a glance</div>
                                <div className="dashboard-hero-panel-list">
                                    <div className="dashboard-hero-panel-item">
                                        <div className="dashboard-hero-panel-label">Total students</div>
                                        <div className="dashboard-hero-panel-value">{totalStudents}</div>
                                    </div>
                                    <div className="dashboard-hero-panel-item">
                                        <div className="dashboard-hero-panel-label">Marked present</div>
                                        <div className="dashboard-hero-panel-value">{presentToday}</div>
                                    </div>
                                    <div className="dashboard-hero-panel-item">
                                        <div className="dashboard-hero-panel-label">Attendance rate</div>
                                        <div className="dashboard-hero-panel-value">{attendancePercent}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {multiTenantEnabled && !activeMembership && (
                        <div className="card">
                            <div className="empty-state">
                                <div className="empty-state-icon">⛪</div>
                                <div className="empty-state-text">No church membership linked yet</div>
                                <div className="empty-state-sub">Ask your church admin to add your UID in the Members page before using the dashboard.</div>
                            </div>
                        </div>
                    )}

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

                    <div className="dashboard-content-grid">
                        <div className="dashboard-stack">
                            <section className="card dashboard-section-card">
                                <div className="dashboard-section-head">
                                    <div>
                                        <div className="dashboard-section-title">Weekly attendance trend</div>
                                        <div className="dashboard-section-copy">A clear look at how attendance is moving across your most recent Sundays.</div>
                                    </div>
                                    <div className="dashboard-mini-stat">
                                        <div className="dashboard-mini-stat-value">{chartData.length}</div>
                                        <div className="dashboard-mini-stat-label">Tracked days</div>
                                    </div>
                                </div>
                                {chartData.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📊</div>
                                        <div className="empty-state-text">No data yet</div>
                                        <div className="empty-state-sub">Attendance will appear here after teachers mark it.</div>
                                    </div>
                                ) : (
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 12, right: 10, left: -12, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E7EEF6" />
                                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="Present" fill="#10B981" radius={[8, 8, 0, 0]} />
                                                <Bar dataKey="Absent" fill="#EF4444" radius={[8, 8, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </section>

                            <section className="card dashboard-section-card">
                                <div className="dashboard-section-head">
                                    <div>
                                        <div className="dashboard-section-title">Sunday readiness</div>
                                        <div className="dashboard-section-copy">A simple operational snapshot before the ministry starts marking attendance.</div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gap: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 18, background: '#F8FBFF', border: '1px solid #E2E8F0' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'var(--text)' }}>Attendance recorded today</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>How many student records are already marked for today.</div>
                                        </div>
                                        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary-dark)' }}>{todayRecords.length}</div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 18, background: '#F8FBFF', border: '1px solid #E2E8F0' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'var(--text)' }}>Students pending</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Students still not marked for today.</div>
                                        </div>
                                        <div style={{ fontSize: 28, fontWeight: 900, color: '#B91C1C' }}>{Math.max(totalStudents - todayRecords.length, 0)}</div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <section className="card dashboard-section-card">
                            <div className="dashboard-section-head">
                                <div>
                                    <div className="dashboard-section-title">Today&apos;s breakdown</div>
                                    <div className="dashboard-section-copy">See the balance between present and absent students at a glance.</div>
                                </div>
                                <div className="dashboard-mini-stat">
                                    <div className="dashboard-mini-stat-value">{attendancePercent}%</div>
                                    <div className="dashboard-mini-stat-label">Attendance</div>
                                </div>
                            </div>
                            {totalStudents === 0 ? (
                                <div className="empty-state" style={{ padding: '20px' }}>
                                    <div className="empty-state-icon">👥</div>
                                    <div className="empty-state-sub">No students yet</div>
                                </div>
                            ) : (
                                <>
                                    <div className="chart-container" style={{ height: 240 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={92} dataKey="value" paddingAngle={5}>
                                                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div style={{ display: 'grid', gap: 12, marginTop: 6 }}>
                                        {pieData.map((data) => (
                                            <div
                                                key={data.name}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '12px 14px',
                                                    borderRadius: 16,
                                                    background: '#F8FBFF',
                                                    border: '1px solid #E2E8F0',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: data.color }} />
                                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{data.name}</span>
                                                </div>
                                                <strong style={{ fontSize: 18, color: 'var(--text)' }}>{data.value}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
