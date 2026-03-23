'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useChurch } from '../context/ChurchContext';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '▦' },
    { href: '/students', label: 'Students', icon: '◎' },
    { href: '/members', label: 'Members', icon: '◔' },
    { href: '/centers', label: 'Centers', icon: '⌂' },
    { href: '/attendance', label: 'Attendance', icon: '◷' },
    { href: '/reports', label: 'Reports', icon: '▤' },
    { href: '/live', label: 'Live Feed', icon: '✦' },
    { href: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { activeChurch, activeChurchId, branding, availableChurches, loading, multiTenantEnabled, setActiveChurchId } = useChurch();

    const workspaceName = branding?.churchDisplayName || activeChurch?.name || 'PrayLoom Workspace';
    const workspaceMeta = multiTenantEnabled
        ? availableChurches.length > 0
            ? `${availableChurches.length} church workspace${availableChurches.length > 1 ? 's' : ''}`
            : loading
                ? 'Loading church access...'
                : 'No church membership found yet'
        : 'Single church mode';

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-brand-mark">
                    {branding?.logoUrl ? (
                        <img
                            src={branding.logoUrl}
                            alt={workspaceName}
                            style={{ width: 28, height: 28, borderRadius: 10, objectFit: 'cover', background: 'rgba(255,255,255,0.16)' }}
                        />
                    ) : (
                        <span className="sidebar-brand-icon">PL</span>
                    )}
                </div>
                <div>
                    <div className="sidebar-brand-title">{branding?.shortName || 'PrayLoom'}</div>
                    <div className="sidebar-brand-sub">Sacred operations</div>
                </div>
            </div>

            <div className="sidebar-workspace-card">
                <div className="sidebar-workspace-eyebrow">{multiTenantEnabled ? 'Current Workspace' : 'Workspace'}</div>
                <div className="sidebar-workspace-title">{workspaceName}</div>
                <div className="sidebar-workspace-copy">{workspaceMeta}</div>

                {multiTenantEnabled && (
                    <select
                        className="form-input"
                        value={activeChurchId ?? ''}
                        onChange={(event) => setActiveChurchId(event.target.value || null)}
                        style={{ width: '100%' }}
                    >
                        {availableChurches.length > 0 ? (
                            availableChurches.map((church) => (
                                <option key={church.id} value={church.id}>
                                    {church.name}
                                </option>
                            ))
                        ) : (
                            <option value="">{loading ? 'Loading church access...' : 'No church access'}</option>
                        )}
                    </select>
                )}
            </div>

            <nav className="sidebar-nav">
                {navItems.map(({ href, label, icon }) => {
                    const active = pathname.startsWith(href);
                    return (
                        <Link key={href} href={href} className={`sidebar-link ${active ? 'active' : ''}`}>
                            <span className="sidebar-icon">{icon}</span>
                            {label}
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <button className="sidebar-logout" onClick={() => signOut(auth)}>
                    <span>↗</span> Sign Out
                </button>
                <div className="sidebar-footer-text">Powered by PrayLoom</div>
            </div>
        </aside>
    );
}
