'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { formatDate, formatDateTime, timeAgo } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'

export default function DoctorPatientHistoryPage({ params }) {
    const { patientId } = params
    const toast = useToast()
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get(`/api/medical-records/patient/${patientId}`)
            .then(r => {
                const data = r.data?.records ?? r.data?.data ?? r.data
                setRecords(Array.isArray(data) ? data : [])
            })
            .catch(() => toast.error('Failed to load patient history'))
            .finally(() => setLoading(false))
    }, [patientId, toast])

    if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" className="text-primary" /></div>

    const patient = records[0]?.patientId

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <Link href="/doctor/appointments" className="text-caption text-primary hover:underline">← Back</Link>
                <h1 className="text-h1 text-text-primary mt-1">Patient History</h1>
                {patient && (
                    <p className="text-body text-text-secondary">{patient.name ?? 'Patient'}</p>
                )}
            </div>

            {records.length === 0 ? (
                <Card>
                    <p className="text-center text-text-secondary py-8">No medical records found for this patient</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {records.map(record => (
                        <Card key={record._id}>
                            <CardHeader>
                                <div>
                                    <CardTitle>{formatDate(record.date ?? record.createdAt)}</CardTitle>
                                    <p className="text-caption text-text-secondary">{timeAgo(record.createdAt)}</p>
                                </div>
                                <Link href={`/doctor/medical-records/${record._id}/edit`}>
                                    <Button variant="secondary" size="sm">Edit</Button>
                                </Link>
                            </CardHeader>

                            <div className="space-y-3 mt-2">
                                {record.chiefComplaint && (
                                    <div>
                                        <p className="text-caption text-text-secondary uppercase tracking-wide">Chief Complaint</p>
                                        <p className="text-body text-text-primary">{record.chiefComplaint}</p>
                                    </div>
                                )}
                                {record.diagnosis && (
                                    <div>
                                        <p className="text-caption text-text-secondary uppercase tracking-wide">Diagnosis</p>
                                        <p className="text-body text-text-primary">{record.diagnosis}</p>
                                    </div>
                                )}
                                {record.medications?.length > 0 && (
                                    <div>
                                        <p className="text-caption text-text-secondary uppercase tracking-wide">Medications</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {record.medications.map((m, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-caption rounded-full">
                                                    {m.name ?? m}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
