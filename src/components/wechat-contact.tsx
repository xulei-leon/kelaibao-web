"use client";

import { MessageCircle, X, AlertTriangle } from "lucide-react";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";
import { GLOBAL_CTA } from "@/lib/site-content";
import { WECHAT_CONTACT } from "@/lib/site-config";
import { trackAnonymousEvent } from "@/lib/analytics";

interface WechatContextValue {
  open: (source: string, trigger: HTMLElement) => void;
}

const WechatContext = createContext<WechatContextValue | undefined>(undefined);

export function WechatContactProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    setIsOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  const open = useCallback((source: string, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setQrFailed(false);
    setIsOpen(true);
    trackAnonymousEvent({ event: "open_media_wechat_contact", source });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isOpen]);

  function blockBackgroundInteraction(event: SyntheticEvent) {
    if (!isOpen) return;
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <WechatContext.Provider value={{ open }}>
      <div
        data-media-wechat-background=""
        inert={isOpen ? true : undefined}
        onClickCapture={blockBackgroundInteraction}
        style={{ display: "contents" }}
      >
        {children}
      </div>
      {mounted && isOpen
        ? createPortal(
          <div
            className="dialog-backdrop"
            data-testid="media-wechat-dialog-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) close();
            }}
          >
            <div
              aria-labelledby="wechat-dialog-title"
              aria-modal="true"
              className="wechat-dialog"
              onMouseDown={(event) => event.stopPropagation()}
              ref={dialogRef}
              role="dialog"
            >
              <button
                aria-label="关闭咨询媒体报道窗口"
                className="dialog-close"
                onClick={close}
                ref={closeRef}
                type="button"
              >
                <X aria-hidden="true" size={22} />
              </button>
              <div className="wechat-dialog__copy">
                <p className="eyebrow">媒体人工咨询</p>
                <h2 id="wechat-dialog-title">咨询媒体报道</h2>

                <dl className="contact-facts">
                  <div>
                    <dt>联系名称</dt>
                    <dd>{WECHAT_CONTACT.displayName}</dd>
                  </div>
                  <div>
                    <dt>人工回复</dt>
                    <dd>{WECHAT_CONTACT.serviceHours}</dd>
                  </div>
                </dl>
                <p className="dialog-footnote">
                  提交咨询不代表签约、报价确认或结果承诺。
                </p>
              </div>
              <div className="wechat-dialog__qr">
                {qrFailed ? (
                  <div className="qr-fallback" role="status">
                    <AlertTriangle aria-hidden="true" size={28} />
                    <strong>二维码暂时无法显示</strong>
                    <p>请前往联系页查看客来宝媒体咨询说明。</p>
                    <Link href={GLOBAL_CTA.href} onClick={close}>
                      查看媒体咨询说明
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* A native image preserves long-press/save behavior on mobile. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="客来宝媒体企业微信咨询二维码"
                      height="260"
                      onError={() => setQrFailed(true)}
                      src={WECHAT_CONTACT.qrImagePath}
                      width="260"
                    />
                    <p className="desktop-hint">{WECHAT_CONTACT.desktopHint}</p>
                    <p className="mobile-hint">{WECHAT_CONTACT.mobileHint}</p>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}
    </WechatContext.Provider>
  );
}

interface WechatContactButtonProps {
  source: string;
  label?: string;
  className?: string;
  compact?: boolean;
}

export function WechatContactButton({
  source,
  label = GLOBAL_CTA.label,
  className = "",
  compact = false,
}: WechatContactButtonProps) {
  const context = useContext(WechatContext);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!context) return;
    event.preventDefault();
    context.open(source, event.currentTarget);
  }

  return (
    <Link
      className={`cta cta--wechat-primary ${compact ? "cta--compact" : ""} ${className}`.trim()}
      data-primary-cta="true"
      href={GLOBAL_CTA.href}
      onClick={handleClick}
    >
      <MessageCircle aria-hidden="true" size={compact ? 18 : 20} strokeWidth={1.8} />
      <span>{label}</span>
    </Link>
  );
}
