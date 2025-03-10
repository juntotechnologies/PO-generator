import axios from 'axios';

// Determine the base URL based on the environment
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  const frontendPort = window.location.port;
  
  // If we're on the production frontend port (4567), use the production backend port (8001)
  // Otherwise, use the development backend port (8000)
  const backendPort = frontendPort === '4567' ? '8001' : '8000';
  
  return `http://${hostname}:${backendPort}`;
};

// Configure axios
axios.defaults.baseURL = getBaseUrl();

export default axios; 