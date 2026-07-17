import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configure Axios defaults
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  useEffect(() => {
    const loadProfile = async () => {
      if (token) {
        try {
          const res = await axios.get('/api/auth/profile');
          setUser(res.data);
        } catch (err) {
          console.error("Auth token invalid, logging out:", err);
          logout();
        }
      }
      setLoading(false);
    };
    loadProfile();
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    return user;
  };

  const loginWithOtp = async (phoneNumber, otpCode) => {
    const res = await axios.post('/api/auth/otp/verify', { phone_number: phoneNumber, otp_code: otpCode });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    return user;
  };

  const register = async (name, email, password) => {
    await axios.post('/api/auth/register', { name, email, password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (profileData) => {
    const res = await axios.put('/api/auth/profile', profileData);
    setUser(res.data.user);
    return res.data.user;
  };

  const value = {
    user,
    token,
    loading,
    login,
    loginWithOtp,
    register,
    logout,
    updateProfile,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
