import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  // Canonical host is www.buildguiders.com — this matches the primary domain
  // configured in Vercel. Redirect the bare apex to www. Previously this
  // middleware did the opposite (www -> apex) while Vercel redirected
  // apex -> www, which created an infinite apex<->www redirect loop and made
  // the site unreachable. Keep both pointing the same way (-> www).
  if (host === 'buildguiders.com') {
    const url = request.nextUrl.clone();
    url.host = 'www.buildguiders.com';
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
