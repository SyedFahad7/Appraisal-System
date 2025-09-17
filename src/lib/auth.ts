import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'lords-faculty-appraisal-jwt-secret';
const JWT_EXPIRES_IN = '7d';

export interface UserJwtPayload {
  userId: string;
  email: string;
  role: 'Principal' | 'HOD' | 'Faculty';
  name: string;
  departmentId?: string;
}

// Generate JWT token
export const generateToken = (payload: UserJwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT token
export const verifyToken = (token: string): UserJwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as UserJwtPayload;
  } catch (error) {
    return null;
  }
};

// Get JWT token from request
export const getTokenFromRequest = (req: NextRequest): string | null => {
  // Try to get token from cookies
  const token = req.cookies.get('token')?.value;
  if (token) return token;
  
  // Try to get token from Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};

// Client-side function to get current user from localStorage
export const getCurrentUser = (): UserJwtPayload | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
};

// Client-side function to set user data
export const setCurrentUser = (user: UserJwtPayload): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// Client-side function to remove user data
export const removeCurrentUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
};

// Server-side function to get current user from request
export const getServerCurrentUser = (req: NextRequest): UserJwtPayload | null => {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  
  return verifyToken(token);
};