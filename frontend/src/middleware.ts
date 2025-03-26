import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || path === '/login' || path === '/register';

  // Check if user is authenticated by looking for the auth token cookie
  const authToken = request.cookies.get('auth_token')?.value;
  const isAuthenticated = !!authToken;

  // Redirect logic
  if (isPublicPath && isAuthenticated) {
    // If user is on a public path but is authenticated, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!isPublicPath && !isAuthenticated) {
    // If user is on a protected path but is not authenticated, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Continue with the request if no redirects are needed
  return NextResponse.next();
}

// Configure which paths should trigger this middleware
export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/dashboard/:path*',
    '/documents/:path*',
    '/settings/:path*'
  ],
};
