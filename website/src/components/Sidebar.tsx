'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/students', label: 'Students', icon: '👥' },
    { href: '/attendance', label: 'Attendance', icon: '📋' },
    { href: '/reports', label: 'Reports', icon: '📑' },
    { href: '/live', label: 'Live Feed 🔴', icon: '📹' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <span className="sidebar-brand-icon">✝️</span>
                <div>
                    <div className="sidebar-brand-title">Sunday School</div>
                    <div className="sidebar-brand-sub">Attendance Manager</div>
                </div>
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
                    <span>🚪</span> Sign Out
                </button>
                <div className="sidebar-footer-text">🙏 Serving with faith</div>
            </div>
        </aside>
    );
}
