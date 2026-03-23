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
                <div className="studio-page">
                    <section className="studio-head">
                        <div className="studio-head-copy">
                            <div className="studio-kicker">Current workspace</div>
                            <h1 className="studio-title">{welcomeTitle}</h1>
                            <p className="studio-copy">{welcomeSubtitle}</p>
                        </div>
                        <div className="studio-head-actions">
                            <button className="studio-action is-soft" type="button">{today}</button>
                            <button className="studio-action" type="button">{workspaceName}</button>
                        </div>
                    </section>

                    {multiTenantEnabled && !activeMembership ? (
                        <div className="studio-panel studio-empty">
                            No church membership linked yet. Ask your church admin to add your UID in the Members page before using the dashboard.
                        </div>
                    ) : (
                        <>
                            <section className="studio-metrics">
                                <div className="studio-metric">
                                    <div className="studio-metric-label">Student count</div>
                                    <div className="studio-metric-value">{totalStudents}</div>
                                </div>
                                <div className="studio-metric">
                                    <div className="studio-metric-label">Present today</div>
                                    <div className="studio-metric-value">{presentToday}</div>
                                </div>
                                <div className="studio-metric">
                                    <div className="studio-metric-label">Absent today</div>
                                    <div className="studio-metric-value">{absentToday}</div>
                                </div>
                                <div className="studio-metric">
                                    <div className="studio-metric-label">Attendance rate</div>
                                    <div className="studio-metric-value">{attendancePercent}%</div>
                                </div>
                            </section>

                            <section className="studio-grid">
                                <div className="studio-stack">
                                    <div className="studio-panel">
                                        <div className="studio-panel-title">Attendance Overview</div>
                                        <div className="studio-panel-copy">Comparison of weekly participation across your most recent Sundays.</div>
                                        <div className="studio-chart-placeholder">
                                            {chartData.length === 0 ? (
                                                <div className="studio-empty">Attendance will appear here after teachers mark it.</div>
                                            ) : (
                                                <div className="studio-chart-area">
                                                    <ResponsiveContainer width="100%" height={224}>
                                                        <BarChart data={chartData} margin={{ top: 18, right: 0, left: -18, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#ece9fb" />
                                                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7e7997' }} tickLine={false} axisLine={false} />
                                                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#7e7997' }} tickLine={false} axisLine={false} />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Bar dataKey="Present" fill="#5346e4" radius={[8, 8, 0, 0]} />
                                                            <Bar dataKey="Absent" fill="#cdd2f6" radius={[8, 8, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="studio-panel">
                                        <div className="studio-section-title">Quick Actions</div>
                                        <div className="studio-section-copy">Move directly into the next administrative step for this Sunday.</div>
                                        <div className="studio-action-list">
                                            <div className="studio-action-row">
                                                <div>
                                                    <strong>Add Student</strong>
                                                    <span>Create a new student profile and assign a center.</span>
                                                </div>
                                                <span className="studio-action-arrow">→</span>
                                            </div>
                                            <div className="studio-action-row">
                                                <div>
                                                    <strong>Add Center</strong>
                                                    <span>Organize your next Sunday class location.</span>
                                                </div>
                                                <span className="studio-action-arrow">→</span>
                                            </div>
                                            <div className="studio-action-row">
                                                <div>
                                                    <strong>Invite Member</strong>
                                                    <span>Link teachers and volunteers to the workspace.</span>
                                                </div>
                                                <span className="studio-action-arrow">→</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="studio-stack">
                                    <div className="studio-panel">
                                        <div className="studio-section-title">Today at a glance</div>
                                        <div className="studio-section-copy">A quick operational check before ministry begins.</div>
                                        <div className="studio-activity-list">
                                            <div className="studio-activity-row">
                                                <div>
                                                    <strong>Attendance recorded today</strong>
                                                    <span>Student records already marked for {today}.</span>
                                                </div>
                                                <div className="studio-activity-meta">{todayRecords.length}</div>
                                            </div>
                                            <div className="studio-activity-row">
                                                <div>
                                                    <strong>Students pending</strong>
                                                    <span>Still waiting to be marked in the roster.</span>
                                                </div>
                                                <div className="studio-activity-meta">{Math.max(totalStudents - todayRecords.length, 0)}</div>
                                            </div>
                                            <div className="studio-activity-row">
                                                <div>
                                                    <strong>Active role</strong>
                                                    <span>Your current access within this church workspace.</span>
                                                </div>
                                                <div className="studio-activity-meta">{(activeMembership?.role || 'viewer').replace('_', ' ')}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="studio-panel">
                                        <div className="studio-section-title">Church activity feed</div>
                                        <div className="studio-section-copy">A calmer summary of what changed across your ministry this week.</div>
                                        <div className="studio-activity-list">
                                            <div className="studio-activity-row">
                                                <div>
                                                    <strong>Attendance closed for the last Sunday</strong>
                                                    <span>{presentToday} students present and {absentToday} absent across today&apos;s entries.</span>
                                                </div>
                                                <div className="studio-activity-meta">Today</div>
                                            </div>
                                            <div className="studio-activity-row">
                                                <div>
                                                    <strong>{workspaceName} branding is active</strong>
                                                    <span>Your workspace theme and welcome content are now live for the team.</span>
                                                </div>
                                                <div className="studio-activity-meta">Workspace</div>
                                            </div>
                                            <div className="studio-activity-row">
                                                <div>
                                                    <strong>Weekly participation snapshot</strong>
                                                    <span>{attendancePercent}% attendance rate with {chartData.length} tracked Sundays in the latest trend.</span>
                                                </div>
                                                <div className="studio-activity-meta">Insight</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
