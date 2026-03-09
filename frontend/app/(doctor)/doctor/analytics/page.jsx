'use client'

import { useEffect, useState } from 'react'
import { subDays, format } from 'date-fns'
import api from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import { StatCardSkeleton } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'

const SKELETONS = Array.from({ length: 4 })

function BarChart({ bars }) {
    const max = Math.max(...bars.map(b => b.value), 1)
    return (
        <div className="flex items-end gap-3 h-32">
            {bars.map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-caption font-semibold text-text-primary">{value}</span>
                    <div className="w-full rounded-t-sm transition-all duration-500"
                        style={{ height: `${Math.max(Math.round((value / max) * 100), 4)}%`, backgroundColor: color }} />
                    <span className="text-caption text-text-secondary text-center leading-tight">{label}</span>
                </div>
            ))}
        </div>
    )
}

const presets = [
    { label: '7D', days: 7 }, { label: '30D', days: 30 }, { label: '90D', days: 90 }
]

export default function DoctorAnalyticsPage() {
    const toast = useToast()
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [days, setDays] = useState(30)

    useEffect(() => {
        setLoading(true)
        const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')
        const endDate = format(new Date(), 'yyyy-MM-dd')
        api.get('/api/analytics/range', { params: { startDate, endDate } })
            .then(r => setAnalytics(r.data?.analytics ?? r.data?.data ?? r.data))
            .catch(() => toast.error('Failed to load analytics'))
            .finally(() => setLoading(false))
    }, [days, toast])

    const kpis = analytics ? [
        { label: 'Total Appointments', value: analytics.totalAppointments ?? analytics.total ?? '—' },
        { label: 'Completed', value: analytics.completedAppointments ?? analytics.completed ?? '—' },
        { label: 'No-Shows', value: analytics.noShowAppointments ?? analytics.noShow ?? '—' },
        { label: 'Avg. Wait (min)', value: analytics.averageWaitTime ? Math.round(analytics.averageWaitTime) : '—' },
    ] : []

    const bars = analytics ? [
        { label: 'Completed', value: analytics.completedAppointments ?? analytics.completed ?? 0, color: '#22c55e' },
        { label: 'Cancelled', value: analytics.cancelledAppointments ?? analytics.cancelled ?? 0, color: '#f97316' },
        { label: 'No-Show', value: analytics.noShowAppointments ?? analytics.noShow ?? 0, color: '#ef4444' },
        { label: 'Pending', value: analytics.pendingAppointments ?? 0, color: 'var(--color-primary)' },
    ] : []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-h1 text-text-primary">Analytics</h1>
                    <p className="text-body text-text-secondary">Performance metrics and trends</p>
                </div>
                <div className="flex gap-1">
                    {presets.map(p => (
                        <button key={p.days} onClick={() => setDays(p.days)}
                            className={`px-3 py-1 rounded-md text-caption font-medium transition-colors ${days === p.days ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary hover:border-primary'}`}>
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading
                    ? SKELETONS.map((_, i) => <StatCardSkeleton key={i} />)
                    : kpis.map(k => (
                        <Card key={k.label}>
                            <p className="text-caption text-text-secondary uppercase tracking-wide">{k.label}</p>
                            <p className="text-h1 font-bold text-text-primary mt-1">{k.value}</p>
                        </Card>
                    ))}
            </div>

            {/* Bar chart */}
            {!loading && analytics && bars.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Appointment Breakdown</CardTitle></CardHeader>
                    <BarChart bars={bars} />
                </Card>
            )}
        </div>
    )
}
