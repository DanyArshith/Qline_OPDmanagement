'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'

export default function AdminDoctorDetailPage({ params }) {
    const { id } = params
    const toast = useToast()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get(`/api/admin/doctors/${id}`)
            .then(r => setData(r.data))
            .catch(() => toast.error('Failed to load doctor'))
            .finally(() => setLoading(false))
    }, [id, toast])

    if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" className="text-primary" /></div>
    if (!data) return <p className="text-center py-12 text-text-secondary">Doctor not found</p>

    const { doctor, stats, todayQueue } = data

    const kpis = [
        { label: 'Total Appointments', value: stats.totalAppointments },
        { label: 'This Month', value: stats.monthAppointments },
        { label: 'Completed', value: stats.completedAppointments },
        { label: 'No-Show Rate', value: `${stats.noShowRate}%` },
    ]

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <Link href="/admin/doctors" className="text-caption text-primary hover:underline">← Back to Doctors</Link>
                <h1 className="text-h1 text-text-primary mt-1">Doctor Detail</h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-body">
                            {(doctor.userId?.name ?? 'D').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-body font-semibold text-text-primary">{doctor.userId?.name ?? '—'}</p>
                            <p className="text-caption text-text-secondary">{doctor.userId?.email}</p>
                        </div>
                    </div>
                    {todayQueue && <Badge status={todayQueue.status} />}
                </CardHeader>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                    <div>
                        <p className="text-caption text-text-secondary">Department</p>
                        <p className="text-body font-medium text-text-primary">{doctor.department ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-caption text-text-secondary">Specialization</p>
                        <p className="text-body font-medium text-text-primary">{doctor.specialization ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-caption text-text-secondary">Working Days</p>
                        <p className="text-body text-text-primary">{doctor.workingDays?.join(', ') ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-caption text-text-secondary">Working Hours</p>
                        <p className="text-body text-text-primary">
                            {doctor.workingHours?.start ?? '—'} – {doctor.workingHours?.end ?? '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-caption text-text-secondary">Joined</p>
                        <p className="text-body text-text-primary">{formatDate(doctor.createdAt)}</p>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {kpis.map(k => (
                    <Card key={k.label}>
                        <p className="text-caption text-text-secondary uppercase tracking-wide">{k.label}</p>
                        <p className="text-h2 font-bold text-primary mt-1">{k.value}</p>
                    </Card>
                ))}
            </div>

            {todayQueue && (
                <Card>
                    <CardHeader><CardTitle>Today's Queue</CardTitle></CardHeader>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        {[
                            ['Booked', todayQueue.totalBooked ?? 0],
                            ['Waiting', todayQueue.waitingCount ?? 0],
                            ['Completed', todayQueue.completedCount ?? 0],
                        ].map(([label, val]) => (
                            <div key={label}>
                                <p className="text-h2 font-bold text-primary">{val}</p>
                                <p className="text-caption text-text-secondary">{label}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    )
}
