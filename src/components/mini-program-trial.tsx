"use client";

import { AlertTriangle, QrCode, X } from "lucide-react";
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

import { trackAnonymousEvent } from "@/lib/analytics";
import { MINI_PROGRAM_TRIAL } from "@/lib/site-config";

const TRIAL_FALLBACK_HREF = "/about#contact";
const SAFE_TRIAL_SOURCE =
  /^(?:[a-z0-9][a-z0-9_-]*|\/(?:[a-z0-9][a-z0-9_-]*(?:\/[a-z0-9][a-z0-9_-]*)*)?|[a-z0-9][a-z0-9_-]*:(?:[a-z0-9][a-z0-9_-]*|\/(?:[a-z0-9][a-z0-9_-]*(?:\/[a-z0-9][a-z0-9_-]*)*)?))$/i;

function sanitizeTrialSource(input: string) {
  const candidate = input.trim().split(/[?#]/, 1)[0];
  return candidate &&
    candidate.length <= 120 &&
    !/\d{7,}/.test(candidate) &&
    SAFE_TRIAL_SOURCE.test(candidate)
    ? candidate
    : "unknown";
}

interface MiniProgramTrialContextValue {
  open: (source: string, trigger: HTMLElement) => void;
}

const MiniProgramTrialContext =
  createContext<MiniProgramTrialContextValue | undefined>(undefined);

export function MiniProgramTrialProvider({ children }: { children: ReactNode }) {
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
    trackAnonymousEvent({
      event: "open_mini_program_trial",
      source: sanitizeTrialSource(source),
    });
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
    <MiniProgramTrialContext.Provider value={{ open }}>
      <div
        data-mini-program-background=""
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
              data-testid="mini-program-dialog-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) close();
              }}
            >
              <div
                aria-labelledby="mini-program-dialog-title"
                aria-modal="true"
                className="wechat-dialog"
                onMouseDown={(event) => event.stopPropagation()}
                ref={dialogRef}
                role="dialog"
              >
                <button
                  aria-label="关闭 K-Link 小程序体验窗口"
                  className="dialog-close"
                  onClick={close}
                  ref={closeRef}
                  type="button"
                >
                  <X aria-hidden="true" size={22} />
                </button>
                <div className="wechat-dialog__copy">
                  <p className="eyebrow">免费体验</p>
                  <h2 id="mini-program-dialog-title">体验 K-Link 小程序</h2>
                  <p>
                    使用微信打开小程序，按小程序内说明指引进行体验。
                  </p>
                  <dl className="contact-facts">
                    <div>
                      <dt>产品名称</dt>
                      <dd>{MINI_PROGRAM_TRIAL.displayName}</dd>
                    </div>
                    <div>
                      <dt>体验方式</dt>
                      <dd>微信小程序</dd>
                    </div>
                  </dl>
                </div>
                <div className="wechat-dialog__qr">
                  {qrFailed ? (
                    <div className="qr-fallback" role="status">
                      <AlertTriangle aria-hidden="true" size={28} />
                      <strong>二维码暂时无法显示</strong>
                      <p>请前往联系页查看 K-Link 产品体验说明。</p>
                    </div>
                  ) : (
                    <>
                      {/* A native image preserves long-press/save behavior on mobile. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="K-Link 小程序体验二维码"
                        height="260"
                        onError={() => setQrFailed(true)}
                        src={MINI_PROGRAM_TRIAL.qrImagePath}
                        width="260"
                      />
                      <p className="desktop-hint">
                        {MINI_PROGRAM_TRIAL.desktopHint}
                      </p>
                      <p className="mobile-hint">
                        {MINI_PROGRAM_TRIAL.mobileHint}
                      </p>
                    </>
                  )}
                  <Link href={TRIAL_FALLBACK_HREF} onClick={close}>
                    无法扫码？查看联系页说明
                  </Link>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </MiniProgramTrialContext.Provider>
  );
}

interface MiniProgramTrialButtonProps {
  source: string;
  label?: string;
  className?: string;
  compact?: boolean;
}

export function MiniProgramTrialButton(props: MiniProgramTrialButtonProps) {
  const context = useContext(MiniProgramTrialContext);
  const {
    source,
    label = "免费体验",
    className = "",
    compact = false,
  } = props;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!context) return;
    event.preventDefault();
    context.open(source, event.currentTarget);
  }

  return (
    <Link
      className={`cta cta--product-primary ${compact ? "cta--compact" : ""} ${className}`.trim()}
      data-primary-cta="true"
      href={TRIAL_FALLBACK_HREF}
      onClick={context ? handleClick : undefined}
    >
      <QrCode aria-hidden="true" size={compact ? 18 : 20} strokeWidth={1.8} />
      <span>{label}</span>
    </Link>
  );
}
