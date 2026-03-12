'use client';

import axios from 'axios';
import mockApiService from './mockApiService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
let useRealAPI = false;

// First-time API check
let apiHealthChecked = false;
async function checkAPIHealth() {
    if (apiHealthChecked) return useRealAPI;
    apiHealthChecked = true;
    
    try {
        const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 2000 });
        useRealAPI = response.status === 200;
        console.log('✅ Real API is available');
    } catch (error) {
        useRealAPI = false;
        console.log('❌ Real API unavailable, using mock API for demo');
    }
    
    return useRealAPI;
}

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
    withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor with fallback to mock API
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // If API fails, return mock data
        if (!useRealAPI || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
            const originalRequest = error.config;        
            // Parse the request and call appropriate mock API
            const method = originalRequest.method.toUpperCase();
            const url = originalRequest.url;
            
            console.log(`Using mock API for: ${method} ${url}`);
            return handleMockRequest(method, url, originalRequest);
        }
        
        return Promise.reject(error);
    }
);

// Handle mock API requests based on URL patterns
function handleMockRequest(method, url, config) {
    try {
        // Remove base URL and parse
        const path = url.replace(API_BASE_URL, '');
        const data = config.data ? JSON.parse(config.data) : {};
        
        // Ensure health endpoint works
        if (path === '/health' || path === '/api/health') {
            return Promise.resolve({ status: 200, data: { status: 'ok' } });
        }
        
        // Auth endpoints
        if (path === '/api/auth/login' && method === 'POST') {
            return mockApiService.login(data.email, data.password).then((result) => ({
                status: 200,
                data: result,
            }));
        }
        
        if (path === '/api/auth/register' && method === 'POST') {
            return mockApiService.register(data).then((result) => ({
                status: 201,
                data: result,
            }));
        }
        
        // Doctors
        if (path.startsWith('/api/doctors') && method === 'GET') {
            if (path.match(/\/\w+$/)) {
                // Get single doctor
                const doctorId = path.split('/').pop();
                return mockApiService.getDoctorById(doctorId).then((result) => ({
                    status: 200,
                    data: result,
                }));
            } else {
                // Get doctors list
                return mockApiService.getDoctors().then((result) => ({
                    status: 200,
                    data: result,
                }));
            }
        }
        
        // Appointments
        if (path.startsWith('/api/appointments')) {
            if (method === 'GET') {
                if (path.match(/\/\w+$/)) {
                    // Get single appointment
                    const aptId = path.split('/').pop();
                    return mockApiService.getAppointmentById(aptId).then((result) => ({
                        status: 200,
                        data: result,
                    }));
                } else {
                    // Get appointments list
                    return mockApiService.getAppointments().then((result) => ({
                        status: 200,
                        data: result,
                    }));
                }
            } else if (method === 'POST') {
                return mockApiService.bookAppointment(data.doctorId, data.slotStart, data.symptoms).then((result) => ({
                    status: 201,
                    data: result,
                }));
            } else if (method === 'DELETE') {
                const aptId = path.split('/').pop();
                return mockApiService.cancelAppointment(aptId, data.reason).then((result) => ({
                    status: 200,
                    data: result,
                }));
            }
        }
        
        // Medical Records
        if (path.startsWith('/api/patient/medical-records') || path.startsWith('/api/medical-records')) {
            if (method === 'GET') {
                if (path.match(/\/\w+$/)) {
                    const recordId = path.split('/').pop();
                    return mockApiService.getMedicalRecordById(recordId).then((result) => ({
                        status: 200,
                        data: result,
                    }));
                } else {
                    return mockApiService.getMedicalRecords().then((result) => ({
                        status: 200,
                        data: result,
                    }));
                }
            }
        }
        
        // Notifications
        if (path.startsWith('/api/notifications')) {
            if (method === 'GET') {
                return mockApiService.getNotifications().then((result) => ({
                    status: 200,
                    data: result,
                }));
            } else if (method === 'PATCH' && path.includes('/read')) {
                const notifId = path.split('/')[3];
                return mockApiService.markNotificationAsRead(notifId).then((result) => ({
                    status: 200,
                    data: result,
                }));
            }
        }
        
        // Dashboard endpoints
        if (path === '/api/patient/dashboard') {
            return mockApiService.getPatientDashboard().then((result) => ({
                status: 200,
                data: result,
            }));
        }
        
        if (path === '/api/doctor/dashboard') {
            return mockApiService.getDoctorDashboard().then((result) => ({
                status: 200,
                data: result,
            }));
        }
        
        if (path === '/api/admin/dashboard') {
            return mockApiService.getAdminDashboard().then((result) => ({
                status: 200,
                data: result,
            }));
        }
        
        // Current user / Profile
        if ((path === '/api/auth/user' || path === '/api/profile') && method === 'GET') {
            return mockApiService.getCurrentUser().then((result) => ({
                status: 200,
                data: result,
            }));
        }
        
        if (path === '/api/profile' && method === 'PUT') {
            return mockApiService.updateProfile(data).then((result) => ({
                status: 200,
                data: result,
            }));
        }
        
        // Default: return mock success
        console.log('Mock API: No handler for', method, path);
        return Promise.resolve({
            status: 200,
            data: { success: true, message: 'Mock API response' },
        });
    } catch (error) {
        console.error('Mock API error:', error);
        return Promise.reject(error);
    }
}

// Initialize API health check on module load
checkAPIHealth().catch(() => {
    console.warn('API health check failed, mock API will be used');
});

export default api;
export { checkAPIHealth };
