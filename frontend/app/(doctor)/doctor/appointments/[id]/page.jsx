'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import api from '@/lib/api'
import { formatTime, formatDateTime, timeAgo } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'

const TODAY = format(new Date(), 'yyyy-MM-dd')

export default function DoctorAppointmentDetailPage({ params }) {
    const { id } = params
    const toast = useToast()
    const [appointment, setAppointment] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState({})
    const [showConfirm, setShowConfirm] = useState(null) // 'complete' | 'noshow'

    const load = useCallback(async () => {
        try {
            const r = await api.get(`/api/appointments/${id}`)
            setAppointment(r.data?.appointment ?? r.data?.data ?? r.data)
        } catch {
            toast.error('Failed to load appointment')
        } finally {
            setLoading(false)
        }
    }, [id, toast])

    useEffect(() => { load() }, [load])

    const doAction = async (actionKey, endpoint) => {
        setActionLoading(p => ({ ...p, [actionKey]: true }))
        try {
            await api.post(endpoint, { date: TODAY }, { headers: { 'X-Action-ID': crypto.randomUUID() } })
            toast.success('Action completed')
            load()
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Action failed')
        } finally {
            setActionLoading(p => ({ ...p, [actionKey]: false }))
            setShowConfirm(null)
        }
    }

    if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" className="text-primary" /></div>
    if (!appointment) return <p className="text-center py-12 text-text-secondary">Appointment not found</p>

    const patient = appointment.patientId
    const canTakeActions = ['booked', 'waiting', 'in_progress'].includes(appointment.status)

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/doctor/appointments" className="text-caption text-primary hover:underline">
                        ← Back to Appointments
                    </Link>
                    <h1 className="text-h1 text-text-primary mt-1">Appointment Detail</h1>
                </div>
                <Badge status={appointment.status} />
            </div>

            {/* Patient info */}
            <Card>
                <CardHeader>
                    <CardTitle>Patient Information</CardTitle>
                </CardHeader>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-body font-semibold text-primary">
                            {(patient?.name ?? 'P').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold text-text-primary">{patient?.name ?? 'Unknown Patient'}</p>
                            <p className="text-caption text-text-secondary">{patient?.email ?? '—'}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                        <div>
                            <p className="text-caption text-text-secondary">Appointment Date</p>
                            <p className="text-body font-medium text-text-primary">{formatDateTime(appointment.slotStart)}</p>
                        </div>
                        <div>
                            <p className="text-caption text-text-secondary">Token Number</p>
                            <p className="text-body font-medium text-text-primary">#{appointment.tokenNumber ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-caption text-text-secondary">Priority</p>
                            <Badge status={appointment.priority ?? 'standard'} />
                        </div>
                        <div>
                            <p className="text-caption text-text-secondary">Booked At</p>
                            <p className="text-body text-text-secondary">{timeAgo(appointment.createdAt)}</p>
                        </div>
                    </div>
                    {appointment.priorityNote && (
                        <p className="text-body bg-warning/10 text-warning rounded-md px-3 py-2">
                            Note: {appointment.priorityNote}
                        </p>
                    )}
                </div>
            </Card>

            {/* Queue actions */}
            {canTakeActions && (
                <Card>
                    <CardHeader><CardTitle>Queue Actions</CardTitle></CardHeader>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={() => setShowConfirm('complete')}
                            loading={actionLoading.complete}
                            className="flex-1"
                        >
                            ✓ Mark Complete
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => setShowConfirm('noshow')}
                            loading={actionLoading.noshow}
                            className="flex-1"
                        >
                            ✗ Mark No-Show
                        </Button>
                        <Link href={`/doctor/medical-records/new?appointmentId=${appointment._id}`} className="flex-1">
                            <Button variant="secondary" className="w-full">
                                + Add Medical Record
                            </Button>
                        </Link>
                    </div>
                </Card>
            )}

            {/* Confirmation modal */}
            {showConfirm && (
                <Modal isOpen onClose={() => setShowConfirm(null)}
                    title={showConfirm === 'complete' ? 'Mark as Complete?' : 'Mark as No-Show?'}>
                    <p className="text-body text-text-secondary mb-4">
                        {showConfirm === 'complete'
                            ? 'This will mark the current consultation as completed and move to the next patient.'
                            : 'This will mark the patient as no-show.'}
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowConfirm(null)}>Cancel</Button>
                        <Button
                            variant={showConfirm === 'noshow' ? 'danger' : 'primary'}
                            onClick={() => doAction(showConfirm, showConfirm === 'complete' ? '/api/queue/mark-completed' : '/api/queue/mark-no-show')}
                            loading={actionLoading[showConfirm]}
                        >
                            Confirm
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    )
}
