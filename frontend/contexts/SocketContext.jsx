'use client'

import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { getAccessToken } from '@/lib/tokenStore'

export const SocketContext = createContext(null)

/* ── Explicit socket event contract ─────────────────────────────────────────
 *
 * Server → Client (listeners):
 *   queue:updated         { queue, currentToken, waitingCount, status }
 *   queue:position-update { position, estimatedWait, appointmentId }
 *   notification          { type, title, message, data }
 *
 * Client → Server (emits — used for supplementary real-time signaling):
 *   join:doctor-room      { doctorId, date: 'YYYY-MM-DD' }
 *   leave:doctor-room     { doctorId, date: 'YYYY-MM-DD' }
 *   queue:call-next       { doctorId, date }
 *   queue:complete        { doctorId, date }
 *   queue:no-show         { doctorId, date }
 *   queue:pause           { doctorId, date }
 *
 * Note: queue mutations are also performed via REST API for persistence.
 * ─────────────────────────────────────────────────────────────────────────── */

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export function SocketProvider({ children }) {
    const socketRef = useRef(null)
    const [connected, setConnected] = useState(false)
    const currentRoom = useRef(null) // { doctorId, date }

    /* ── Connect with JWT ─────────────────────────────────────────────────────── */
    const connect = useCallback(() => {
        const token = getAccessToken()
        if (!token || socketRef.current?.connected) return

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        })

        socket.on('connect', () => {
            setConnected(true)
            // Rejoin room if we had one (after reconnect)
            if (currentRoom.current) {
                socket.emit('join:doctor-room', currentRoom.current)
            }
        })
        socket.on('disconnect', () => setConnected(false))
        socket.on('connect_error', (err) => console.warn('[Socket] connect error:', err.message))

        socketRef.current = socket
    }, [])

    /* ── Disconnect ───────────────────────────────────────────────────────────── */
    const disconnect = useCallback(() => {
        socketRef.current?.disconnect()
        socketRef.current = null
        currentRoom.current = null
        setConnected(false)
    }, [])

    /* ── Join a doctor room ───────────────────────────────────────────────────── */
    const joinRoom = useCallback((doctorId, date) => {
        if (!doctorId || !date) return
        const dateStr = date instanceof Date
            ? date.toISOString().split('T')[0]
            : String(date).split('T')[0]
        const payload = { doctorId, date: dateStr }
        currentRoom.current = payload
        socketRef.current?.emit('join:doctor-room', payload)
    }, [])

    /* ── Leave current room ───────────────────────────────────────────────────── */
    const leaveRoom = useCallback(() => {
        if (currentRoom.current) {
            socketRef.current?.emit('leave:doctor-room', currentRoom.current)
            currentRoom.current = null
        }
    }, [])

    /* ── Generic emit ─────────────────────────────────────────────────────────── */
    const emit = useCallback((event, data) => {
        socketRef.current?.emit(event, data)
    }, [])

    /* ── Subscribe to an event (returns unsubscribe fn) ─────────────────────── */
    const on = useCallback((event, handler) => {
        socketRef.current?.on(event, handler)
        return () => socketRef.current?.off(event, handler)
    }, [])

    /* ── Cleanup on unmount ───────────────────────────────────────────────────── */
    useEffect(() => () => disconnect(), [disconnect])

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, connected, connect, disconnect, joinRoom, leaveRoom, emit, on }}>
            {children}
        </SocketContext.Provider>
    )
}
