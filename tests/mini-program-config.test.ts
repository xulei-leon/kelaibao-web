import {
  MINI_PROGRAM_TRIAL,
  WECHAT_CONTACT,
  resolveMiniProgramConfig,
} from "@/lib/site-config";
import type { MiniProgramConfig } from "@/types/site";
import { describe, expect, it } from "vitest";

describe("K-Link mini-program configuration", () => {
  it("uses a fixed local asset and stays separate from WeCom contact config", () => {
    const config: MiniProgramConfig = MINI_PROGRAM_TRIAL;

    expect(config).toMatchObject({
      qrImagePath: "/wechat/k-link-mini-program-qr.png",
      displayName: "K-Link",
      assetStatus: "preview-placeholder",
    });
    expect(config.desktopHint).toMatch(/微信.*扫码|扫码.*微信/);
    expect(config.mobileHint).toMatch(/长按/);
    expect(config).not.toBe(WECHAT_CONTACT);
    expect(config.qrImagePath).not.toBe(WECHAT_CONTACT.qrImagePath);
    expect(config.displayName).not.toBe(WECHAT_CONTACT.displayName);
  });

  it("allows an explicitly labelled preview placeholder", () => {
    expect(
      resolveMiniProgramConfig({
        environment: "preview",
        displayName: " K-Link 体验版 ",
        qrStatus: "preview-placeholder",
      }),
    ).toMatchObject({
      qrImagePath: "/wechat/k-link-mini-program-qr.png",
      displayName: "K-Link 体验版",
      assetStatus: "preview-placeholder",
    });
  });

  it("rejects a preview placeholder in production configuration", () => {
    expect(() =>
      resolveMiniProgramConfig({
        environment: "production",
        displayName: "K-Link",
        qrStatus: "preview-placeholder",
      }),
    ).toThrow(/小程序|mini.program|preview-placeholder|production-mini-program/i);
  });

  it("never maps a formal production status to the preview placeholder asset", () => {
    const config = resolveMiniProgramConfig({
      environment: "production",
      displayName: "K-Link",
      qrStatus: "production-mini-program",
    });

    expect(config).toMatchObject({
      qrImagePath: "/wechat/k-link-mini-program-qr.png",
      assetStatus: "production-mini-program",
    });
    expect(config.qrImagePath).not.toMatch(/placeholder/i);
  });
});
