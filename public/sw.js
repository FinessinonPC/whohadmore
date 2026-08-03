/*
 * WhoHadMore service worker - deliberately the smallest thing that works.
 *
 * It exists for one reason: Chrome will not offer "Install app" unless a site
 * can answer a navigation while offline. So this answers exactly that, and
 * otherwise stays out of the way.
 *
 * The rule it never breaks: NOTHING from the network is ever cached. Not
 * pages, not puzzles, not API responses. A daily puzzle site that caches its
 * own HTML serves yesterday's game out of a store that redeploying cannot
 * reach - the bug we just spent a day removing, except frozen in every
 * visitor's browser. The only thing in the cache is a static offline page
 * that has no puzzle in it.
 *
 * KILL SWITCH: set DISABLED to true and deploy. Every browser that picks up
 * the new file unregisters this worker and empties its caches on activate.
 * That is the whole recovery procedure - worth knowing before you need it,
 * because a service worker outlives the deploy that installed it.
 */

const DISABLED = false;

const CACHE = "whm-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  if (DISABLED) return;
  // cache: "reload" so a stale HTTP-cached copy can't be what we store.
  event.waitUntil(
    caches.open(CACHE).then((c) => c.add(new Request(OFFLINE_URL, { cache: "reload" }))),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (DISABLED) {
        await self.registration.unregister();
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        return;
      }
      // Drop any cache from a previous version of this file.
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (DISABLED) return;

  const req = event.request;

  // Page loads only. Assets, API calls and anything non-GET go straight to the
  // network untouched - no interception, so no way to serve them stale.
  if (req.mode !== "navigate" || req.method !== "GET") return;

  event.respondWith(
    // Network first, and network only. The cache is reached for exactly one
    // reason: fetch() rejected, which means there is no connection. An HTTP
    // error still resolves, so a 500 stays a 500 rather than being disguised
    // as "you're offline".
    fetch(req).catch(async () => {
      const cached = await caches.match(OFFLINE_URL);
      return cached ?? Response.error();
    }),
  );
});
