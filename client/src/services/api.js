import axios from 'axios';

// Create an Axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
  withCredentials: true, // Crucial for httpOnly cookie transport
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
