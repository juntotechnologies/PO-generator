import axios from 'axios';

// Determine the base URL based on the environment
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  const frontendPort = window.location.port;
  
  // Log the current hostname and port for debugging
  console.log('Current hostname:', hostname);
  console.log('Current frontend port:', frontendPort);
  
  // Always use the correct backend port regardless of environment
  // Development: 8000, Production: 8001
  const backendPort = frontendPort === '4567' ? '8001' : '8000';
  
  // Use the same hostname that the user is accessing the frontend with
  const baseUrl = `http://${hostname}:${backendPort}`;
  console.log('Using backend URL:', baseUrl);
  return baseUrl;
};

// Configure axios with the base URL
const baseURL = getBaseUrl();
axios.defaults.baseURL = baseURL;

// Add request interceptor for debugging
axios.interceptors.request.use(
  config => {
    console.log('Axios Request:', config.method.toUpperCase(), config.url, config.data);
    return config;
  },
  error => {
    console.error('Axios Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axios.interceptors.response.use(
  response => {
    console.log('Axios Response:', response.status, response.data);
    return response;
  },
  error => {
    console.error('Axios Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default axios; 