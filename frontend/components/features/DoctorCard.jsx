'use client'

import Link from 'next/link'
import { cn, formatTime, getInitials } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

export default function DoctorCard({ doctor }) {
    const {
        _id,
        user,
        department,
        defaultConsultTime,
        nextAvailableSlot,
    } = doctor

    const name = user?.name || 'Dr. Unknown'
    const dept = department || 'General Medicine'
    const slotTime = nextAvailableSlot ? formatTime(nextAvailableSlot) : null

    return (
        <article className="bg-surface rounded-lg shadow-1 p-4 flex flex-col gap-3 hover:shadow-2 transition-shadow duration-200">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-soft text-primary font-semibold text-body-lg flex items-center justify-center shrink-0">
                    {getInitials(name)}
                </div>
                <div className="min-w-0">
                    <h3 className="text-body-lg font-semibold text-text-primary truncate">{name}</h3>
                    <p className="text-body text-text-secondary truncate">{dept}</p>
                </div>
            </div>

            {/* Info row */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-caption text-text-secondary">
                    ⏱ {defaultConsultTime || 15} min per patient
                </span>
                {slotTime && (
                    <span className="text-caption text-success">
                        ● Next slot: {slotTime}
                    </span>
                )}
                {!slotTime && (
                    <span className="text-caption text-error">
                        ● No slots today
                    </span>
                )}
            </div>

            {/* CTA */}
            <Link href={`/doctors/${_id}/book`} tabIndex={-1} className="mt-auto">
                <Button fullWidth disabled={!slotTime}>
                    {slotTime ? 'Book Appointment' : 'Unavailable'}
                </Button>
            </Link>
        </article>
    )
}
