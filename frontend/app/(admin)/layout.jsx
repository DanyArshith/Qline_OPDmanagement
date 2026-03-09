'use client'

import Navbar from '@/components/layout/Navbar'
import { useSocketConnection } from '@/hooks/useSocket'

function SocketConnector() {
    useSocketConnection()
    return null
}

export default function AdminLayout({ children }) {
    return (
        <>
            <SocketConnector />
            <div className="min-h-screen bg-bg">
                <Navbar />
                <main className="max-w-[1200px] mx-auto px-4 py-8">
                    {children}
                </main>
            </div>
        </>
    )
}
