'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import api from '@/lib/api'
import Navbar from '@/components/layout/Navbar'
import { useSocketConnection } from '@/hooks/useSocket'
import Spinner from '@/components/ui/Spinner'

function SocketConnector() {
    useSocketConnection()
    return null
}

export default function DoctorLayout({ children }) {
    const router = useRouter()
    const pathname = usePathname()
    const [verifying, setVerifying] = useState(true)

    useEffect(() => {
        let mounted = true
        api.get('/api/doctors/my-schedule')
            .then((r) => {
                const doc = r.data?.data ?? r.data?.doctor ?? r.data
                if (!mounted) return
                if (doc && !doc.isConfigured && !pathname.includes('/doctor/configure')) {
                    router.replace('/doctor/configure')
                } else {
                    setVerifying(false)
                }
            })
            .catch(() => {
                if (mounted) {
                    if (!pathname.includes('/doctor/configure')) {
                        router.replace('/doctor/configure')
                    } else {
                        setVerifying(false)
                    }
                }
            })
        return () => { mounted = false }
    }, [pathname, router])

    if (verifying && !pathname.includes('/doctor/configure')) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-bg">
                <Spinner size="lg" className="text-primary" />
            </div>
        )
    }

    return (
        <>
            <SocketConnector />
            <div className="min-h-screen bg-bg">
                <Navbar />
                <main className="section-shell">
                    {children}
                </main>
            </div>
        </>
    )
}
