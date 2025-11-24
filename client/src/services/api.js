import axios from 'axios';

const API_URL = "https://chatting-1-iel1.onrender.com";

const api = axios.create({
    baseURL: API_URL
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data);
        return Promise.reject(error);
    }
);

export const authAPI = {
    register: (username, email, password) =>
        api.post('/api/auth/register', { username, email, password }),
    login: (email, password) =>
        api.post('/api/auth/login', { email, password }),
    getUsers: () => api.get('/api/auth/users')
};

export const messageAPI = {
    getMessages: (userId) => api.get(`/api/messages/${userId}`),
    sendMessage: (receiver, text) =>
        api.post('/api/messages', { receiver, text })
};

export default api;