import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
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

// Set JWT token in HTTP-only cookie
export const setTokenCookie = async (token: string) => {
  (await cookies()).set({
    name: 'token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  });
};

// Remove JWT token cookie
export const removeTokenCookie = async () => {
  (await cookies()).delete('token');
};

// Get JWT token from cookies
export const getTokenFromCookies = async (): Promise<string | undefined> => {
  return (await cookies()).get('token')?.value;
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

// Get current user from token
export const getCurrentUser = async (): Promise<UserJwtPayload | null> => {
  const token = await getTokenFromCookies();
  if (!token) return null;
  
  return verifyToken(token);
};
