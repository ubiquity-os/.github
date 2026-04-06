import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decryptToken } from '@/lib/session'

export async function middleware(request: NextRequest) {
  const sessionString = request.cookies.get('ubiquity_session')?.value
  
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!sessionString) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // CodeRabbit V5 Fix: Cryptographically validate the session payload
    const decodedPayload = await decryptToken(sessionString);
    if (!decodedPayload) {
      // Forged or expired cookie: delete it and redirect to login
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('ubiquity_session');
      return response;
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/dashboard/:path*',
}
