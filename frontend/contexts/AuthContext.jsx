'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { setAccessToken, clearAccessToken } from '@/lib/tokenStore'
import { ROLE_DASHBOARDS } from '@/lib/utils'

export const AuthContext = createContext(null)

/* ── Cookie helpers (non-httpOnly, readable by middleware) ─────────────────── */
const setRoleCookie = (role) => {
    const maxAge = 7 * 24 * 60 * 60 // 7 days
    document.cookie = `qline_role=${role}; path=/; SameSite=Lax; Max-Age=${maxAge}`
}
const clearRoleCookie = () => {
    document.cookie = 'qline_role=; path=/; Max-Age=0'
}

/* ── localStorage key for refresh token ────────────────────────────────────── */
const RT_KEY = 'qline_rt'
const saveRefreshToken = (token) => localStorage.setItem(RT_KEY, token)
const loadRefreshToken = () => (typeof localStorage !== 'undefined' ? localStorage.getItem(RT_KEY) : null)
const removeRefreshToken = () => localStorage.removeItem(RT_KEY)

/* ── Normalize auth response (supports { data: {...} } or flat) ────────────── */
const normalizeAuthData = (resData) => resData?.data ?? resData

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true) // true until session restore attempt
    const router = useRouter()

    /* ── Restore session on mount ──────────────────────────────────────────────── */
    useEffect(() => {
        ; (async () => {
            const refreshToken = loadRefreshToken()
            if (!refreshToken) {
                setIsLoading(false)
                return
            }
            try {
                const res = await api.post('/api/auth/refresh', { refreshToken })
                const { accessToken, user: userData } = normalizeAuthData(res.data)
                // Refresh endpoint only returns a new accessToken, not user data
                // If no userData returned, decode from token (skip — user stays null until they login again)
                if (accessToken) {
                    setAccessToken(accessToken)
                }
                if (userData) {
                    setUser(userData)
                    setRoleCookie(userData.role)
                }
            } catch {
                clearAccessToken()
                clearRoleCookie()
                removeRefreshToken()
                setUser(null)
            } finally {
                setIsLoading(false)
            }
        })()
    }, [])

    /* ── Login ─────────────────────────────────────────────────────────────────── */
    const login = useCallback(
        async (email, password) => {
            const res = await api.post('/api/auth/login', { email, password })
            const { accessToken, refreshToken, user: userData } = normalizeAuthData(res.data)
            setAccessToken(accessToken)
            if (refreshToken) saveRefreshToken(refreshToken)
            setUser(userData)
            setRoleCookie(userData.role)
            router.push(ROLE_DASHBOARDS[userData.role] || '/')
            return userData
        },
        [router]
    )

    /* ── Logout ────────────────────────────────────────────────────────────────── */
    const logout = useCallback(async () => {
        const refreshToken = loadRefreshToken()
        try {
            if (refreshToken) {
                await api.post('/api/auth/logout', { refreshToken })
            }
        } catch {
            /* ignore — clear state regardless */
        } finally {
            clearAccessToken()
            clearRoleCookie()
            removeRefreshToken()
            setUser(null)
            router.push('/login')
        }
    }, [router])

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

/* ── Convenience hook ───────────────────────────────────────────────────────── */
export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
