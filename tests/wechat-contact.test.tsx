import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  WechatContactButton,
  WechatContactProvider,
} from "@/components/wechat-contact";
import { trackAnonymousEvent } from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({
  trackAnonymousEvent: vi.fn(),
}));

function MediaWechatFixture() {
  const [backgroundActivations, setBackgroundActivations] = useState(0);

  return (
    <WechatContactProvider>
      <WechatContactButton
        label="咨询媒体报道"
        source="m3-03-test"
      />
      <button
        onClick={() => setBackgroundActivations((count) => count + 1)}
        type="button"
      >
        背景操作 {backgroundActivations}
      </button>
    </WechatContactProvider>
  );
}

async function openMediaWechat() {
  const user = userEvent.setup();
  render(<MediaWechatFixture />);
  const trigger = screen.getByRole("link", { name: "咨询媒体报道" });
  await user.click(trigger);
  const dialog = await screen.findByRole("dialog");
  return { dialog, trigger, user };
}

describe("客来宝媒体企业微信咨询 Dialog", () => {
  it("uses the media consultation accessible name by default", () => {
    render(
      <WechatContactProvider>
        <WechatContactButton source="default-label-test" />
      </WechatContactProvider>,
    );

    expect(
      screen.getByRole("link", { name: "咨询媒体报道" }),
    ).toBeInTheDocument();
  });

  it("names the dialog for media consultation", async () => {
    const { dialog } = await openMediaWechat();

    expect(dialog).toHaveAccessibleName("咨询媒体报道");
    expect(dialog).not.toHaveTextContent(
      /Preview|Production|测试二维码|不可用于正式|预览占位/,
    );
  });

  it("records only the media WeCom event", async () => {
    await openMediaWechat();

    expect(trackAnonymousEvent).toHaveBeenCalledWith({
      event: "open_media_wechat_contact",
      source: "m3-03-test",
    });
    expect(trackAnonymousEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: "open_wechat_contact" }),
    );
    expect(trackAnonymousEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: "open_mini_program_trial" }),
    );
  });

  it("moves initial focus inside and traps Tab and Shift+Tab", async () => {
    const { dialog, user } = await openMediaWechat();
    const close = within(dialog).getByRole("button", {
      name: "关闭咨询媒体报道窗口",
    });

    expect(close).toHaveFocus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard("{Tab}");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("closes with Escape and restores the opening trigger", async () => {
    const { trigger, user } = await openMediaWechat();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes from its close button and restores the opening trigger", async () => {
    const { trigger, user } = await openMediaWechat();

    await user.click(
      screen.getByRole("button", { name: "关闭咨询媒体报道窗口" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("makes the background inert and closes only from the backdrop", async () => {
    const { dialog, trigger, user } = await openMediaWechat();
    const backgroundButton = screen.getByRole("button", { name: "背景操作 0" });
    const background = backgroundButton.closest("[data-media-wechat-background]");
    const backdrop = document.querySelector<HTMLElement>(
      '[data-testid="media-wechat-dialog-backdrop"]',
    );

    expect(background).toHaveAttribute("inert");
    expect(backdrop).not.toBeNull();
    await user.click(backgroundButton);
    expect(screen.getByRole("button", { name: "背景操作 0" })).toBeInTheDocument();

    fireEvent.mouseDown(dialog);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.mouseDown(backdrop!);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("removes a failed media QR and announces only the media contact fallback", async () => {
    const { dialog } = await openMediaWechat();
    const image = within(dialog).getByRole("img", {
      name: "客来宝媒体企业微信咨询二维码",
    });

    expect(image).not.toHaveAttribute(
      "src",
      "/wechat/k-link-mini-program-qr-placeholder.svg",
    );
    fireEvent.error(image);

    const status = await within(dialog).findByRole("status");
    expect(within(dialog).queryByRole("img")).not.toBeInTheDocument();
    expect(status).toHaveTextContent("二维码暂时无法显示");
    const links = within(status).getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/about#contact");
    expect(status).not.toHaveTextContent(/K-Link|小程序|免费体验|备用表单|提交咨询/);
    expect(dialog.querySelector('[href^="/contact"]')).toBeNull();
  });

});
