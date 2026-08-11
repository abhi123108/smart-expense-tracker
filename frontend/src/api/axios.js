import axios from 'axios';

const api = axios.create({
  baseURL: 'https://smart-expense-tracker-jx92.onrender.com/api',
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');

  if (userInfo) {
    const { token } = JSON.parse(userInfo);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;