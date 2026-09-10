import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Guide slugs that have moved, old -> current. A renamed or retired URL must
// 301 to its live replacement rather than 404, so Google retires the old one
// cleanly instead of leaving it to age out (AGENTS.md §2). Add an entry here
// in the same commit that renames or removes the article.
//
// Every target must be a live slug. A typo here shadows a real page with a
// redirect to a 404, which is worse than the 404 it replaces.
const RENAMED_GUIDE_SLUGS: Record<string, string> = {
  // Slug said 2025, title said 2026, and the title was the correct one.
  'best-exterior-house-paint-2025': 'best-exterior-house-paint-2026',
};

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  let redirect = false;

  // Canonical host is www.buildguiders.com — this matches the primary domain
  // configured in Vercel. Redirect the bare apex to www. Previously this
  // middleware did the opposite (www -> apex) while Vercel redirected
  // apex -> www, which created an infinite apex<->www redirect loop and made
  // the site unreachable. Keep both pointing the same way (-> www).
  if (host === 'buildguiders.com') {
    url.host = 'www.buildguiders.com';
    redirect = true;
  }

  // Renamed guides. Folded into the same redirect as the host fix so an apex
  // request for an old slug resolves in one hop rather than two.
  const guideMatch = url.pathname.match(/^\/guides\/([^/]+)\/?$/);
  if (guideMatch) {
    const target = RENAMED_GUIDE_SLUGS[guideMatch[1]];
    if (target) {
      url.pathname = `/guides/${target}`;
      redirect = true;
    }
  }

  if (redirect) {
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
