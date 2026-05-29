// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Deleted articles that should redirect to /articles (not root slug)
const DELETED_SLUGS = new Set([
    'apple-watch-setup',
    'cables-connections-checklist-before-you-buy-more-gear',
    'denon-avr-quickstart',
    'lg-c3-oled-settings',
    'mesh-wifi-vs-range-extender-better-coverage',
    'sony-xm-series',
    'soundbar-not-syncing-with-tv-fixes',
    'tv-randomly-turns-off-fixes',
    'usb-c-explained',
    'wifi-drops-when-microwave-runs',
]);

export function middleware(request: NextRequest) {
    const host = request.headers.get('host') || '';
    const canonicalHost = 'www.buildguiders.com';

    // Enforce canonical www host
    if (host === 'buildguiders.com') {
        const url = request.nextUrl.clone();
        url.host = canonicalHost;
        url.protocol = 'https';
        return NextResponse.redirect(url, 301);
    }

    // Handle /posts/ and /articles/ prefix redirects in middleware because
    // Next.js config redirects don't reliably respect array order when a
    // dynamic pattern conflicts with specific paths.
    const pathname = request.nextUrl.pathname;

    // /posts/brands/* → /brands/* (keep in next.config for these)
    // /posts/posts/* → /articles (double-prefix bug)
    if (pathname.startsWith('/posts/posts/')) {
        return NextResponse.redirect(new URL('/articles', request.url), 301);
    }

    // /posts/:slug → deleted articles go to /articles, valid ones to /:slug
    if (pathname.startsWith('/posts/') && !pathname.startsWith('/posts/brands/')) {
        const slug = pathname.replace('/posts/', '');
        if (DELETED_SLUGS.has(slug)) {
            return NextResponse.redirect(new URL('/articles', request.url), 301);
        }
        return NextResponse.redirect(new URL(`/${slug}`, request.url), 301);
    }

    // /articles/:slug → redirect to root slug (or /articles if deleted)
    const articlesMatch = pathname.match(/^\/articles\/(.+)$/);
    if (articlesMatch) {
        const slug = articlesMatch[1];
        if (slug === 'hdmi-handshake-failures-4k-hdr') {
            return NextResponse.redirect(new URL('/articles', request.url), 301);
        }
        return NextResponse.redirect(new URL(`/${slug}`, request.url), 301);
    }

    // /sections?category=X → /categories/X (old site structure)
    if (pathname === '/sections') {
        const category = request.nextUrl.searchParams.get('category');
        if (category) {
            return NextResponse.redirect(new URL(`/categories/${category}`, request.url), 301);
        }
        return NextResponse.redirect(new URL('/categories', request.url), 301);
    }

    // /articles?category=X → /categories/X (old articles listing filter)
    if (pathname === '/articles') {
        const category = request.nextUrl.searchParams.get('category');
        if (category) {
            return NextResponse.redirect(new URL(`/categories/${category}`, request.url), 301);
        }
    }

    // /?category=X → /categories/X (old homepage filter pattern)
    if (pathname === '/') {
        const category = request.nextUrl.searchParams.get('category');
        if (category) {
            return NextResponse.redirect(new URL(`/categories/${category}`, request.url), 301);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
