'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function DoctorSchedulePage() {
    const toast = useToast()
    const [schedule, setSchedule] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/api/doctors/my-schedule')
            .then((r) => {
                const data = r.data?.doctor ?? r.data?.data?.doctor ?? r.data?.schedule ?? r.data?.data ?? r.data
                setSchedule(data)
            })
            .catch(() => toast.error('Failed to load schedule'))
            .finally(() => setLoading(false))
    }, [toast])

    if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" className="text-primary" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-h1 text-text-primary">My Schedule</h1>
                    <p className="text-body text-text-secondary">View your working hours and break slots</p>
                </div>
                <Link href="/doctor/configure">
                    <Button variant="secondary" size="sm">Edit Schedule</Button>
                </Link>
            </div>

            {!schedule ? (
                <Card>
                    <p className="text-body text-text-secondary text-center py-8">
                        No schedule configured yet.{' '}
                        <Link href="/doctor/configure" className="text-primary hover:underline">Configure your schedule →</Link>
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {/* Working hours */}
                    <Card>
                        <CardHeader><CardTitle>Working Hours</CardTitle></CardHeader>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <p className="text-caption text-text-secondary">Start Time</p>
                                <p className="text-body font-semibold text-text-primary">{schedule.workingHours?.start ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-caption text-text-secondary">End Time</p>
                                <p className="text-body font-semibold text-text-primary">{schedule.workingHours?.end ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-caption text-text-secondary">Consultation Duration</p>
                                <p className="text-body font-semibold text-text-primary">{schedule.defaultConsultTime ?? '—'} min</p>
                            </div>
                            <div>
                                <p className="text-caption text-text-secondary">Max. Patients / Day</p>
                                <p className="text-body font-semibold text-text-primary">{schedule.maxPatientsPerDay ?? '—'}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Department */}
                    {schedule.department && (
                        <Card>
                            <CardHeader><CardTitle>Department</CardTitle></CardHeader>
                            <p className="text-body text-text-primary">{schedule.department}</p>
                        </Card>
                    )}

                    {/* Break slots */}
                    <Card>
                        <CardHeader><CardTitle>Break Slots</CardTitle></CardHeader>
                        {schedule.breakSlots && schedule.breakSlots.length > 0 ? (
                            <div className="space-y-2">
                                {schedule.breakSlots.map((b, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-bg border border-border">
                                        <span className="text-body font-medium text-text-primary">{b.start} – {b.end}</span>
                                        {b.reason && <span className="text-caption text-text-secondary">{b.reason}</span>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-body text-text-secondary">No break slots configured</p>
                        )}
                    </Card>

                    {/* Working days */}
                    {schedule.workingDays && (
                        <Card>
                            <CardHeader><CardTitle>Working Days</CardTitle></CardHeader>
                            <div className="flex flex-wrap gap-2">
                                {DAYS.map(day => {
                                    const isWorking = schedule.workingDays.includes(day) || schedule.workingDays.includes(day.toLowerCase())
                                    return (
                                        <span key={day} className={`px-3 py-1 rounded-full text-caption font-medium ${isWorking ? 'bg-success/10 text-success' : 'bg-border text-text-secondary'
                                            }`}>
                                            {day.slice(0, 3)}
                                        </span>
                                    )
                                })}
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}
