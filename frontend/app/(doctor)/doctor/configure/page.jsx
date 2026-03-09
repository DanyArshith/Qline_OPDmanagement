'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { DEPARTMENTS } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

const DEFAULT_FORM = {
    department: '',
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    defaultConsultTime: 15,
    maxPatientsPerDay: 30,
}

export default function DoctorConfigurePage() {
    const toast = useToast()
    const [form, setForm] = useState(DEFAULT_FORM)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    /* ── Pre-fill existing config ────────────────────────────────────────────── */
    useEffect(() => {
        api.get('/api/doctors/my-schedule')
            .then((r) => {
                const d = r.data?.data ?? r.data?.doctor ?? r.data
                if (!d) return
                setForm({
                    department: d.department ?? '',
                    workingHoursStart: d.workingHours?.start ?? '09:00',
                    workingHoursEnd: d.workingHours?.end ?? '17:00',
                    defaultConsultTime: d.defaultConsultTime ?? 15,
                    maxPatientsPerDay: d.maxPatientsPerDay ?? 30,
                })
            })
            .catch(() => { /* No existing config — that's fine */ })
            .finally(() => setLoading(false))
    }, [])

    const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))
    const setNum = (key) => (e) => setForm((p) => ({ ...p, [key]: Number(e.target.value) }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.department) { toast.error('Please select a department'); return }
        if (form.workingHoursStart >= form.workingHoursEnd) {
            toast.error('End time must be after start time'); return
        }
        setSaving(true)
        try {
            await api.post('/api/doctors/configure', {
                department: form.department,
                workingHours: { start: form.workingHoursStart, end: form.workingHoursEnd },
                defaultConsultTime: Number(form.defaultConsultTime),
                maxPatientsPerDay: Number(form.maxPatientsPerDay),
            })
            toast.success('Schedule saved! Patients can now book slots.')
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.response?.data?.errors?.[0] || 'Save failed')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Spinner size="lg" className="text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div>
                <h1 className="text-h1 text-text-primary">Configure Schedule</h1>
                <p className="text-body text-text-secondary mt-1">
                    Set your working hours and consultation settings so patients can book appointments.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Department */}
                <Card>
                    <CardHeader>
                        <CardTitle>Department</CardTitle>
                    </CardHeader>
                    <select
                        value={form.department}
                        onChange={set('department')}
                        required
                        className="w-full h-11 px-4 rounded-md border border-border bg-surface text-body text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-colors"
                    >
                        <option value="">Select department…</option>
                        {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </Card>

                {/* Working hours */}
                <Card>
                    <CardHeader>
                        <CardTitle>Working Hours</CardTitle>
                    </CardHeader>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">Start time</label>
                            <input
                                type="time"
                                value={form.workingHoursStart}
                                onChange={set('workingHoursStart')}
                                required
                                className="w-full h-11 px-4 rounded-md border border-border bg-surface text-body text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">End time</label>
                            <input
                                type="time"
                                value={form.workingHoursEnd}
                                onChange={set('workingHoursEnd')}
                                required
                                className="w-full h-11 px-4 rounded-md border border-border bg-surface text-body text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-colors"
                            />
                        </div>
                    </div>
                </Card>

                {/* Capacity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Capacity</CardTitle>
                    </CardHeader>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Consultation time (min)"
                            type="number"
                            min={5}
                            max={120}
                            value={form.defaultConsultTime}
                            onChange={setNum('defaultConsultTime')}
                            hint="5 – 120 minutes per patient"
                            required
                        />
                        <Input
                            label="Max patients per day"
                            type="number"
                            min={1}
                            max={200}
                            value={form.maxPatientsPerDay}
                            onChange={setNum('maxPatientsPerDay')}
                            hint="1 – 200 patients"
                            required
                        />
                    </div>
                </Card>

                <Button type="submit" fullWidth loading={saving}>
                    Save Schedule
                </Button>
            </form>
        </div>
    )
}
