"use client";

import { useEffect, useRef, useState } from "react";

type NavigateEvent = Event & { navigationType: string; destination: { sameDocument: boolean } };

// Navigation API cancels App Router traversal before React unmounts.
// Engines without it must keep the editor read-only to guarantee draft safety.
export function useLeaveGuard(blocked: boolean, allowed: { current: boolean }) {
  const latest = useRef(blocked);
  latest.current = blocked;
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    const shouldBlock = () => latest.current && !allowed.current;
    const confirm = () => window.confirm("有尚未保存的内容或待完成的图片操作，确定离开？");
    const leave = (event: BeforeUnloadEvent) => {
      if (!shouldBlock()) return;
      event.preventDefault(); event.returnValue = "";
    };
    const linkClick = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest?.("a");
      if (!shouldBlock() || !link || link.target === "_blank" || event.ctrlKey || event.metaKey || event.shiftKey || link.getAttribute("href")?.startsWith("#")) return;
      if (!confirm()) { event.preventDefault(); event.stopPropagation(); }
    };
    const navigation = (window as Window & { navigation?: EventTarget }).navigation;
    setSupported(Boolean(navigation));
    const traverse = (event: Event) => {
      const nav = event as NavigateEvent;
      if (nav.navigationType === "traverse" && nav.destination.sameDocument && nav.cancelable && shouldBlock() && !confirm()) nav.preventDefault();
    };
    window.addEventListener("beforeunload", leave);
    document.addEventListener("click", linkClick, true);
    navigation?.addEventListener("navigate", traverse);
    return () => {
      window.removeEventListener("beforeunload", leave);
      document.removeEventListener("click", linkClick, true);
      navigation?.removeEventListener("navigate", traverse);
    };
  }, [allowed]);
  return supported;
}
