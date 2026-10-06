import type { PublicRoute } from "@/lib/route-metadata";
import { SITE_URL } from "@/lib/site-config";
import {
  buildStaticPageStructuredData,
  safeSerializeJsonLd,
} from "@/server/discovery/metadata";

export function StaticPageStructuredData({ route }: { route: PublicRoute }) {
  const jsonLd = safeSerializeJsonLd(() =>
    buildStaticPageStructuredData(route, SITE_URL),
  );
  if (!jsonLd) return null;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: jsonLd }}
      type="application/ld+json"
    />
  );
}
