'use client';
import { useEffect, useState } from 'react';
import { subscribeSpotlight, SpotlightData, clearSpotlight } from '../../lib/api';

export default function LivePage() {
    const [spotlight, setSpotlight] = useState<SpotlightData | null>(null);
    const [imgErr, setImgErr] = useState(false);
    const [pulse, setPulse] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        setMounted(true);
        return subscribeSpotlight((data) => {
            setSpotlight(data);
            setImgErr(false);
            // Trigger pulse animation on new spotlight
            setPulse(true);
            setTimeout(() => setPulse(false), 800);
        });
    }, []);

    const isActive = spotlight?.active && spotlight?.photoUrl;

    const handleReset = async () => {
        if (resetting) return;
        setResetting(true);
        try {
            await clearSpotlight();
        } catch (err: any) {
            console.error('Failed to reset spotlight:', err);
            alert('Failed to reset. Make sure you are logged into the dashboard to have permission.');
        } finally {
            setResetting(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0F0C29, #302B63, #24243e)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden',
            position: 'relative',
        }}>
            {/* Animated background stars */}
            {mounted && (
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                    {[...Array(20)].map((_, i) => (
                        <div key={i} style={{
                            position: 'absolute',
                            width: Math.random() * 4 + 1,
                            height: Math.random() * 4 + 1,
                            borderRadius: '50%',
                            background: 'white',
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            opacity: Math.random() * 0.7 + 0.1,
                            animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite alternate`,
                            animationDelay: `${Math.random() * 3}s`,
                        }} />
                    ))}
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                @keyframes twinkle { from { opacity: 0.1; } to { opacity: 0.8; } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes heartbeat { 0%,100% { transform: scale(1); } 14% { transform: scale(1.15); } 28% { transform: scale(1); } 42% { transform: scale(1.08); } 70% { transform: scale(1); } }
                @keyframes glow { 0%,100% { box-shadow: 0 0 40px rgba(167,139,250,0.4), 0 0 80px rgba(139,92,246,0.2); } 50% { box-shadow: 0 0 80px rgba(167,139,250,0.8), 0 0 160px rgba(139,92,246,0.4); } }
                @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
                @keyframes slideIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                .reset-btn:hover { background: rgba(255,255,255,0.2) !important; opacity: 1 !important; transform: scale(1.05); }
            `}</style>

            {isActive ? (
                /* ─── SPOTLIGHT ACTIVE ─── */
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0,
                    animation: 'fadeInUp 0.6s ease forwards',
                    textAlign: 'center',
                    padding: '40px 20px',
                }}>
                    {/* Top label */}
                    <div style={{
                        fontSize: 'clamp(18px, 3vw, 28px)',
                        color: 'rgba(255,255,255,0.7)',
                        fontWeight: 700,
                        letterSpacing: 4,
                        textTransform: 'uppercase',
                        marginBottom: 32,
                        animation: 'slideIn 0.5s ease 0.1s both',
                    }}>
                        ✝️ &nbsp; Jesus Loves
                    </div>

                    {/* Photo with glowing ring */}
                    <div style={{ position: 'relative', marginBottom: 40 }}>
                        {/* Pulsing rings */}
                        <div style={{
                            position: 'absolute', inset: -16, borderRadius: '50%',
                            border: '3px solid rgba(167,139,250,0.6)',
                            animation: 'pulse-ring 2s ease-out infinite',
                        }} />
                        <div style={{
                            position: 'absolute', inset: -8, borderRadius: '50%',
                            border: '2px solid rgba(167,139,250,0.4)',
                            animation: 'pulse-ring 2s ease-out infinite',
                            animationDelay: '0.5s',
                        }} />

                        {/* Photo */}
                        {spotlight.photoUrl && !imgErr ? (
                            <img
                                src={spotlight.photoUrl}
                                alt={spotlight.studentName}
                                onError={() => setImgErr(true)}
                                style={{
                                    width: 'clamp(200px, 30vw, 380px)',
                                    height: 'clamp(200px, 30vw, 380px)',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '6px solid rgba(167,139,250,0.8)',
                                    animation: 'glow 3s ease-in-out infinite',
                                    display: 'block',
                                }}
                            />
                        ) : (
                            <div style={{
                                width: 'clamp(200px, 30vw, 380px)',
                                height: 'clamp(200px, 30vw, 380px)',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 'clamp(80px, 15vw, 160px)',
                                color: 'white', fontWeight: 800,
                                border: '6px solid rgba(167,139,250,0.8)',
                                animation: 'glow 3s ease-in-out infinite',
                            }}>
                                {spotlight.studentName?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Student Name */}
                    <div style={{
                        fontSize: 'clamp(36px, 8vw, 96px)',
                        fontWeight: 900,
                        color: 'white',
                        lineHeight: 1.1,
                        marginBottom: 16,
                        textShadow: '0 4px 30px rgba(167,139,250,0.5)',
                        animation: 'slideIn 0.5s ease 0.2s both',
                    }}>
                        {spotlight.studentName}
                    </div>

                    {/* "the most!" tagline */}
                    <div style={{
                        fontSize: 'clamp(22px, 4vw, 52px)',
                        fontWeight: 800,
                        background: 'linear-gradient(90deg, #F9A8D4, #C084FC, #818CF8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 40,
                        animation: 'slideIn 0.5s ease 0.35s both',
                    }}>
                        the most! ❤️
                    </div>

                    {/* Heartbeat emoji */}
                    <div style={{
                        fontSize: 'clamp(48px, 8vw, 90px)',
                        animation: 'heartbeat 1.5s ease infinite',
                    }}>
                        ❤️
                    </div>

                    {/* Live indicator & reset top right */}
                    <div style={{
                        position: 'fixed', top: 24, right: 24,
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, zIndex: 50
                    }}>
                        {/* Live badge */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'rgba(239,68,68,0.2)',
                            border: '1px solid rgba(239,68,68,0.5)',
                            borderRadius: 999, padding: '8px 18px',
                        }}>
                            <div style={{
                                width: 10, height: 10, borderRadius: '50%',
                                background: '#EF4444',
                                animation: 'heartbeat 1s ease infinite',
                            }} />
                            <span style={{ color: '#FCA5A5', fontWeight: 700, fontSize: 14, letterSpacing: 2 }}>LIVE</span>
                        </div>

                        {/* Reset button */}
                        <button
                            onClick={handleReset}
                            disabled={resetting}
                            className="reset-btn"
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                                padding: '6px 14px',
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 6,
                                opacity: 0.7,
                                transition: 'all 0.2s'
                            }}>
                            {resetting ? 'Resetting...' : '✕ Clear Live'}
                        </button>
                    </div>
                </div>
            ) : (
                /* ─── WAITING / OFFLINE STATE ─── */
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 80, marginBottom: 24, opacity: 0.5 }}>✝️</div>
                    <div style={{
                        fontSize: 'clamp(24px, 4vw, 48px)',
                        fontWeight: 800,
                        color: 'rgba(255,255,255,0.6)',
                        marginBottom: 12,
                    }}>
                        Jesus Loves Everyone
                    </div>
                    <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                        Waiting for teacher to start the spotlight...
                    </div>
                    <div style={{
                        marginTop: 40,
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 999, padding: '8px 20px',
                    }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, letterSpacing: 2, fontWeight: 600 }}>OFFLINE</span>
                    </div>
                </div>
            )}
        </div>
    );
}
