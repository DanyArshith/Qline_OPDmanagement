'use client'

import { cn } from '@/lib/utils'

/** Skeleton loading placeholder — no gradient, just a pulse animation */
export default function Skeleton({ className = '', ...props }) {
    return (
        <div
            aria-hidden="true"
            className={cn('animate-pulse rounded-md bg-border', className)}
            {...props}
        />
    )
}

/** Pre-built skeleton for a doctor card */
export function DoctorCardSkeleton() {
    return (
        <div className="bg-surface rounded-lg shadow-1 p-4 space-y-3">
            <div className="flex gap-3 items-center">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-11 w-full rounded-md" />
        </div>
    )
}

/** Skeleton for an appointment row */
export function AppointmentRowSkeleton() {
    return (
        <div className="bg-surface rounded-lg shadow-1 p-4 flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-md" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-7 w-20 rounded-pill" />
        </div>
    )
}

/** Skeleton for stats cards */
export function StatCardSkeleton() {
    return (
        <div className="bg-surface rounded-lg shadow-1 p-4 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-8 w-1/2" />
        </div>
    )
}
