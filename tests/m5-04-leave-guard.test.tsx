import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import { useLeaveGuard } from "@/lib/admin/use-leave-guard";

function Guard({ blocked }: { blocked: boolean }) {
  const allowed = useRef(false);
  useLeaveGuard(blocked, allowed);
  return <a href="/admin/news">列表</a>;
}

describe("CMS history protection", () => {
  it("cancels same-document history traversal while dirty, then releases it when saved", () => {
    const navigation = new EventTarget();
    vi.stubGlobal("navigation", navigation);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    try {
      const { rerender, unmount } = render(<Guard blocked />);
      const event = () => Object.assign(new Event("navigate", { cancelable: true }), { navigationType: "traverse", destination: { sameDocument: true } });
      expect(navigation.dispatchEvent(event())).toBe(false);
      expect(confirm).toHaveBeenCalledTimes(1);
      rerender(<Guard blocked={false} />);
      expect(navigation.dispatchEvent(event())).toBe(true);
      expect(confirm).toHaveBeenCalledTimes(1);
      unmount();
    } finally { vi.unstubAllGlobals(); confirm.mockRestore(); }
  });

  it("reports unsupported engines as read-only without changing browser history", () => {
    let supported = true;
    function Unsupported() {
      const allowed = useRef(false);
      supported = useLeaveGuard(false, allowed);
      return null;
    }
    const push = vi.spyOn(window.history, "pushState");
    try {
      render(<Unsupported />);
      expect(supported).toBe(false);
      expect(push).not.toHaveBeenCalled();
    } finally { push.mockRestore(); }
  });
});