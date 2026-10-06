import type { MiniProgramConfig, WechatContactConfig } from "@/types/site";

export type SiteEnvironment = "preview" | "production";

export const SITE_ENV: SiteEnvironment =
  process.env.NEXT_PUBLIC_SITE_ENV === "production" ? "production" : "preview";

const previewFallbackUrl = "https://preview.example.invalid";

export function resolveSiteUrl(
  input = process.env.NEXT_PUBLIC_SITE_URL,
  environment: SiteEnvironment = SITE_ENV,
) {
  const candidate = input?.trim() || previewFallbackUrl;

  try {
    const url = new URL(candidate);
    if (!/^https?:$/.test(url.protocol)) throw new Error("unsupported protocol");
    if (
      environment === "production" &&
      (url.protocol !== "https:" || url.hostname.endsWith(".invalid"))
    ) {
      throw new Error("production URL must be a real HTTPS origin");
    }
    return url.origin;
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL 必须是有效的 HTTP(S) 地址；生产环境必须使用真实 HTTPS 域名。",
    );
  }
}

export const SITE_URL = resolveSiteUrl();

const qrStatus = process.env.NEXT_PUBLIC_WECHAT_QR_STATUS;

export const WECHAT_CONTACT: WechatContactConfig = {
  qrImagePath: "/wechat/kelaibao-enterprise-wechat-qr.png",
  displayName:
    process.env.NEXT_PUBLIC_WECHAT_DISPLAY_NAME?.trim() || "客来宝顾问",
  accountType: "wecom",
  serviceHours:
    process.env.NEXT_PUBLIC_WECHAT_SERVICE_HOURS?.trim() ||
    "工作日 9:30–18:00（中国标准时间）",
  desktopHint: "使用微信扫码咨询",
  mobileHint: "长按识别或保存二维码后，在微信中打开",
  assetStatus:
    qrStatus === "production-wecom"
      ? "production-wecom"
      : "preview-placeholder",
};

interface MiniProgramConfigInput {
  environment?: SiteEnvironment;
  displayName?: string;
  qrStatus?: string;
}

const MINI_PROGRAM_QR_IMAGE_PATHS = {
  "preview-placeholder": "/wechat/k-link-mini-program-qr.png",
  "production-mini-program": "/wechat/k-link-mini-program-qr.png",
} as const;

export function resolveMiniProgramConfig({
  environment = SITE_ENV,
  displayName = process.env.NEXT_PUBLIC_MINI_PROGRAM_DISPLAY_NAME,
  qrStatus = process.env.NEXT_PUBLIC_MINI_PROGRAM_QR_STATUS,
}: MiniProgramConfigInput = {}): MiniProgramConfig {
  const assetStatus =
    qrStatus === "production-mini-program"
      ? "production-mini-program"
      : "preview-placeholder";

  if (environment === "production" && assetStatus !== "production-mini-program") {
    throw new Error(
      "Production 必须配置正式小程序资源状态 production-mini-program；preview-placeholder 仅可用于 Preview。",
    );
  }

  return {
    qrImagePath: MINI_PROGRAM_QR_IMAGE_PATHS[assetStatus],
    displayName: displayName?.trim() || "K-Link",
    desktopHint: "使用微信扫码打开小程序",
    mobileHint: "长按识别或保存二维码后，在微信中打开小程序",
    assetStatus,
  };
}

export const MINI_PROGRAM_TRIAL = resolveMiniProgramConfig();

export const PRODUCTION_BLOCKERS = [
  "确认经营主体、正式域名、备案与按实际情况需要的登记信息",
  "替换并验证 K-Link 正式小程序二维码，将资源状态切换为 production-mini-program",
  "替换企业微信后台生成的正式“联系我”二维码并完成可用性检查",
  "由适合当前业务范围的专业人员审查政策和职业页面，并保存结论",
  "在中国大陆网络、微信内置浏览器和正式域名完成上线验证",
] as const;

export function isPreviewEnvironment() {
  return SITE_ENV !== "production";
}
