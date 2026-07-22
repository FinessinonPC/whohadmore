import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Generate the CSP header
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com;
    style-src 'self' 'unsafe-inline';
    connect-src 'self' https://*.supabase.co https://vitals.vercel-insights.com;
    img-src * data: blob:;
    font-src 'self' data:;
  `.replace(/\s{2,}/g, ' ').trim();

  // Create response
  const response = NextResponse.next();

  // Set the CSP header on the response
  response.headers.set('Content-Security-Policy', cspHeader);

  // --- SEO: keep only the core pages on www.whohadmore.com in Google ---
  // 1) Any *.vercel.app host (preview builds AND the project's production alias)
  //    is a duplicate of www - noindex it so it never competes with the brand.
  // 2) The per-day game pages (/play, /day, /word, /mini, /duality/<date> and the
  //    bare /YYYY-MM-DD alias) are a long tail of mostly sign-in-gated URLs. We
  //    no longer want them in search - only the main site (home, about, archive,
  //    leaderboard, categories) should show. `follow` still lets Google walk the
  //    links, so no crawl signal is lost.
  const host = request.headers.get('host') ?? '';
  const path = request.nextUrl.pathname;
  const nonCanonicalHost = host.endsWith('.vercel.app');
  const gamePage =
    /^\/(play|day|word|mini|duality)\/[^/]+/.test(path) ||
    /^\/\d{4}-\d{2}-\d{2}(\/|$)/.test(path);
  if (nonCanonicalHost || gamePage) {
    response.headers.set('X-Robots-Tag', 'noindex, follow');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
