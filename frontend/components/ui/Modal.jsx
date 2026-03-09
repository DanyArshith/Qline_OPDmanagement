'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import Button from './Button'

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
}) {
    // Close on Escape
    useEffect(() => {
        if (!isOpen) return
        const handler = (e) => e.key === 'Escape' && onClose()
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-text-primary/30 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />
            {/* Panel */}
            <div
                className={cn(
                    'relative w-full bg-surface rounded-xl shadow-2 p-6',
                    'animate-in fade-in zoom-in-95 duration-200',
                    widths[size]
                )}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-h3 text-text-primary">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-sm"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
                <div className="text-body text-text-secondary">{children}</div>
                {footer && <div className="mt-6 flex gap-3 justify-end">{footer}</div>}
            </div>
        </div>
    )
}

/** Confirmation modal: asks "Are you sure?" then calls onConfirm */
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', loading = false }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={onConfirm} loading={loading}>
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            {message}
        </Modal>
    )
}
