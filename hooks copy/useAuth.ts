import { useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { User, LoginCredentials, AuthResponse, ApiError } from '@/types/auth';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const userData = authService.getUser();
    setUser(userData);
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await authService.login(credentials);
      authService.storeAuthData(response);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error as ApiError;
    }
  };

  const logout = (): void => {
    authService.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: authService.isAuthenticated(),
  };
};