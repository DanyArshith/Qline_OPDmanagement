'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { formatTime, drName } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useSocket, useSocketEvent } from '@/hooks/useSocket'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'

export default function QueuePage() {
    const { appointmentId } = useParams()
    const toast = useToast()
    const { joinRoom, leaveRoom } = useSocket()

    const [appointment, setAppointment] = useState(null)
    const [waitInfo, setWaitInfo] = useState(null)
    const [queueState, setQueueState] = useState(null)
    const [loading, setLoading] = useState(true)

    // Load appointment + wait info
    const load = useCallback(async () => {
        try {
            const [apptRes, waitRes] = await Promise.all([
                api.get(`/api/appointments/${appointmentId}`),
                api.get(`/api/appointments/${appointmentId}/wait-info`),
            ])
            const appt = apptRes.data?.data ?? apptRes.data
            const wait = waitRes.data?.data ?? waitRes.data
            setAppointment(appt)
            setWaitInfo(wait)

            // Join doctor room for live updates
            const doctorId = appt?.doctorId?._id ?? appt?.doctorId
            const roomDate = appt?.date ?? appt?.slotStart
            if (doctorId && roomDate) {
                joinRoom(doctorId, roomDate)
            }
        } catch {
            toast.error('Could not load queue information')
        } finally {
            setLoading(false)
        }
    }, [appointmentId, joinRoom, toast])

    useEffect(() => {
        load()
        return () => leaveRoom()
    }, [load, leaveRoom])

    /* ── Live socket: queue:update from server ─────────────────────────────── */
    useSocketEvent('queue:updated', (data) => {
        setQueueState(data)
    })
    useSocketEvent('queue:update', (data) => {
        setQueueState(data)
    })
    useSocketEvent('queue:token-called', (data) => {
        if (data?.queueState) {
            setQueueState(data.queueState)
        } else if (data?.currentToken != null) {
            setQueueState((prev) => ({ ...(prev || {}), currentToken: data.currentToken }))
        }
        api.get(`/api/appointments/${appointmentId}/wait-info`)
            .then((res) => {
                const nextWait = res.data?.data ?? res.data
                setWaitInfo(nextWait)
            })
            .catch(() => { })
    })
    useSocketEvent('queue:paused', (data) => {
        setQueueState((prev) => ({ ...(prev || {}), status: data?.status ?? 'paused' }))
    })
    useSocketEvent('queue:resumed', (data) => {
        setQueueState((prev) => ({ ...(prev || {}), status: data?.status ?? 'active' }))
    })
    useSocketEvent('queue:closed', (data) => {
        setQueueState((prev) => ({ ...(prev || {}), status: data?.status ?? 'closed' }))
    })

    /* ── Live socket: queue:position-update from server ────────────────────── */
    useSocketEvent('queue:position-update', (data) => {
        if (data.appointmentId === appointmentId) {
            setWaitInfo((prev) => ({ ...prev, ...data }))
        }
    })

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Spinner size="lg" className="text-primary" />
            </div>
        )
    }

    const position = waitInfo?.position ?? '—'
    const estWait = waitInfo?.estimatedWait
    const currentToken = queueState?.currentToken ?? '—'
    const myToken = appointment?.tokenNumber

    return (
        <div className="max-w-lg mx-auto space-y-6">
            {/* Current serving */}
            <Card className="text-center p-8">
                <p className="text-caption text-text-secondary uppercase tracking-wider mb-2">
                    Now Serving
                </p>
                <div className="text-[72px] font-bold text-primary leading-none">
                    {currentToken}
                </div>
                <Badge
                    status={queueState?.status ?? 'active'}
                    className="mt-4"
                />
            </Card>

            {/* My token */}
            <Card>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-caption text-text-secondary">Your Token</p>
                        <p className="text-h1 font-bold text-text-primary">#{myToken}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-caption text-text-secondary">Position</p>
                        <p className="text-h2 font-semibold text-text-primary">
                            {typeof position === 'number' ? `#${position}` : position}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Wait time + appointment details */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="text-center">
                    <p className="text-caption text-text-secondary mb-1">Est. Wait</p>
                    <p className="text-h2 font-semibold text-text-primary">
                        {estWait != null ? `${estWait} min` : '—'}
                    </p>
                </Card>
                <Card className="text-center">
                    <p className="text-caption text-text-secondary mb-1">Your Slot</p>
                    <p className="text-h3 font-semibold text-text-primary">
                        {appointment?.slotStart ? formatTime(appointment.slotStart) : '—'}
                    </p>
                </Card>
            </div>

            {/* Status */}
            <Card>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-body font-medium text-text-primary">Appointment Status</p>
                        <p className="text-caption text-text-secondary mt-0.5">
                            {drName(appointment?.doctorId?.name)}
                        </p>
                    </div>
                    <Badge status={appointment?.status ?? 'waiting'} />
                </div>
            </Card>

            {/* Live indicator */}
            <div className="flex items-center justify-center gap-2 text-caption text-text-secondary">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Updates live via socket
            </div>
        </div>
    )
}
