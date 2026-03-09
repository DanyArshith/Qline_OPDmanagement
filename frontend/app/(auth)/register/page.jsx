'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

const ROLES = [
    { value: 'patient', label: 'Patient', icon: '🏥' },
    { value: 'doctor', label: 'Doctor', icon: '👨‍⚕️' },
]

export default function RegisterPage() {
    const router = useRouter()
    const toast = useToast()

    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    const validate = () => {
        const e = {}
        if (!form.name || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
        if (!form.email) e.email = 'Email is required'
        if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return
        setLoading(true)
        try {
            await api.post('/api/auth/register', form)
            toast.success('Account created! Please sign in.')
            router.push('/login')
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="p-8 space-y-6">
            <div className="text-center space-y-1">
                <h1 className="text-h1 text-primary font-semibold">Qline</h1>
                <p className="text-body text-text-secondary">Create your account</p>
            </div>

            {/* Role selector */}
            <div className="flex gap-2">
                {ROLES.map((r) => (
                    <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, role: r.value }))}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border text-body font-medium',
                            'transition-colors duration-200',
                            form.role === r.value
                                ? 'border-primary bg-primary-soft text-primary'
                                : 'border-border text-text-secondary hover:border-primary'
                        )}
                    >
                        <span>{r.icon}</span>
                        {r.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Input
                    label="Full name"
                    type="text"
                    autoComplete="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    error={errors.name}
                    required
                />
                <Input
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    error={errors.email}
                    required
                />
                <Input
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    error={errors.password}
                    required
                />

                <Button type="submit" fullWidth loading={loading} className="mt-2">
                    Create account
                </Button>
            </form>

            <p className="text-center text-body text-text-secondary">
                Already have an account?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">
                    Sign in
                </Link>
            </p>
        </Card>
    )
}
