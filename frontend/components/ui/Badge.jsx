'use client'

import { cn, getStatusConfig } from '@/lib/utils'

export default function Badge({ status, label, className = '' }) {
    const config = getStatusConfig(status)
    const displayLabel = label ?? config.label

    return (
        <span
            className={cn(
                'inline-flex items-center px-3 py-1 rounded-pill text-caption font-medium',
                config.bg,
                config.text,
                className
            )}
        >
            {displayLabel}
        </span>
    )
}
