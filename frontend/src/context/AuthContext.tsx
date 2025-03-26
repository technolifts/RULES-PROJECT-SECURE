'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if we have a token in cookies
    const checkAuth = async () => {
      try {
        // Get token from secure cookie
        const storedToken = Cookies.get('auth_token');
        
        if (storedToken) {
          // Set authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          const response = await axios.get('/api/users/me');
          
          if (response.data) {
            setUser(response.data);
            setToken(storedToken);
          }
        }
      } catch (error) {
        console.error('Authentication check failed', error);
        // Clear any invalid tokens
        Cookies.remove('auth_token');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Use FormData for OAuth2 password flow
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await axios.post('/api/auth/login', formData);
      
      if (response.data.access_token) {
        const token = response.data.access_token;
        
        // Store token in secure, httpOnly cookie
        Cookies.set('auth_token', token, { 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          expires: 1 // 1 day
        });
        
        // Set authorization header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Fetch user data
        const userResponse = await axios.get('/api/users/me');
        
        setUser(userResponse.data);
        setToken(token);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password,
      });
      
      router.push('/login');
    } catch (error) {
      console.error('Registration failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Get token from cookie
      const token = Cookies.get('auth_token');
      
      if (token) {
        // Set authorization header for the logout request
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Call logout endpoint to invalidate token on server
        await axios.post('/api/auth/logout');
        
        // Remove token from cookie
        Cookies.remove('auth_token');
        
        // Remove authorization header
        delete axios.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setUser(null);
      setToken(null);
      router.push('/login');
    }
  };

  const isAuthenticated = () => {
    return !!token;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      login, 
      register, 
      logout, 
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
