"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackAnonymousEvent } from "@/lib/analytics";

export function AnalyticsPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    trackAnonymousEvent({ event: "page_view", source: pathname });
  }, [pathname]);

  return null;
}
