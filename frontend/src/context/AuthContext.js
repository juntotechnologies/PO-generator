import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Define logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  // Define fetchUserData function
  const fetchUserData = useCallback(async (token) => {
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      const response = await axios.get('/api/users/me/', config);
      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('AuthContext: Error fetching user data:', error);
      logout();
      setLoading(false);
    }
  }, [logout]);

  // Define refreshToken function
  const refreshToken = useCallback(async () => {
    try {
      const refresh = localStorage.getItem('refreshToken');
      if (!refresh) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post('/api/token/refresh/', {
        refresh
      });

      const { access } = response.data;
      localStorage.setItem('token', access);
      return access;
    } catch (error) {
      console.error('AuthContext: Token refresh error:', error);
      logout();
      throw error;
    }
  }, [logout]);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData(token);
    } else {
      setLoading(false);
    }
  }, [fetchUserData]); // Add fetchUserData as a dependency

  const login = async (username, password) => {
    try {
      console.log('AuthContext: Attempting login for user:', username);
      console.log('AuthContext: Using axios baseURL:', axios.defaults.baseURL);
      
      const response = await axios.post('/api/token/', {
        username,
        password
      });
      
      console.log('AuthContext: Login response received:', response.status);
      
      const { access, refresh } = response.data;
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      
      await fetchUserData(access);
      navigate('/');
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('AuthContext: Login error details:', error);
      console.error('AuthContext: Error response:', error.response?.data);
      
      // Provide more specific error messages based on the error
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 401) {
          errorMessage = 'Invalid username or password.';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid request. Please check your input.';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      toast.error(errorMessage);
      return false;
    }
  };

  const updateUserInfo = (updatedUserData) => {
    // Update the user state with the new data
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUserData
    }));
  };

  // Set up axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const token = await refreshToken();
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axios(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [refreshToken]); // Add refreshToken as a dependency

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
}; 