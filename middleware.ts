import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adsScriptEnabled } from '@/lib/ads';
import { isFreeArchiveDate } from '@/lib/archiveWindow';
import { todayISO } from '@/lib/date';

export function middleware(request: NextRequest) {
  // Generate the CSP header
  // AdSense needs its own hosts on script-src, frame-src and connect-src.
  // frame-src especially: it was never declared, so ad iframes were falling
  // back to default-src 'self' and would have been blocked outright.
  //
  // Only added when ads are actually configured. There is no reason to loosen
  // the policy for a script the site isn't loading, and keeping the tight
  // version as the default means the permissive one is a deliberate act.
  const ads = adsScriptEnabled();
  const adScript = ads
    ? " https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://adservice.google.com https://www.googletagservices.com"
    : "";
  const adFrame = ads
    ? "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com;"
    : "";
  const adConnect = ads
    ? " https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net"
    : "";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com${adScript};
    style-src 'self' 'unsafe-inline';
    connect-src 'self' https://*.supabase.co https://vitals.vercel-insights.com${adConnect};
    img-src * data: blob:;
    font-src 'self' data:;
    ${adFrame}
  `.replace(/\s{2,}/g, ' ').trim();

  // Create response
  const response = NextResponse.next();

  // Set the CSP header on the response
  response.headers.set('Content-Security-Policy', cspHeader);

  // --- SEO: every result Google shows should be a game you can play now ---
  //
  // Search for a game and you should land ON that game, today's copy of it,
  // ready to play. Not on an explainer, and not on a card from three weeks
  // ago. So exactly one page per game is indexable - the bare /chain,
  // /duality, /word, /mini - plus the homepage for the brand itself.
  //
  // Everything noindexed below is still a real page for real visitors;
  // `follow` keeps every link crawlable, so nothing loses crawl signal.
  //
  // 1) Any *.vercel.app host (preview builds AND the project's production
  //    alias) duplicates www - noindex so it never competes with the brand.
  // 2) Dated game routes and the bare /YYYY-MM-DD alias: same game as the
  //    bare route, so they would compete with it.
  // 3) /day/<date> OUTSIDE the free window: still behind the sign-in wall, so
  //    still a search result that hands a stranger a signup form instead of a
  //    puzzle. Recent days are now free to play, so they are indexed - that is
  //    the one part of this site's search surface that grows by itself, one
  //    page a day, for as long as it keeps publishing. FREE_ARCHIVE_DAYS is
  //    the single number deciding this, useArchiveGate and the sitemap
  //    together; they must agree or the site contradicts itself in public.
  // 4) /games/<id>: the explainers. They rank for game names and win, which
  //    is precisely the problem - a searcher wanting Chain gets an article
  //    about Chain. They stay live and linked, just not as landing pages.
  const host = request.headers.get('host') ?? '';
  const path = request.nextUrl.pathname;
  const nonCanonicalHost = host.endsWith('.vercel.app');
  const duplicateDayUrl =
    /^\/(play|word|mini|duality|chain)\/[^/]+/.test(path) ||
    /^\/\d{4}-\d{2}-\d{2}(\/|$)/.test(path);
  const dayMatch = /^\/day\/(\d{4}-\d{2}-\d{2})(\/|$)/.exec(path);
  const archiveDay = /^\/day\//.test(path) && !(dayMatch && isFreeArchiveDate(dayMatch[1], todayISO()));
  const gameExplainer = /^\/games\/[^/]+/.test(path);
  if (nonCanonicalHost || duplicateDayUrl || archiveDay || gameExplainer) {
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
     * - sw.js, offline.html, manifest.webmanifest, icon.svg (PWA files)
     *
     * The PWA files are excluded for two reasons. The browser re-checks sw.js
     * on a schedule of its own, and there is no sense paying for a middleware
     * invocation each time to attach a CSP to a static file. More to the
     * point, the CSP on a worker script governs what that worker may fetch -
     * so leaving it off keeps the header from quietly restricting the very
     * requests the worker exists to make.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sw.js|offline.html|manifest.webmanifest|icon.svg).*)',
  ],
};
