'use client'

import { useState } from 'react'
import { cn, formatTime, getInitials } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'

export default function QueueControlPanel({
    currentAppointment,
    queueState,
    onCallNext,
    onComplete,
    onNoShow,
    onPause,
    onResume,
    loading = {},
}) {
    const [confirm, setConfirm] = useState(null) // { action, label }
    const isPaused = queueState?.status === 'paused'

    const handleAction = (action) => {
        const map = {
            complete: { action: 'complete', label: 'Mark as Completed' },
            no_show: { action: 'no_show', label: 'Mark as No-Show' },
        }
        setConfirm(map[action])
    }

    const executeConfirm = async () => {
        if (confirm?.action === 'complete') await onComplete()
        if (confirm?.action === 'no_show') await onNoShow()
        setConfirm(null)
    }

    return (
        <>
            <div className="bg-surface rounded-lg shadow-1 p-5 space-y-5">
                {/* Live stats */}
                <div className="grid grid-cols-3 gap-0 divide-x divide-border text-center">
                    <StatCell label="Serving" value={queueState?.currentToken ?? '—'} />
                    <StatCell label="Waiting" value={queueState?.waitingCount ?? 0} />
                    <StatCell
                        label="Status"
                        value={
                            <Badge status={queueState?.status ?? 'active'} />
                        }
                    />
                </div>

                {/* Current patient */}
                {currentAppointment ? (
                    <div className="flex items-center gap-3 p-3 bg-primary-soft rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-semibold text-body flex items-center justify-center shrink-0">
                            {getInitials(currentAppointment.patientId?.name || '?')}
                        </div>
                        <div className="min-w-0">
                            <p className="text-body-lg font-semibold text-text-primary truncate">
                                {currentAppointment.patientId?.name || 'Unknown'}
                            </p>
                            <p className="text-caption text-text-secondary">
                                Token #{currentAppointment.tokenNumber} ·{' '}
                                {formatTime(currentAppointment.slotStart)}
                            </p>
                        </div>
                        <Badge status={currentAppointment.priority || 'standard'} className="ml-auto" />
                    </div>
                ) : (
                    <div className="text-center py-4 text-text-secondary text-body">
                        No patient currently being seen
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <Button
                        fullWidth
                        onClick={onCallNext}
                        loading={loading.callNext}
                        disabled={isPaused || !!currentAppointment}
                    >
                        Call Next Patient
                    </Button>

                    {currentAppointment && (
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => handleAction('complete')}
                                loading={loading.complete}
                            >
                                ✓ Complete
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => handleAction('no_show')}
                                loading={loading.noShow}
                            >
                                ✗ No-Show
                            </Button>
                        </div>
                    )}

                    <Button
                        variant={isPaused ? 'primary' : 'secondary'}
                        fullWidth
                        onClick={isPaused ? onResume : onPause}
                        loading={loading.pause}
                    >
                        {isPaused ? '▶ Resume Queue' : '⏸ Pause Queue'}
                    </Button>
                </div>
            </div>

            <ConfirmModal
                isOpen={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={executeConfirm}
                title={confirm?.label}
                message="This action cannot be undone."
                confirmLabel="Yes, confirm"
                loading={loading.complete || loading.noShow}
            />
        </>
    )
}

function StatCell({ label, value }) {
    return (
        <div className="px-4 py-2">
            <p className="text-caption text-text-secondary mb-1">{label}</p>
            <div className="text-h2 font-semibold text-text-primary">{value}</div>
        </div>
    )
}
