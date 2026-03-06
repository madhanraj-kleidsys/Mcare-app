import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../utils/tokenStorage';

const baseURl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.117:3000'
// Base configuration
const api = axios.create({
    baseURL: `${baseURl}/api`, 
    headers: {
        'Content-Type': 'application/json',
    },
});

// 1. Request Interceptor: Add Access Token to every request
api.interceptors.request.use(
    async (config) => {
        const token = await getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. Response Interceptor: Handle 403/401 errors (Token Expiry)
api.interceptors.response.use(
    (response) => response, // If success, just return response
    async (error) => {
        const originalRequest = error.config;

        // If error is 403/401 and we haven't tried refreshing yet
        if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
            originalRequest._retry = true; // Mark as retried so we don't loop forever

            try {
                const refreshToken = await getRefreshToken();
                if (!refreshToken) throw new Error("No refresh token");

                // Call the Refresh Endpoint
                const res = await axios.post(`${baseURl}/api/auth/refresh`, {
                    refreshToken: refreshToken
                });

                if (res.data.accessToken) {
                    // Save the new tokens (Rotation)
                    await saveTokens(res.data.accessToken, res.data.refreshToken);

                    // Update the header for the failed request
                    originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
                    
                    // Retry the original request
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // If refresh fails (e.g., token expired), logout user
                console.error("Session expired:", refreshError);
                await clearTokens();
                // Navigate to Login Screen (You can emit an event here or use Context)
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;