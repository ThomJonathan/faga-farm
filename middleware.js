import { NextResponse } from 'next/server';
import auth from './src/lib/auth';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedRoutes = ['/farm-worker', '/sales-person', '/manager'];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const user = await auth.getUserSession();
    if (!user) {
      // Redirect to login if no session
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/farm-worker/:path*', '/sales-person/:path*', '/manager/:path*'],
};
