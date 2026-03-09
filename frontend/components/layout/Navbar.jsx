'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn, getInitials } from '@/lib/utils'
import Button from '@/components/ui/Button'

const NAV_LINKS = {
    patient: [
        { href: '/patient/dashboard', label: 'Dashboard' },
        { href: '/doctors', label: 'Find Doctor' },
        { href: '/appointments', label: 'My Appointments' },
        { href: '/medical-records', label: 'Medical Records' },
        { href: '/notifications', label: 'Notifications' },
        { href: '/profile', label: 'Profile' },
    ],
    doctor: [
        { href: '/doctor/dashboard', label: 'Dashboard' },
        { href: '/doctor/appointments', label: 'Appointments' },
        { href: '/doctor/schedule', label: 'Schedule' },
        { href: '/doctor/patients', label: 'Patients' },
        { href: '/doctor/medical-records', label: 'Records' },
        { href: '/doctor/analytics', label: 'Analytics' },
        { href: '/doctor/notifications', label: 'Notifications' },
    ],
    admin: [
        { href: '/admin/dashboard', label: 'Dashboard' },
        { href: '/admin/doctors', label: 'Doctors' },
        { href: '/admin/users', label: 'Users' },
        { href: '/admin/queues/live', label: 'Live Queues' },
        { href: '/admin/analytics', label: 'Analytics' },
        { href: '/admin/audit-logs', label: 'Audit Logs' },
        { href: '/admin/settings/general', label: 'Settings' },
    ],
}

export default function Navbar() {
    const { user, logout } = useAuth()
    const pathname = usePathname()
    const links = NAV_LINKS[user?.role] || []

    return (
        <header className="sticky top-0 z-40 bg-surface border-b border-border shadow-1">
            <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* Brand */}
                <Link href="/" className="text-h3 font-semibold text-primary tracking-tight">
                    Qline
                </Link>

                {/* Nav links */}
                <nav className="hidden md:flex items-center gap-1">
                    {links.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'px-4 py-2 rounded-sm text-body font-medium transition-colors duration-200',
                                pathname.startsWith(href)
                                    ? 'bg-primary-soft text-primary'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-border'
                            )}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* User + logout */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary-soft text-primary text-caption font-semibold flex items-center justify-center">
                            {getInitials(user?.name)}
                        </span>
                        <span className="text-body text-text-primary font-medium hidden lg:block">
                            {user?.name}
                        </span>
                    </div>
                    <Button variant="secondary" size="sm" onClick={logout}>
                        Sign out
                    </Button>
                </div>
            </div>
        </header>
    )
}
