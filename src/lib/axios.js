import axios from 'axios';
import useAuthStore from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://verbafest-dummy.onrender.com/api';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
    (config) => {
        // Get token from Zustand persist storage
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            try {
                const { state } = JSON.parse(authStorage);
                if (state?.token) {
                    config.headers.Authorization = `Bearer ${state.token}`;
                }
            } catch (error) {
                console.error('Error parsing auth storage:', error);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only handle 401 errors that are actual authentication failures
        // Don't logout for missing endpoints (404) or other errors
        if (error.response?.status === 401 && error.response?.data?.message?.toLowerCase().includes('token')) {
            console.warn('Authentication failed: Invalid or expired token. Logging out...', error.response?.data?.message);
            // Unauthorized - clear auth and redirect to appropriate login
            const authStorage = localStorage.getItem('auth-storage');
            let userRole = null;

            if (authStorage) {
                try {
                    const { state } = JSON.parse(authStorage);
                    userRole = state?.userRole;
                } catch (e) {
                    console.error('Error parsing auth storage:', e);
                }
            }

            // Clear auth state
            useAuthStore.getState().logout();

            // Redirect to appropriate login page
            const redirectUrl = userRole === 'admin' ? '/admin/login' : (userRole === 'participant' ? '/participant/login' : '/admin/login');
            console.log(`Redirecting to: ${redirectUrl}`);
            window.location.href = redirectUrl;
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
