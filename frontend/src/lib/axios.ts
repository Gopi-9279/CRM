import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
  withCredentials: true, // For refresh token cookie if we use one
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401s and stub refresh token logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Here we would call the refresh token endpoint
        // const res = await axios.post('http://localhost:4000/api/v1/auth/refresh', {}, { withCredentials: true });
        // const { access_token } = res.data;
        // localStorage.setItem('access_token', access_token);
        // originalRequest.headers.Authorization = `Bearer ${access_token}`;
        // return api(originalRequest);
        
        // For now, if 401 occurs and refresh fails/is not implemented:
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
