import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './store';

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://api.qbapp.online/api/v1'
      : 'http://localhost:3000/api/v1'),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const { token, customerId } = useAuthStore.getState();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (customerId) {
        config.headers['x-customer-id'] = customerId;
        config.headers['x-tenant-id'] = customerId;
      }

    }
    
    // Log API Request
    console.log(`=========================================`);
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`Headers:`, config.headers);
    if (config.data) {
      console.log(`Payload:`, config.data);
    }
    console.log(`=========================================`);

    return config;
  },
  (error) => {
    console.error(`[API Request Error]`, error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Log API Response
    console.log(`-----------------------------------------`);
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status}`);
    console.log(`Data:`, response.data);
    console.log(`-----------------------------------------`);
    return response.data;
  },
  (error) => {
    // Log API Error
    console.log(`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`);
    console.log(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${error.response?.status}`);
    console.log(`Error Data:`, error.response?.data || error.message);
    console.log(`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`);

    let message = 'An unexpected error occurred';
    
    if (error && error.response && error.response.data) {
      const dataMsg = error.response.data.message;
      if (typeof dataMsg === 'string') {
        message = dataMsg;
      } else if (Array.isArray(dataMsg) && dataMsg.length > 0) {
        message = typeof dataMsg[0] === 'string' ? dataMsg[0] : JSON.stringify(dataMsg[0]);
      } else if (typeof dataMsg === 'object') {
        message = JSON.stringify(dataMsg);
      }
    } else if (error && typeof error.message === 'string' && error.message.trim().length > 0) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // Do not show toast if error is an Event object or empty
    if (typeof message === 'string' && message !== '[object Event]' && message !== '[object Object]') {
      if (typeof window !== 'undefined' && error?.response?.status === 401) {
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      } else {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
