// lib/jwt.ts
import { jwtDecode } from 'jwt-decode';

export interface DecodedToken {
  user_id: string;
  email: string;
  role: 'Member' | 'Staff' | 'Admin';
  iat?: number;
  exp?: number;
}

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    if (!token) return null;
    
    // Use jwt-decode library to safely decode   the token
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    if (!decoded.exp) return true;
    
    // Convert expiration time from seconds to milliseconds
    const expirationTime = decoded.exp * 1000;
    return Date.now() >= expirationTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

export const getRoleFromToken = (token: string): 'Member' | 'Staff' | 'Admin' | null => {
  const decoded = decodeToken(token);
  return decoded?.role || null;
};

export const getUserIdFromToken = (token: string): string | null => {
  const decoded = decodeToken(token);
  return decoded?.user_id || null;
};