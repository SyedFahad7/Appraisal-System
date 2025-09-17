import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTokenFromRequest, verifyToken } from './lib/auth';

// Define protected routes by role
const protectedRoutes = [
  '/dashboard',
  '/faculty',
  '/hod',
  '/principal',
  '/profile',
  '/appraisal'
];

// Define role-specific routes
const facultyRoutes = [
  '/faculty', 
  '/profile', 
  '/appraisal/self',
  '/appraisal/form'
];

const hodRoutes = [
  '/hod', 
  '/profile', 
  '/appraisal/faculty', 
  '/appraisal/review',
  '/appraisal/department'
];

const principalRoutes = [
  '/principal', 
  '/profile', 
  '/appraisal/review', 
  '/analytics',
  '/appraisal/institution'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (pathname === '/' || pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // Get token from request
    const token = getTokenFromRequest(request);
    
    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Verify token
    const user = verifyToken(token);
    
    // If token is invalid, redirect to login
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check role-based access
    if (user.role === 'Faculty' && !facultyRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/faculty', request.url));
    }
    
    if (user.role === 'HOD' && !hodRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/hod', request.url));
    }
    
    if (user.role === 'Principal' && !principalRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/principal', request.url));
    }
  }
  
  return NextResponse.next();
}

// Configure matcher for middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
