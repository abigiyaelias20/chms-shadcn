// services/authService.ts
import axiosInstance from '@/lib/axiosInstance';
import { decodeToken, getRoleFromToken, isTokenExpired, DecodedToken } from '@/lib/jwt';
import { LoginCredentials, AuthResponse, User } from '@/types/auth';

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Get user from token using jwt-decode
  getUserFromToken: (token: string): User | null => {
    const decoded = decodeToken(token);
    if (!decoded) return null;

    return {
      id: decoded.user_id,
      email: decoded.email,
      role: decoded.role
    };
  },

  // Get role from token
  getRoleFromToken: (token: string): 'Member' | 'Staff' | 'Admin' | null => {
    return getRoleFromToken(token);
  },

  // Store tokens and user data (decoding from token)
  storeAuthData: (data: AuthResponse): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Get user info from token instead of API response
      const user = authService.getUserFromToken(data.token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
    }
  },

  // Get stored user data with token verification
  getUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      
      // If no token or token expired, clear everything
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        return null;
      }

      // Always get user from token to ensure data consistency
      const userFromToken = authService.getUserFromToken(token);
      if (userFromToken) {
        localStorage.setItem('user', JSON.stringify(userFromToken));
        return userFromToken;
      }

      return null;
    }
    return null;
  },

  // Check if token is valid
  isTokenValid: (): boolean => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      return !!token && !isTokenExpired(token);
    }
    return false;
  },

  // Get raw token
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  // Logout
  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    const response = await axiosInstance.post<{ token: string; refreshToken: string }>('/auth/refresh', {
      refreshToken
    });
    return response.data;
  }
};