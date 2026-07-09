import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const login = (email, password) => api.post('/api/auth/login', { email, password });
export const signup = (name, email, password, carbonBudget) =>
  api.post('/api/auth/signup', { name, email, password, carbonBudget: parseFloat(carbonBudget)  });

export const logTravel = (distance, transportMode, passengerCount, date) =>
  api.post('/api/logs/travel', { distance, transportMode, passengerCount, date });

export const logFood = (dietType, foodWasteToggle, date) =>
  api.post('/api/logs/food', { dietType, foodWasteToggle, date });

export const logEnergy = (electricityUsage, gasUsage, renewablePercentage, date) =>
  api.post('/api/logs/energy', { electricityUsage, gasUsage, renewablePercentage, date });

export const getDashboard = () => api.get('/api/dashboard');
export const getHistory = (startDate, endDate) => {
  let url = '/api/history';
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  }
  return api.get(url);
};

export const getSuggestions = (date) => api.post('/api/suggestions', { date });

export const getBadges = () => api.get('/api/badges');

export const downloadReport = async (month) => {
  try {
    const response = await api.get(`/api/report?month=${month}`, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `EcoTrack_Report_${month}.pdf`);
    document.body.appendChild(link);
    link.click();

    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Failed to download report:', error);
    throw error;
  }
};

export default api;
