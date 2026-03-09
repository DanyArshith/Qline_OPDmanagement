'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Input = forwardRef(function Input(
    { label, error, hint, className = '', id, required, ...props },
    ref
) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-body font-medium text-text-primary"
                >
                    {label}
                    {required && <span className="text-error ml-0.5">*</span>}
                </label>
            )}
            <input
                ref={ref}
                id={inputId}
                required={required}
                className={cn(
                    'h-11 w-full rounded-md border px-4 bg-surface text-text-primary',
                    'text-body placeholder:text-text-secondary',
                    'transition-colors duration-200 outline-none',
                    'focus:border-primary focus:ring-2 focus:ring-primary/10',
                    error
                        ? 'border-error focus:border-error focus:ring-error/10'
                        : 'border-border',
                    className
                )}
                {...props}
            />
            {error && <p className="text-caption text-error">{error}</p>}
            {hint && !error && <p className="text-caption text-text-secondary">{hint}</p>}
        </div>
    )
})

export default Input
