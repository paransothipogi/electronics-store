import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, testConnection } from '../services/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        error: null
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        user: null,
        token: null
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,
  isConnected: false
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Test API connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const result = await testConnection();
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: result.connected });
      
      if (result.connected) {
        console.log('✅ API Connected successfully');
        // If we have a token, verify it
        const token = localStorage.getItem('token');
        if (token) {
          await checkAuthStatus();
        }
      } else {
        console.error('❌ API Connection failed:', result.error);
      }
    };

    checkConnection();
  }, []);

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await authAPI.getProfile();
      
      if (result.success) {
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { 
            user: result.data.user, 
            token: localStorage.getItem('token') 
          } 
        });
      } else {
        localStorage.removeItem('token');
        dispatch({ type: 'LOGIN_ERROR', payload: 'Authentication failed' });
      }
    } catch (error) {
      localStorage.removeItem('token');
      dispatch({ type: 'LOGIN_ERROR', payload: 'Authentication failed' });
    }
  };

  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await authAPI.login(credentials);
      
      if (result.success) {
        const { user, token } = result.data;
        localStorage.setItem('token', token);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        return { success: true, user };
      } else {
        dispatch({ type: 'LOGIN_ERROR', payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Login failed. Please try again.';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await authAPI.register(userData);
      
      if (result.success) {
        const { user, token } = result.data;
        localStorage.setItem('token', token);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        return { success: true, user };
      } else {
        dispatch({ type: 'LOGIN_ERROR', payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Registration failed. Please try again.';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    await authAPI.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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

export default AuthContext;
