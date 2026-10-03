import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isProtectedUserRoute = path.startsWith('/account');
  const isAdminRoute = path.startsWith('/admin') && !path.startsWith('/admin/login');

  // Backend issues a cookie named 'token'
  const hasSession = request.cookies.has('token');

  if (isProtectedUserRoute && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (isAdminRoute && !hasSession) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
};
