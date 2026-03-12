'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { addDays, format, startOfDay } from 'date-fns'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { normalizeApiError, unwrapApiData } from '@/lib/apiClient'
import { formatTime } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import { ErrorState, LoadingState } from '@/components/ui/AsyncState'

const LOOKAHEAD_DAYS = 7

function upcomingDates() {
    const today = startOfDay(new Date())
    return Array.from({ length: LOOKAHEAD_DAYS }, (_, i) => addDays(today, i))
}

export default function DoctorDetailPage() {
    const params = useParams()
    const doctorId = params.id

    const [doctor, setDoctor] = useState(null)
    const [slotsByDay, setSlotsByDay] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const dates = useMemo(() => upcomingDates(), [])

    const fetchDoctorDetail = useCallback(async () => {
        try {
            setLoading(true)
            setError('')

            const doctorRes = await api.get(`/api/doctors/${doctorId}`)
            const raw = unwrapApiData(doctorRes)
            const profile = raw?.data ?? raw

            if (!profile?._id) {
                throw new Error('Doctor profile not found')
            }

            setDoctor({
                ...profile,
                name: profile?.user?.name ?? profile?.userId?.name ?? 'Doctor',
                specialization: profile?.specialization || profile?.department || 'General',
            })

            const slotResults = await Promise.all(
                dates.map(async (day) => {
                    const dateValue = format(day, 'yyyy-MM-dd')
                    try {
                        const slotRes = await api.get(`/api/doctors/${doctorId}/slots`, {
                            params: { date: dateValue },
                        })
                        const payload = unwrapApiData(slotRes)
                        const slots = payload?.slots ?? payload?.data ?? []
                        return { date: dateValue, slots: Array.isArray(slots) ? slots : [] }
                    } catch {
                        return { date: dateValue, slots: [] }
                    }
                })
            )

            setSlotsByDay(slotResults)
        } catch (err) {
            setError(normalizeApiError(err, 'Failed to load doctor details'))
        } finally {
            setLoading(false)
        }
    }, [dates, doctorId])

    useEffect(() => {
        fetchDoctorDetail()
    }, [fetchDoctorDetail])

    if (loading) return <LoadingState label="Loading doctor profile..." />
    if (error || !doctor) {
        return (
            <div className="space-y-4">
                <Link href="/doctors" className="text-body text-primary hover:underline">
                    Back to doctors
                </Link>
                <ErrorState message={error || 'Doctor not found'} onRetry={fetchDoctorDetail} />
            </div>
        )
    }

    const hasAnySlots = slotsByDay.some((row) => row.slots.length > 0)

    return (
        <div className="space-y-6">
            <Link href="/doctors" className="text-body text-primary hover:underline">
                Back to doctors
            </Link>

            <Card className="space-y-5 p-6">
                <div>
                    <h1 className="text-h1 text-text-primary">Dr. {doctor.name}</h1>
                    <p className="text-body text-text-secondary">{doctor.specialization}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-border bg-bg p-4">
                        <p className="text-caption text-text-secondary">Department</p>
                        <p className="text-body font-semibold text-text-primary">{doctor.department || 'Not set'}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-bg p-4">
                        <p className="text-caption text-text-secondary">Consultation Duration</p>
                        <p className="text-body font-semibold text-text-primary">
                            {doctor.defaultConsultTime || 15} min
                        </p>
                    </div>
                    <div className="rounded-lg border border-border bg-bg p-4">
                        <p className="text-caption text-text-secondary">Working Hours</p>
                        <p className="text-body font-semibold text-text-primary">
                            {doctor.workingHours?.start || '--:--'} to {doctor.workingHours?.end || '--:--'}
                        </p>
                    </div>
                </div>

                {doctor.waitingTime && (
                    <div className="rounded-lg border-2 border-warning/30 bg-warning/5 p-4">
                        <h3 className="mb-3 text-body font-semibold text-text-primary">Current Queue Status</h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="flex flex-col">
                                <span className="text-caption text-text-secondary">Estimated Wait Time</span>
                                <span className="text-body-lg font-bold text-warning">{doctor.waitingTime.estimatedWaitMinutes} minutes</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-caption text-text-secondary">Patients in Queue</span>
                                <span className="text-body-lg font-bold text-primary">{doctor.waitingTime.patientsInQueue} patient{doctor.waitingTime.patientsInQueue !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>
                )}

                {doctor.bio && (
                    <div>
                        <h2 className="mb-2 text-h3 text-text-primary">About</h2>
                        <p className="text-body text-text-secondary">{doctor.bio}</p>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <Link href={`/doctors/${doctor._id}/book`}>
                        <Button>Book Appointment</Button>
                    </Link>
                    <span className="text-caption text-text-secondary">
                        Reviews, favorites, and payments are deferred in this MVP.
                    </span>
                </div>
            </Card>

            <Card className="p-6">
                <CardHeader>
                    <CardTitle>Next 7 days availability</CardTitle>
                </CardHeader>

                {!hasAnySlots ? (
                    <p className="text-body text-text-secondary">
                        No open slots in the next 7 days.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {slotsByDay.map(({ date, slots }) => (
                            <div key={date} className="rounded-lg border border-border bg-bg p-3">
                                <p className="text-body font-semibold text-text-primary">
                                    {format(new Date(date), 'EEE, MMM d')}
                                </p>
                                {slots.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {slots.slice(0, 8).map((slot) => (
                                            <span
                                                key={slot._id || slot.slotStart || slot.start}
                                                className="rounded-pill border border-border px-3 py-1 text-caption text-text-primary"
                                            >
                                                {formatTime(slot.slotStart || slot.start)}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-1 text-caption text-text-secondary">No slots</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}

