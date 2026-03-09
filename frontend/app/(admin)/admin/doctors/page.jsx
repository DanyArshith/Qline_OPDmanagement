'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { DEPARTMENTS, PAGE_SIZE } from '@/lib/utils'

export default function AdminDoctorsPage() {
    const toast = useToast()
    const [dept, setDept] = useState('')
    const [query, setQuery] = useState({ dept: '' })

    const fetchDoctors = useCallback(async (page, limit) => {
        const r = await api.get('/api/admin/doctors', {
            params: { page, limit, ...(query.dept && { department: query.dept }) }
        })
        const raw = r.data
        return { data: { data: raw.doctors ?? [], total: raw.pagination?.total ?? 0, pages: raw.pagination?.pages ?? 1 } }
    }, [query])

    const { data: doctors, page, pages, loading, fetch, goToPage } = usePagination(fetchDoctors, PAGE_SIZE)
    useEffect(() => { fetch(1) }, [fetch])

    const applyFilter = (e) => { e.preventDefault(); setQuery({ dept }) }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-h1 text-text-primary">Doctor Management</h1>
                <p className="text-body text-text-secondary">All doctors registered in the system</p>
            </div>

            <form onSubmit={applyFilter} className="flex gap-3">
                <select value={dept} onChange={e => setDept(e.target.value)}
                    className="h-11 px-3 rounded-md border border-border bg-surface text-body text-text-primary focus:border-primary outline-none">
                    <option value="">All Departments</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <Button type="submit" variant="secondary" size="sm">Filter</Button>
            </form>

            <Card padding={false}>
                <div className="overflow-x-auto">
                    <table className="w-full text-body">
                        <thead>
                            <tr className="border-b border-border text-caption text-text-secondary uppercase tracking-wide">
                                <th className="text-left px-4 py-3">Doctor</th>
                                <th className="text-left px-4 py-3 hidden sm:table-cell">Department</th>
                                <th className="text-left px-4 py-3 hidden md:table-cell">Total Appointments</th>
                                <th className="text-left px-4 py-3 hidden lg:table-cell">Joined</th>
                                <th className="text-right px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 5 }).map((__, j) => (
                                        <td key={j} className="px-4 py-3"><div className="h-4 bg-border rounded animate-pulse" /></td>
                                    ))}</tr>
                                ))
                                : doctors.map(d => (
                                    <tr key={d._id} className="hover:bg-bg transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-text-primary">{d.userId?.name ?? '—'}</p>
                                            <p className="text-caption text-text-secondary">{d.userId?.email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">{d.department ?? '—'}</td>
                                        <td className="px-4 py-3 text-primary font-medium hidden md:table-cell">{d.stats?.totalAppointments ?? 0}</td>
                                        <td className="px-4 py-3 text-text-secondary text-caption hidden lg:table-cell">{formatDate(d.createdAt)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/admin/doctors/${d._id}`}>
                                                <Button variant="secondary" size="sm">View</Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                    {!loading && doctors.length === 0 && (
                        <p className="text-center text-text-secondary py-8">No doctors found</p>
                    )}
                </div>
                <div className="p-4">
                    <Pagination page={page} pages={pages} onPageChange={goToPage} loading={loading} />
                </div>
            </Card>
        </div>
    )
}
