'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useToasts, useToastDismiss } from '@/hooks/useToast'

const TYPE_STYLES = {
    success: 'border-l-success bg-success/5 text-success',
    error: 'border-l-error   bg-error/5   text-error',
    warning: 'border-l-warning bg-warning/5 text-warning',
    info: 'border-l-info    bg-info/5    text-info',
}

const TYPE_ICONS = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
}

function ToastItem({ id, type, message }) {
    const [visible, setVisible] = useState(false)
    const dismiss = useToastDismiss()

    useEffect(() => {
        // Small delay to trigger CSS transition
        const t = setTimeout(() => setVisible(true), 10)
        return () => clearTimeout(t)
    }, [])

    const handleDismiss = () => {
        setVisible(false)
        setTimeout(() => dismiss(id), 200)
    }

    return (
        <div
            role="alert"
            aria-live="polite"
            className={cn(
                'flex items-start gap-3 w-80 p-4 rounded-lg shadow-2 border border-border border-l-4',
                'transition-all duration-200',
                visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
                TYPE_STYLES[type] || TYPE_STYLES.info
            )}
        >
            <span className="text-body font-medium mt-0.5">{TYPE_ICONS[type]}</span>
            <p className="flex-1 text-body text-text-primary">{message}</p>
            <button
                onClick={handleDismiss}
                className="text-text-secondary hover:text-text-primary transition-colors text-caption"
                aria-label="Dismiss"
            >
                ✕
            </button>
        </div>
    )
}

/** Mount this once in app/layout.jsx — renders slide-in toasts top-right */
export default function ToastContainer() {
    const toasts = useToasts()

    return (
        <div
            aria-live="assertive"
            className="fixed top-4 right-4 z-[100] flex flex-col gap-2 items-end"
        >
            {toasts.map((t) => (
                <ToastItem key={t.id} {...t} />
            ))}
        </div>
    )
}
