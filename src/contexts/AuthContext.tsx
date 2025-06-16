import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  isHost: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userDataString = localStorage.getItem('user');

      if (token && userDataString) {
        try {
          // Set token for axios globally if found
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Here you might want to validate the token with the backend
          // For example: const response = await axios.get(`http://localhost:5000/api/users/me`);
          // setUser(response.data.user);
          // For now, we'll trust the localStorage if a token exists from a previous login/register.
          // A dedicated validation endpoint would be more secure.
          const parsedUser = JSON.parse(userDataString);
          setUser(parsedUser);

        } catch (err) {
          // If token is invalid (e.g., validation call fails or JSON parse fails)
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          // setError('Session expired or invalid. Please log in again.'); // Optional: set error
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`http://localhost:5000/api/users/login`, { email, password });
      if (res.data && res.data.success) {
        const { token, user: userData } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        // Set token for subsequent axios requests (globally or for an instance)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        setError(res.data.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'An error occurred during login.');
      } else {
        setError('An unexpected error occurred during login.');
      }
      // Clear any potentially stored invalid token/user from previous attempts or mock data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];

    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`http://localhost:5000/api/users/register`, { name, email, password });
      if (res.data && res.data.success) {
        const { token, user: userData } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        // Set token for subsequent axios requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        setError(res.data.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'An error occurred during registration.');
      } else {
        setError('An unexpected error occurred during registration.');
      }
      // Clear any potentially stored invalid token/user
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};