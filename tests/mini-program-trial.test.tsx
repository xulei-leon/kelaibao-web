import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  MiniProgramTrialButton,
  MiniProgramTrialProvider,
} from "@/components/mini-program-trial";
import { trackAnonymousEvent } from "@/lib/analytics";
import { MINI_PROGRAM_TRIAL } from "@/lib/site-config";

vi.mock("@/lib/analytics", () => ({
  trackAnonymousEvent: vi.fn(),
}));

function TrialFixture({ source = "m3-02-test" }: { source?: string }) {
  const [backgroundActivations, setBackgroundActivations] = useState(0);

  return (
    <MiniProgramTrialProvider>
      <MiniProgramTrialButton label="免费体验 K-Link" source={source} />
      <button
        onClick={() => setBackgroundActivations((count) => count + 1)}
        type="button"
      >
        背景操作 {backgroundActivations}
      </button>
    </MiniProgramTrialProvider>
  );
}

async function openTrial(source?: string) {
  const user = userEvent.setup();
  render(<TrialFixture source={source} />);
  const trigger = screen.getByRole("link", { name: "免费体验 K-Link" });
  await user.click(trigger);
  const dialog = await screen.findByRole("dialog", {
    name: "体验 K-Link 小程序",
  });
  return { dialog, trigger, user };
}

describe("K-Link mini-program trial dialog", () => {
  it("keeps a usable contact fallback when rendered without a provider", () => {
    render(
      <MiniProgramTrialButton
        label="独立免费体验入口"
        source="standalone-test"
      />,
    );

    const fallback = screen.getByRole("link", { name: "独立免费体验入口" });
    expect(fallback).toHaveAttribute("href", "/about#contact");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trackAnonymousEvent).not.toHaveBeenCalled();
  });

  it("opens, records only the trial event, closes with Escape, and restores focus", async () => {
    const { dialog, trigger, user } = await openTrial();
    expect(dialog).toBeInTheDocument();
    expect(trigger).toHaveClass("cta--product-primary");
    expect(trigger).not.toHaveClass("cta--wechat-primary");
    expect(screen.getByRole("button", { name: "关闭 K-Link 小程序体验窗口" })).toHaveFocus();
    expect(trackAnonymousEvent).toHaveBeenCalledWith({
      event: "open_mini_program_trial",
      source: "m3-02-test",
    });
    expect(trackAnonymousEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: "open_wechat_contact" }),
    );

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("strips query and hash data from global-shell analytics sources", async () => {
    await openTrial(
      "header:/features?utm_source=private-campaign&phone=13800138000#trial",
    );

    expect(trackAnonymousEvent).toHaveBeenCalledWith({
      event: "open_mini_program_trial",
      source: "header:/features",
    });
    expect(trackAnonymousEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        source:
          "header:/features?utm_source=private-campaign&phone=13800138000#trial",
      }),
    );
    expect(trackAnonymousEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: "open_media_wechat_contact" }),
    );
  });

  it("traps forward and reverse Tab focus inside the dialog", async () => {
    const { dialog, user } = await openTrial();
    const close = within(dialog).getByRole("button", {
      name: "关闭 K-Link 小程序体验窗口",
    });
    const fallback = within(dialog).getByRole("link", {
      name: /联系页|查看联系说明|无法扫码/,
    });

    expect(close).toHaveFocus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(fallback).toHaveFocus();
    await user.keyboard("{Tab}");
    expect(close).toHaveFocus();
  });

  it("makes the background inert and closes only from the backdrop, not dialog content", async () => {
    const { dialog, trigger, user } = await openTrial();
    const backgroundButton = screen.getByRole("button", { name: "背景操作 0" });
    const background = backgroundButton.closest("[data-mini-program-background]");
    const backdrop = document.querySelector<HTMLElement>(
      '[data-testid="mini-program-dialog-backdrop"]',
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
    expect(screen.getByRole("button", { name: "背景操作 0" })).toBeInTheDocument();
  });

  it("supports the close button and restores the opening trigger", async () => {
    const { trigger, user } = await openTrial();
    await user.click(
      screen.getByRole("button", { name: "关闭 K-Link 小程序体验窗口" }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("uses product-specific QR copy and degrades to the about contact section", async () => {
    const { dialog } = await openTrial();
    const image = within(dialog).getByRole("img", {
      name: "K-Link 小程序体验二维码",
    });
    expect(image).toHaveAttribute("src", MINI_PROGRAM_TRIAL.qrImagePath);
    expect(within(dialog).getByText(MINI_PROGRAM_TRIAL.mobileHint)).toBeInTheDocument();
    expect(dialog).not.toHaveTextContent(/Preview|Production|测试二维码|不可用于正式/);

    fireEvent.error(image);

    const status = await within(dialog).findByRole("status");
    expect(within(dialog).queryByRole("img")).not.toBeInTheDocument();
    expect(status).toHaveTextContent(/二维码暂时无法显示/);
    expect(
      within(dialog).getByRole("link", {
        name: /联系页|查看联系说明|无法扫码/,
      }),
    ).toHaveAttribute("href", "/about#contact");
    expect(dialog).not.toHaveTextContent(/企业微信|备用表单|提交咨询/);
    expect(dialog.querySelector('[href^="/contact"]')).toBeNull();
    expect(trackAnonymousEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: "open_media_wechat_contact" }),
    );
  });

});
