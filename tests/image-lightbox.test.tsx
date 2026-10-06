import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ImageLightbox } from "@/components/image-lightbox";

describe("M4-04 company image lightbox", () => {
  function installDialogMocks() {
    const showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    });
    const close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute("open");
      fireEvent(this, new Event("close"));
    });
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: { configurable: true, value: showModal },
      close: { configurable: true, value: close },
    });

    return { close, showModal };
  }

  it("opens a native dialog and restores focus from the close button", async () => {
    const { close, showModal } = installDialogMocks();

    render(<ImageLightbox alt="办公室" height={100} label="查看办公室场景大图" src="/office.png" width={200} />);
    const trigger = screen.getByRole("button", { name: "查看办公室场景大图" });
    fireEvent.click(trigger);

    expect(showModal).toHaveBeenCalledOnce();
    const dialog = screen.getByRole("dialog", { name: "查看办公室场景大图" }) as HTMLDialogElement;
    expect(dialog).toHaveAttribute("open");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("link", { name: "在新页面查看原图" })).toHaveAttribute("href", "/office.png");

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    expect(close).toHaveBeenCalledOnce();
    await Promise.resolve();
    expect(trigger).toHaveFocus();
  });

  it("closes from the backdrop and restores focus", async () => {
    const { close } = installDialogMocks();

    render(<ImageLightbox alt="办公室" height={100} label="查看办公室场景大图" src="/office.png" width={200} />);
    const trigger = screen.getByRole("button", { name: "查看办公室场景大图" });
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "查看办公室场景大图" });

    fireEvent.click(dialog);
    expect(close).toHaveBeenCalledOnce();
    await Promise.resolve();
    expect(trigger).toHaveFocus();
  });

  it("closes with Escape and restores focus", async () => {
    const { close } = installDialogMocks();

    render(<ImageLightbox alt="办公室" height={100} label="查看办公室场景大图" src="/office.png" width={200} />);
    const trigger = screen.getByRole("button", { name: "查看办公室场景大图" });
    fireEvent.click(trigger);

    fireEvent.keyDown(
      screen.getByRole("dialog", { name: "查看办公室场景大图" }),
      { key: "Escape" },
    );
    expect(close).toHaveBeenCalledOnce();
    await new Promise((resolve) => setTimeout(resolve));
    expect(trigger).toHaveFocus();
  });

  it("can render a text-only trigger without an image preview", () => {
    render(<ImageLightbox alt="办公室" height={100} label="查看办公室场景大图" preview={false} src="/office.png" triggerText="点击查看" width={200} />);

    const trigger = screen.getByRole("button", { name: "查看办公室场景大图" });
    expect(trigger).toHaveTextContent("点击查看");
    expect(trigger.querySelector("img")).toBeNull();
  });

  it("can hide the original-image link", () => {
    installDialogMocks();

    render(<ImageLightbox alt="办公室" height={100} label="查看办公室场景大图" showOriginalLink={false} src="/office.png" width={200} />);
    fireEvent.click(screen.getByRole("button", { name: "查看办公室场景大图" }));

    expect(screen.queryByRole("link", { name: "在新页面查看原图" })).toBeNull();
  });

  it("loads the full-size image only after the text trigger is clicked", () => {
    installDialogMocks();

    render(<ImageLightbox alt="办公室" height={100} label="查看办公室场景大图" preview={false} src="/office.png" triggerText="点击查看" width={200} />);
    expect(screen.queryByAltText("办公室")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "查看办公室场景大图" }));
    expect(screen.getByAltText("办公室")).toHaveAttribute("src", "/office.png");
  });

  it("can apply a size modifier to the dialog", () => {
    installDialogMocks();

    render(<ImageLightbox alt="到访指引" height={100} label="查看到访指引大图" modalClassName="image-lightbox--tall" src="/arrival.png" width={200} />);
    fireEvent.click(screen.getByRole("button", { name: "查看到访指引大图" }));

    expect(screen.getByRole("dialog", { name: "查看到访指引大图" })).toHaveClass("image-lightbox--tall");
  });
});
