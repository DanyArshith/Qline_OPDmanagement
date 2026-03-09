'use client'

import { cn } from '@/lib/utils'

export default function Pagination({ page, pages, onPageChange, loading = false }) {
    if (pages <= 1) return null

    const prev = page - 1
    const next = page + 1

    const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1)
    // Show at most 5 page numbers around current
    const visible = pageNumbers.filter(
        (p) => p === 1 || p === pages || Math.abs(p - page) <= 2
    )

    return (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-1 mt-6">
            <PageBtn
                disabled={page <= 1 || loading}
                onClick={() => onPageChange(prev)}
                aria-label="Previous page"
            >
                ‹
            </PageBtn>

            {visible.map((p, i) => {
                const prev = visible[i - 1]
                return (
                    <>
                        {prev && p - prev > 1 && (
                            <span key={`ellipsis-${p}`} className="px-2 text-text-secondary text-body">
                                …
                            </span>
                        )}
                        <PageBtn
                            key={p}
                            active={p === page}
                            disabled={loading}
                            onClick={() => p !== page && onPageChange(p)}
                        >
                            {p}
                        </PageBtn>
                    </>
                )
            })}

            <PageBtn
                disabled={page >= pages || loading}
                onClick={() => onPageChange(next)}
                aria-label="Next page"
            >
                ›
            </PageBtn>
        </nav>
    )
}

function PageBtn({ children, active, disabled, onClick, ...props }) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'w-9 h-9 rounded-sm text-body font-medium transition-colors duration-200',
                'flex items-center justify-center',
                active
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-primary-soft hover:text-primary',
                disabled && 'opacity-40 cursor-not-allowed'
            )}
            {...props}
        >
            {children}
        </button>
    )
}
