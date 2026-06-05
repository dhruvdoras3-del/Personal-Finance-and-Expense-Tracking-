import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  // Base API configuration
  axios.defaults.baseURL = 'http://localhost:5000/api';

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  // Periodically fetch bill due alerts if logged in
  useEffect(() => {
    if (!user) return;
    
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 45000); // every 45s
    return () => clearInterval(interval);
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get('/auth/profile');
      setUser(res.data);
    } catch (err) {
      console.error('Session expired or invalid token:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('/reminders/alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      await axios.delete(`/reminders/alerts/${alertId}`);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (name, email, password) => {
    const res = await axios.post('/auth/register', { name, email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  // Google OAuth Login Simulation
  const loginWithGoogle = async (googleUser) => {
    // googleUser details: { email, name, googleId, profilePic }
    const res = await axios.post('/auth/google', googleUser);
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setAlerts([]);
  };

  const updateProfile = async (updates) => {
    const res = await axios.put('/auth/profile', updates);
    setUser(res.data);
    return res.data;
  };

  const value = {
    user,
    token,
    loading,
    alerts,
    dismissAlert,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
    triggerAlertsFetch: fetchAlerts
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
