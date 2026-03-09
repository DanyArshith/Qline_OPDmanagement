'use client'

import { cn, formatTime } from '@/lib/utils'

export default function SlotPicker({ slots = [], selectedSlot, onSelect }) {
    if (slots.length === 0) {
        return (
            <div className="text-center py-8 text-text-secondary text-body">
                No available slots for this date.
            </div>
        )
    }

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {slots.map((slot) => {
                const isSelected = selectedSlot?.slotStart === slot.slotStart
                const isBooked = slot.status === 'booked'

                return (
                    <button
                        key={slot.slotStart}
                        disabled={isBooked}
                        onClick={() => !isBooked && onSelect(slot)}
                        className={cn(
                            'px-3 py-2.5 rounded-pill text-caption font-medium',
                            'border transition-all duration-200 text-center',
                            isBooked
                                ? 'bg-border text-text-secondary cursor-not-allowed opacity-60'
                                : isSelected
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-surface text-text-primary border-border hover:border-primary hover:text-primary'
                        )}
                    >
                        {formatTime(slot.slotStart)}
                    </button>
                )
            })}
        </div>
    )
}
