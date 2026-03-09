'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { addDays, format, isSameDay, startOfDay } from 'date-fns'
import api from '@/lib/api'
import { formatDate, formatTime } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import SlotPicker from '@/components/features/SlotPicker'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'

const DATE_COUNT = 7

function generateDays() {
    return Array.from({ length: DATE_COUNT }, (_, i) => addDays(startOfDay(new Date()), i))
}

export default function BookPage() {
    const { id: doctorId } = useParams()
    const router = useRouter()
    const toast = useToast()

    const [doctor, setDoctor] = useState(null)
    const [slots, setSlots] = useState([])
    const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()))
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [doctorLoading, setDoctorLoading] = useState(true)
    const [slotsLoading, setSlotsLoading] = useState(false)
    const [bookLoading, setBookLoading] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const days = generateDays()

    // Load doctor info
    useEffect(() => {
        api.get(`/api/doctors/${doctorId}`)
            .then((r) => setDoctor(r.data?.data ?? r.data))
            .catch(() => toast.error('Doctor not found'))
            .finally(() => setDoctorLoading(false))
    }, [doctorId, toast])

    // Load slots for selected date
    const loadSlots = useCallback(() => {
        if (!doctorId) return
        setSlotsLoading(true)
        setSelectedSlot(null)
        api
            .get(`/api/doctors/${doctorId}/slots`, { params: { date: format(selectedDate, 'yyyy-MM-dd') } })
            .then((r) => setSlots(r.data?.slots ?? r.data?.data ?? r.data ?? []))
            .catch(() => toast.error('Could not load slots'))
            .finally(() => setSlotsLoading(false))
    }, [doctorId, selectedDate, toast])

    useEffect(() => { loadSlots() }, [loadSlots])

    const handleBook = async () => {
        setBookLoading(true)
        try {
            await api.post('/api/appointments/book', {
                doctorId,
                date: format(selectedDate, 'yyyy-MM-dd'),
                slotStart: selectedSlot.start || selectedSlot.slotStart,
                slotEnd: selectedSlot.end || selectedSlot.slotEnd,
            })
            toast.success('Appointment booked!')
            router.push('/appointments')
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Booking failed')
        } finally {
            setBookLoading(false)
            setShowConfirm(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Doctor info header */}
            <Card>
                {doctorLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                    </div>
                ) : (
                    <div>
                        <h1 className="text-h2 text-text-primary">{doctor?.user?.name}</h1>
                        <p className="text-body text-text-secondary">
                            {doctor?.department} · {doctor?.defaultConsultTime} min per consultation
                        </p>
                    </div>
                )}
            </Card>

            {/* Date selector */}
            <Card>
                <CardHeader>
                    <CardTitle>Select a date</CardTitle>
                </CardHeader>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {days.map((day) => {
                        const active = isSameDay(day, selectedDate)
                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => { setSelectedDate(day) }}
                                className={`flex flex-col items-center px-4 py-2.5 rounded-md border shrink-0 transition-all duration-200 ${active
                                        ? 'border-primary bg-primary-soft text-primary'
                                        : 'border-border text-text-secondary hover:border-primary'
                                    }`}
                            >
                                <span className="text-caption uppercase">{format(day, 'EEE')}</span>
                                <span className="text-body-lg font-semibold">{format(day, 'd')}</span>
                            </button>
                        )
                    })}
                </div>
            </Card>

            {/* Slot picker */}
            <Card>
                <CardHeader>
                    <CardTitle>Available slots</CardTitle>
                    <span className="text-body text-text-secondary">{formatDate(selectedDate)}</span>
                </CardHeader>
                {slotsLoading ? (
                    <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 rounded-pill" />
                        ))}
                    </div>
                ) : (
                    <SlotPicker
                        slots={slots}
                        selectedSlot={selectedSlot}
                        onSelect={setSelectedSlot}
                    />
                )}
            </Card>

            {/* Book CTA */}
            {selectedSlot && (
                <div className="sticky bottom-4">
                    <Card className="p-4 shadow-2 flex items-center justify-between gap-4">
                        <span className="text-body text-text-secondary">
                            Selected: <strong className="text-text-primary">{formatTime(selectedSlot.slotStart)}</strong>
                        </span>
                        <Button onClick={() => setShowConfirm(true)}>
                            Confirm Booking
                        </Button>
                    </Card>
                </div>
            )}

            {/* Confirm modal */}
            <Modal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                title="Confirm Appointment"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowConfirm(false)} disabled={bookLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleBook} loading={bookLoading}>
                            Book Now
                        </Button>
                    </>
                }
            >
                <p>
                    Book appointment with <strong>{doctor?.user?.name}</strong> on{' '}
                    <strong>{formatDate(selectedDate)}</strong> at{' '}
                    <strong>{formatTime(selectedSlot?.slotStart)}</strong>?
                </p>
            </Modal>
        </div>
    )
}
