import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load session on startup
    const token = localStorage.getItem('token');
    const userProfile = localStorage.getItem('userProfile');
    
    if (token && userProfile) {
      try {
        const profile = JSON.parse(userProfile);
        setCurrentUser({
          token,
          ...profile
        });
      } catch (e) {
        console.error('Error parsing stored user profile:', e);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/login`, {
        email,
        password
      });
      
      const { idToken, localId, name, carbonBudget, streak, badges } = response.data;
      
      const profile = {
        uid: localId,
        email,
        name,
        carbonBudget,
        streak,
        badges
      };
      
      localStorage.setItem('token', idToken);
      localStorage.setItem('userProfile', JSON.stringify(profile));
      
      setCurrentUser({
        token: idToken,
        ...profile
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || error.message || 'Login failed';
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password, carbonBudget) => {
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/signup`, {
        name,
        email,
        password,
        carbonBudget: parseFloat(carbonBudget) || 15.0
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || error.message || 'Registration failed';
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    setCurrentUser(null);
  };

  const updateProfile = (updates) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      
      const newProfile = {
        ...prev,
        ...updates
      };
      
      // Save updated profile details to storage (omitting token)
      const storageProfile = { ...newProfile };
      delete storageProfile.token;
      localStorage.setItem('userProfile', JSON.stringify(storageProfile));
      
      return newProfile;
    });
  };

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
