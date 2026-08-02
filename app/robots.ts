import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

/**
 * Generated rather than served from public/robots.txt, so the sitemap host we
 * advertise is always the host the sitemap itself emits.
 *
 * The static file had drifted: it pointed crawlers at www while the sitemap
 * listed apex URLs. Deriving both from getSiteUrl() makes that particular
 * mistake unrepresentable.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
