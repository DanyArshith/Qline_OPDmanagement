import axios from 'axios'
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Lazy import mock service to avoid circular dependencies
let mockApiService = null
async function getMockService() {
    if (!mockApiService) {
        const mod = await import('./mockApiService.js')
        mockApiService = mod.mockApiService || mod.default
    }
    return mockApiService
}

let useMockAPI = process.env.NODE_ENV === 'development'
let apiHealthChecked = false

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
    timeout: 5000,
})

api.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
}, (error) => Promise.reject(error))

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
    failedQueue = []
}

api.interceptors.response.use(
    (res) => {
        // Mark that API is working
        apiHealthChecked = true
        useMockAPI = false
        return res
    },
    async (error) => {
        const original = error.config || {}
        const requestUrl = String(original.url || '')

        // Check for network errors and fallback to mock API if enabled
        if ((error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) && useMockAPI && !requestUrl.includes('/auth/refresh')) {
            try {
                console.log('🎭 Using mock API for:', original.method, requestUrl)
                return handleMockRequest(original)
            } catch (mockError) {
                console.error('Mock API error:', mockError)
                return Promise.reject(error)
            }
        }

        // Never refresh if refresh request itself failed.
        if (requestUrl.includes('/api/auth/refresh')) {
            return Promise.reject(error)
        }

        if (error.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                })
                    .then((token) => {
                        original.headers = original.headers || {}
                        original.headers.Authorization = `Bearer ${token}`
                        return api(original)
                    })
                    .catch((err) => Promise.reject(err))
            }

            original._retry = true
            isRefreshing = true

            try {
                const res = await axios.post(
                    `${BASE_URL}/api/auth/refresh`,
                    {},
                    { withCredentials: true }
                )

                const { accessToken } = res.data?.data || res.data
                setAccessToken(accessToken)
                processQueue(null, accessToken)

                original.headers = original.headers || {}
                original.headers.Authorization = `Bearer ${accessToken}`
                return api(original)
            } catch (refreshError) {
                processQueue(refreshError, null)
                clearAccessToken()

                if (typeof document !== 'undefined') {
                    document.cookie = 'qline_role=; Max-Age=0; path=/'
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login'
                    }
                }

                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

// Handle mock API requests
async function handleMockRequest(config) {
    const mockService = await getMockService()
    const method = (config.method || 'get').toUpperCase()
    const url = config.url || ''
    const data = config.data ? JSON.parse(config.data) : {}

    // Health check
    if (url.includes('/health')) {
        return Promise.resolve({ status: 200, data: { status: 'ok' } })
    }

    // Auth endpoints
    if (url.includes('/auth/login') && method === 'POST') {
        const result = await mockService.login(data.email, data.password)
        setAccessToken(result.data.accessToken)
        return { status: 200, data: result }
    }

    if (url.includes('/auth/register') && method === 'POST') {
        const result = await mockService.register(data)
        setAccessToken(result.data.accessToken)
        return { status: 201, data: result }
    }

    // Logout
    if (url.includes('/auth/logout')) {
        clearAccessToken()
        return { status: 200, data: { success: true } }
    }

    // Doctors
    if (url.includes('/api/doctors')) {
        if (url.match(/\/\w+$/)) {
            const doctorId = url.split('/').pop()
            const result = await mockService.getDoctorById(doctorId)
            return { status: 200, data: result }
        } else {
            const result = await mockService.getDoctors()
            return { status: 200, data: result }
        }
    }

    // Appointments
    if (url.includes('/api/appointments')) {
        if (method === 'GET') {
            if (url.match(/\/[a-f0-9]{24}$/) || url.match(/\/apt_/)) {
                const aptId = url.split('/').pop()
                const result = await mockService.getAppointmentById(aptId)
                return { status: 200, data: result }
            } else {
                const result = await mockService.getAppointments()
                return { status: 200, data: result }
            }
        } else if (method === 'POST') {
            const result = await mockService.bookAppointment(data.doctorId, data.slotStart, data.symptoms)
            return { status: 201, data: result }
        } else if (method === 'DELETE') {
            const aptId = url.split('/').pop()
            const result = await mockService.cancelAppointment(aptId, data.reason)
            return { status: 200, data: result }
        }
    }

    // Medical Records
    if (url.includes('/medical-records')) {
        if (method === 'GET') {
            if (url.match(/\/[a-f0-9]{24}$/) || url.match(/\/rec_/)) {
                const recordId = url.split('/').pop()
                const result = await mockService.getMedicalRecordById(recordId)
                return { status: 200, data: result }
            } else {
                const result = await mockService.getMedicalRecords()
                return { status: 200, data: result }
            }
        }
    }

    // Notifications
    if (url.includes('/api/notifications')) {
        if (method === 'GET') {
            const result = await mockService.getNotifications()
            return { status: 200, data: result }
        } else if (method === 'PATCH' && url.includes('/read')) {
            const notifId = url.split('/')[4]
            const result = await mockService.markNotificationAsRead(notifId)
            return { status: 200, data: result }
        }
    }

    // Dashboards
    if (url.includes('/patient/dashboard')) {
        const result = await mockService.getPatientDashboard()
        return { status: 200, data: result }
    }

    if (url.includes('/doctor/dashboard')) {
        const result = await mockService.getDoctorDashboard()
        return { status: 200, data: result }
    }

    if (url.includes('/admin/dashboard')) {
        const result = await mockService.getAdminDashboard()
        return { status: 200, data: result }
    }

    // Current user
    if ((url.includes('/auth/user') || url.includes('/profile')) && method === 'GET') {
        const result = await mockService.getCurrentUser()
        return { status: 200, data: result }
    }

    // Update profile
    if (url.includes('/profile') && method === 'PUT') {
        const result = await mockService.updateProfile(data)
        return { status: 200, data: result }
    }

    // Default success response
    return { status: 200, data: { success: true } }
}

export default api
export { useMockAPI }
