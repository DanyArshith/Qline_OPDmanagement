'use client'

import { cn } from '@/lib/utils'

export default function Card({ children, className = '', hover = false, padding = true }) {
    return (
        <div
            className={cn(
                'bg-surface rounded-lg shadow-1',
                padding && 'p-4',
                hover && 'transition-shadow duration-200 hover:shadow-2 cursor-pointer',
                className
            )}
        >
            {children}
        </div>
    )
}

export function CardHeader({ children, className = '' }) {
    return (
        <div className={cn('flex items-center justify-between mb-4', className)}>
            {children}
        </div>
    )
}

export function CardTitle({ children, className = '' }) {
    return <h3 className={cn('text-h3 text-text-primary', className)}>{children}</h3>
}
