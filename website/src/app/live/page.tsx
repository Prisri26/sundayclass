'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { subscribeSpotlight, SpotlightData, clearSpotlight } from '../../lib/api';
import { useChurch } from '../../context/ChurchContext';

export default function LivePage() {
    const { activeChurchId, activeMembership, activeChurch, branding, multiTenantEnabled } = useChurch();
    const [spotlight, setSpotlight] = useState<SpotlightData | null>(null);
    const [imgErr, setImgErr] = useState(false);
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        if (multiTenantEnabled && (!activeChurchId || !activeMembership)) {
            setSpotlight(null);
            return;
        }

        return subscribeSpotlight((data) => {
            setSpotlight(data);
            setImgErr(false);
        }, activeChurchId ?? undefined);
    }, [activeChurchId, activeMembership, multiTenantEnabled]);

    const isActive = spotlight?.active && spotlight?.photoUrl;
    const workspaceName = branding?.churchDisplayName || activeChurch?.name || 'Church workspace';
    const liveSubtitle = useMemo(
        () => branding?.welcomeSubtitle || 'Project the current student spotlight beautifully for your church gathering.',
        [branding]
    );

    const handleReset = async () => {
        if (resetting) return;
        setResetting(true);
        try {
            await clearSpotlight(activeChurchId ?? undefined);
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <section className="admin-hero">
                    <div className="admin-hero-grid">
                        <div>
                            <div className="admin-hero-eyebrow">Live Feed</div>
                            <div className="admin-hero-title">Run a polished live spotlight screen for your church</div>
                            <div className="admin-hero-copy">{liveSubtitle}</div>
                            <div className="admin-hero-actions">
                                <div className="admin-hero-chip">📺 {workspaceName}</div>
                                <div className="admin-hero-chip">{isActive ? '🔴 Live now' : '⚪ Waiting'}</div>
                            </div>
                        </div>
                        <div className="admin-hero-panel">
                            <div className="admin-hero-panel-title">Live status</div>
                            <div className="admin-hero-panel-list">
                                <div className="admin-hero-panel-item">
                                    <div className="admin-hero-panel-label">Current mode</div>
                                    <div className="admin-hero-panel-value">{isActive ? 'Live' : 'Idle'}</div>
                                </div>
                                <div className="admin-hero-panel-item">
                                    <div className="admin-hero-panel-label">Student name</div>
                                    <div className="admin-hero-panel-value" style={{ fontSize: 18 }}>
                                        {spotlight?.studentName || 'None'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {multiTenantEnabled && !activeMembership ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">🔒</div>
                            <div className="empty-state-text">No church membership linked yet</div>
                            <div className="empty-state-sub">Ask your church admin to add your UID in the Members page.</div>
                        </div>
                    </div>
                ) : (
                    <div
                        className="card"
                        style={{
                            minHeight: 'calc(100vh - 250px)',
                            padding: 28,
                            background:
                                'radial-gradient(circle at top right, rgba(255,255,255,0.12), transparent 18%), linear-gradient(135deg, #0F0C29 0%, #302B63 58%, #1E1B4B 100%)',
                            color: 'white',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: isActive ? '#EF4444' : 'rgba(255,255,255,0.35)' }} />
                                <div style={{ fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)', fontSize: 12 }}>
                                    {isActive ? 'Live spotlight' : 'Waiting for spotlight'}
                                </div>
                            </div>
                            {isActive && (
                                <button className="btn btn-ghost" onClick={handleReset} disabled={resetting} style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)' }}>
                                    {resetting ? 'Resetting...' : 'Clear Live'}
                                </button>
                            )}
                        </div>

                        {isActive ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 0.95fr) minmax(0, 1.05fr)', gap: 28, alignItems: 'center', minHeight: '100%' }}>
                                <div style={{ display: 'grid', placeItems: 'center' }}>
                                    {spotlight?.photoUrl && !imgErr ? (
                                        <img
                                            src={spotlight.photoUrl}
                                            alt={spotlight.studentName}
                                            onError={() => setImgErr(true)}
                                            style={{
                                                width: 'min(100%, 420px)',
                                                aspectRatio: '1 / 1',
                                                objectFit: 'cover',
                                                borderRadius: '50%',
                                                border: '8px solid rgba(196,181,253,0.86)',
                                                boxShadow: '0 0 70px rgba(167,139,250,0.35)',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: 'min(100%, 420px)',
                                                aspectRatio: '1 / 1',
                                                borderRadius: '50%',
                                                display: 'grid',
                                                placeItems: 'center',
                                                background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                                                border: '8px solid rgba(196,181,253,0.86)',
                                                boxShadow: '0 0 70px rgba(167,139,250,0.35)',
                                                fontSize: 'clamp(90px, 12vw, 160px)',
                                                fontWeight: 900,
                                            }}
                                        >
                                            {spotlight?.studentName?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.74)', marginBottom: 18 }}>
                                        Jesus Loves
                                    </div>
                                    <div style={{ fontSize: 'clamp(44px, 6vw, 92px)', fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.05em', marginBottom: 16 }}>
                                        {spotlight?.studentName}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 'clamp(24px, 3vw, 42px)',
                                            fontWeight: 800,
                                            background: 'linear-gradient(90deg, #F9A8D4, #C084FC, #818CF8)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            marginBottom: 24,
                                        }}
                                    >
                                        the most! ❤️
                                    </div>
                                    <div style={{ maxWidth: 520, color: 'rgba(255,255,255,0.76)', fontSize: 16, lineHeight: 1.75 }}>
                                        Celebrate the student on the big screen while the church watches the live feed with a clean, branded spotlight view.
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ minHeight: 440, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 20 }}>
                                <div>
                                    <div style={{ fontSize: 80, marginBottom: 24, opacity: 0.55 }}>✝️</div>
                                    <div style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 900, marginBottom: 12 }}>
                                        Jesus Loves Everyone
                                    </div>
                                    <div style={{ fontSize: 17, color: 'rgba(255,255,255,0.62)', maxWidth: 560, lineHeight: 1.8 }}>
                                        Waiting for a teacher to capture the next spotlight student from the mobile app.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
