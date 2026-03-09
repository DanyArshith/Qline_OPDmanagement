'use client'

import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import api from '@/lib/api'
import { formatTime } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useSocket, useSocketEvent } from '@/hooks/useSocket'
import QueueControlPanel from '@/components/features/QueueControlPanel'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'

const TODAY = format(new Date(), 'yyyy-MM-dd')

const PRIORITIES = [
    { value: 'emergency', label: 'Emergency', color: 'bg-error text-white', ring: 'ring-error' },
    { value: 'senior', label: 'Senior', color: 'bg-warning text-white', ring: 'ring-warning' },
    { value: 'standard', label: 'Standard', color: 'bg-border text-text-primary', ring: 'ring-border' },
]

/* ── Priority Modal Component ─────────────────────────────────────────────── */
function PriorityModal({ appointment, onClose, onSaved }) {
    const toast = useToast()
    const [priority, setPriority] = useState(appointment?.priority ?? 'standard')
    const [note, setNote] = useState(appointment?.priorityNote ?? '')
    const [loading, setLoading] = useState(false)

    const save = async () => {
        setLoading(true)
        try {
            await api.patch(`/api/appointments/${appointment._id}/priority`, {
                priority,
                priorityNote: note,
            })
            toast.success(`Priority set to ${priority}`)
            onSaved({ appointmentId: appointment._id, priority, priorityNote: note })
            onClose()
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to set priority')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen onClose={onClose} title="Set Appointment Priority">
            <div className="space-y-4">
                <p className="text-body text-text-secondary">
                    Patient: <span className="font-medium text-text-primary">
                        {appointment?.patientId?.name ?? 'Patient'}
                    </span>
                    <span className="ml-2 text-text-secondary">· Token #{appointment?.tokenNumber}</span>
                </p>

                {/* Priority selector */}
                <div className="grid grid-cols-3 gap-2">
                    {PRIORITIES.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => setPriority(p.value)}
                            className={`py-3 px-2 rounded-lg text-body font-medium border-2 transition-all ${priority === p.value
                                    ? `${p.color} border-transparent ring-2 ${p.ring}`
                                    : 'bg-surface border-border text-text-secondary hover:border-primary'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Note */}
                <div>
                    <label className="block text-caption text-text-secondary mb-1">
                        Note <span className="text-text-secondary">(optional)</span>
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. patient is 80+ years old"
                        rows={2}
                        className="w-full px-3 py-2 rounded-md border border-border bg-surface text-body text-text-primary resize-none focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-colors"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={save} loading={loading}>Save Priority</Button>
                </div>
            </div>
        </Modal>
    )
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function DoctorDashboardPage() {
    const toast = useToast()
    const { joinRoom, leaveRoom } = useSocket()

    const [appointments, setAppointments] = useState([])
    const [queueState, setQueueState] = useState(null)
    const [currentAppt, setCurrentAppt] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState({})
    const [priorityTarget, setPriorityTarget] = useState(null) // appointment to set priority on

    /* ── Load today's data ──────────────────────────────────────────────────── */
    const load = useCallback(async () => {
        try {
            const [apptRes, queueRes] = await Promise.all([
                api.get('/api/appointments/doctor-appointments', { params: { date: TODAY } }),
                api.get('/api/queue/current-state', { params: { date: TODAY } }),
            ])
            const appts = apptRes.data?.data ?? apptRes.data ?? []
            const queue = queueRes.data?.data ?? queueRes.data
            setAppointments(Array.isArray(appts) ? appts : appts.appointments ?? [])
            setQueueState(queue)
            setCurrentAppt(queue?.currentAppointment ?? null)
        } catch {
            toast.error('Could not load dashboard data')
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => { load() }, [load])

    useEffect(() => {
        if (!queueState?.doctorId) return
        joinRoom(queueState.doctorId, TODAY)
        return () => leaveRoom()
    }, [queueState?.doctorId, joinRoom, leaveRoom])

    /* ── Socket: receive queue updates ─────────────────────────────────────── */
    useSocketEvent('queue:updated', (data) => {
        setQueueState(data)
        setCurrentAppt(data.currentAppointment ?? null)
        if (data.appointments) setAppointments(data.appointments)
    })
    useSocketEvent('queue:update', (data) => {
        setQueueState(data)
        setCurrentAppt(data.currentAppointment ?? null)
        if (data.appointments) setAppointments(data.appointments)
    })
    useSocketEvent('queue:token-called', () => { load() })
    useSocketEvent('queue:paused', () => { load() })
    useSocketEvent('queue:resumed', () => { load() })
    useSocketEvent('queue:closed', () => { load() })

    /* ── Queue actions ──────────────────────────────────────────────────────── */
    const withLoading = (key, fn) => async () => {
        setActionLoading((p) => ({ ...p, [key]: true }))
        try {
            await fn()
            await load()
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Action failed')
        } finally {
            setActionLoading((p) => ({ ...p, [key]: false }))
        }
    }

    const onCallNext = withLoading('callNext', () =>
        api.post('/api/queue/call-next', { date: TODAY }, { headers: { 'X-Action-ID': crypto.randomUUID() } })
    )
    const onComplete = withLoading('complete', () =>
        api.post('/api/queue/mark-completed', { date: TODAY }, { headers: { 'X-Action-ID': crypto.randomUUID() } })
    )
    const onNoShow = withLoading('noShow', () =>
        api.post('/api/queue/mark-no-show', { date: TODAY }, { headers: { 'X-Action-ID': crypto.randomUUID() } })
    )
    const onPause = withLoading('pause', () =>
        api.post('/api/queue/pause', { date: TODAY })
    )
    const onResume = withLoading('pause', () =>
        api.post('/api/queue/resume', { date: TODAY })
    )

    /* ── Priority saved callback ────────────────────────────────────────────── */
    const handlePrioritySaved = ({ appointmentId, priority, priorityNote }) => {
        setAppointments((prev) =>
            prev.map((a) =>
                a._id === appointmentId ? { ...a, priority, priorityNote } : a
            )
        )
    }

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Spinner size="lg" className="text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-h1 text-text-primary">Today&apos;s Dashboard</h1>
                <p className="text-body text-text-secondary">
                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Appointment timeline */}
                <div className="lg:col-span-2 space-y-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Schedule</CardTitle>
                            <span className="text-caption text-text-secondary">
                                {appointments.length} appointments
                            </span>
                        </CardHeader>

                        {appointments.length === 0 ? (
                            <p className="text-body text-text-secondary text-center py-8">
                                No appointments today
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {appointments.map((appt) => {
                                    const isCurrent = appt._id === currentAppt?._id
                                    const canSetPriority = ['booked', 'waiting'].includes(appt.status)
                                    return (
                                        <div
                                            key={appt._id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isCurrent ? 'border-primary bg-primary-soft' : 'border-border'
                                                }`}
                                        >
                                            {/* Time */}
                                            <div className="w-16 text-caption font-medium text-text-secondary shrink-0">
                                                {formatTime(appt.slotStart)}
                                            </div>

                                            {/* Patient */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-body font-medium text-text-primary truncate">
                                                    {appt.patientId?.name ?? 'Patient'}
                                                </p>
                                                <p className="text-caption text-text-secondary">
                                                    Token #{appt.tokenNumber}
                                                    {appt.priorityNote && (
                                                        <span className="ml-1 text-text-secondary">
                                                            · {appt.priorityNote}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>

                                            {/* Priority badge */}
                                            {appt.priority && appt.priority !== 'standard' && (
                                                <Badge status={appt.priority} />
                                            )}

                                            {/* Status */}
                                            <Badge status={appt.status} />

                                            {/* Set priority button */}
                                            {canSetPriority && (
                                                <button
                                                    onClick={() => setPriorityTarget(appt)}
                                                    className="text-caption text-primary hover:underline shrink-0"
                                                    title="Set priority"
                                                >
                                                    Priority
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right: Queue control */}
                <div>
                    <QueueControlPanel
                        currentAppointment={currentAppt}
                        queueState={queueState}
                        onCallNext={onCallNext}
                        onComplete={onComplete}
                        onNoShow={onNoShow}
                        onPause={onPause}
                        onResume={onResume}
                        loading={actionLoading}
                    />
                </div>
            </div>

            {/* Priority modal */}
            {priorityTarget && (
                <PriorityModal
                    appointment={priorityTarget}
                    onClose={() => setPriorityTarget(null)}
                    onSaved={handlePrioritySaved}
                />
            )}
        </div>
    )
}
