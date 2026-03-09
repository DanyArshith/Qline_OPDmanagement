'use client'

import { useCallback, useEffect, useState } from 'react'
import api from '@/lib/api'
import { DEPARTMENTS, PAGE_SIZE } from '@/lib/utils'
import { usePagination } from '@/hooks/usePagination'
import DoctorCard from '@/components/features/DoctorCard'
import { DoctorCardSkeleton } from '@/components/ui/Skeleton'
import Pagination from '@/components/ui/Pagination'
import Input from '@/components/ui/Input'

const SKELETONS = Array.from({ length: 6 })

export default function DoctorsPage() {
    const [search, setSearch] = useState('')
    const [dept, setDept] = useState('')
    const [query, setQuery] = useState({ search: '', dept: '' })

    const fetchDoctors = useCallback(
        (page, limit) =>
            api.get('/api/doctors', {
                params: { q: query.search, department: query.dept, page, limit },
            }),
        [query]
    )

    const { data: doctors, page, pages, loading, error, fetch, goToPage } = usePagination(
        fetchDoctors,
        PAGE_SIZE
    )

    // Initial load + reload on query change
    useEffect(() => { fetch(1) }, [fetch])

    const handleSearch = (e) => {
        e.preventDefault()
        setQuery({ search, dept })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-h1 text-text-primary">Find a Doctor</h1>
                <p className="text-body text-text-secondary mt-1">
                    Book appointments with verified doctors
                </p>
            </div>

            {/* Filters */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <Input
                    placeholder="Search by name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1"
                />
                <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="h-11 px-4 rounded-md border border-border bg-surface text-body text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-colors"
                >
                    <option value="">All Departments</option>
                    {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
                <button
                    type="submit"
                    className="h-11 px-6 rounded-md bg-primary text-white text-body font-medium hover:bg-primary/90 transition-colors"
                >
                    Search
                </button>
            </form>

            {/* Error */}
            {error && (
                <div className="text-center py-8 text-error text-body">{error}</div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading
                    ? SKELETONS.map((_, i) => <DoctorCardSkeleton key={i} />)
                    : doctors.map((d) => <DoctorCard key={d._id} doctor={d} />)}
            </div>

            {/* Empty state */}
            {!loading && !error && doctors.length === 0 && (
                <div className="text-center py-16 space-y-2">
                    <p className="text-h3 text-text-secondary">No doctors found</p>
                    <p className="text-body text-text-secondary">
                        Try a different search or department
                    </p>
                </div>
            )}

            <Pagination page={page} pages={pages} onPageChange={goToPage} loading={loading} />
        </div>
    )
}
