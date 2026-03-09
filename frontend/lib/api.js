import axios from 'axios'
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // sends httpOnly refresh token cookie automatically
    headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor: inject access token ─────────────────────────────
api.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// ─── Response interceptor: handle 401 → refresh → retry ──────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
    failedQueue = []
}

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config

        if (error.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                })
                    .then((token) => {
                        original.headers.Authorization = `Bearer ${token}`
                        return api(original)
                    })
                    .catch((err) => Promise.reject(err))
            }

            original._retry = true
            isRefreshing = true

            try {
                const RT_KEY = 'qline_rt'
                const refreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem(RT_KEY) : null
                const res = await axios.post(
                    `${BASE_URL}/api/auth/refresh`,
                    { refreshToken: refreshToken || '' },
                    { withCredentials: true }
                )
                const { accessToken } = res.data?.data || res.data
                setAccessToken(accessToken)
                processQueue(null, accessToken)
                original.headers.Authorization = `Bearer ${accessToken}`
                return api(original)
            } catch (refreshError) {
                processQueue(refreshError, null)
                clearAccessToken()
                if (typeof document !== 'undefined') {
                    document.cookie = 'qline_role=; Max-Age=0; path=/'
                    window.location.href = '/login'
                }
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

export default api
