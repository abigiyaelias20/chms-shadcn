export interface User {
  id: string;
  email: string;
  role: 'Member' | 'Staff' | 'Admin';
  // Add other user properties as needed
}

export interface AuthResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export interface ApiError {
  error: string;
  status?: number;
}