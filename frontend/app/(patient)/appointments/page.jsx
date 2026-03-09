'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { formatDate, formatTime, PAGE_SIZE } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { usePagination } from '@/hooks/usePagination'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Pagination from '@/components/ui/Pagination'
import { ConfirmModal } from '@/components/ui/Modal'
import { AppointmentRowSkeleton } from '@/components/ui/Skeleton'

const SKELETONS = Array.from({ length: 5 })

export default function AppointmentsPage() {
    const toast = useToast()
    const [cancelTarget, setCancelTarget] = useState(null)
    const [cancelLoading, setCancelLoading] = useState(false)

    const fetchAppointments = useCallback(
        (page, limit) => api.get('/api/appointments/my-appointments', { params: { page, limit } }),
        []
    )

    const { data: appointments, page, pages, loading, error, fetch, goToPage } =
        usePagination(fetchAppointments, PAGE_SIZE)

    useEffect(() => { fetch(1) }, [fetch])

    const handleCancel = async () => {
        setCancelLoading(true)
        try {
            await api.delete(`/api/appointments/${cancelTarget}/cancel`)
            toast.success('Appointment cancelled')
            setCancelTarget(null)
            fetch(page) // refresh current page
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Cancel failed')
        } finally {
            setCancelLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-h1 text-text-primary">My Appointments</h1>

            {error && <p className="text-body text-error">{error}</p>}

            <div className="space-y-3">
                {loading
                    ? SKELETONS.map((_, i) => <AppointmentRowSkeleton key={i} />)
                    : appointments.map((appt) => (
                        <Card key={appt._id} className="flex items-center gap-4">
                            {/* Date block */}
                            <div className="w-14 h-14 rounded-md bg-primary-soft flex flex-col items-center justify-center shrink-0">
                                <span className="text-caption text-primary font-medium uppercase">
                                    {formatDate(appt.date).split(' ')[0]}
                                </span>
                                <span className="text-h3 font-bold text-primary">
                                    {formatDate(appt.date).split(' ')[1]?.replace(',', '')}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-body-lg font-semibold text-text-primary truncate">
                                    Dr. {appt.doctorId?.name ?? '—'}
                                </p>
                                <p className="text-body text-text-secondary">
                                    {appt.doctorId?.department ?? '—'} · {formatTime(appt.slotStart)} · Token #{appt.tokenNumber}
                                </p>
                            </div>

                            {/* Status + actions */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <Badge status={appt.status} />
                                {appt.status === 'booked' && (
                                    <div className="flex gap-2">
                                        <Link href={`/queue/${appt._id}`}>
                                            <Button variant="ghost" size="sm">Track</Button>
                                        </Link>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setCancelTarget(appt._id)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
            </div>

            {/* Empty state */}
            {!loading && !error && appointments.length === 0 && (
                <div className="text-center py-16 space-y-4">
                    <p className="text-h3 text-text-secondary">No appointments yet</p>
                    <Link href="/doctors">
                        <Button>Book an appointment</Button>
                    </Link>
                </div>
            )}

            <Pagination page={page} pages={pages} onPageChange={goToPage} loading={loading} />

            <ConfirmModal
                isOpen={!!cancelTarget}
                onClose={() => setCancelTarget(null)}
                onConfirm={handleCancel}
                title="Cancel Appointment"
                message="Are you sure you want to cancel this appointment? This cannot be undone."
                confirmLabel="Cancel Appointment"
                loading={cancelLoading}
            />
        </div>
    )
}
