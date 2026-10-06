"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type ImageLightboxProps = {
  alt: string;
  height: number;
  label: string;
  modalClassName?: string;
  preview?: boolean;
  showOriginalLink?: boolean;
  src: string;
  triggerText?: string;
  width: number;
};

export function ImageLightbox({
  alt,
  height,
  label,
  modalClassName,
  preview = true,
  showOriginalLink = true,
  src,
  triggerText = label,
  width,
}: ImageLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        aria-label={label}
        aria-haspopup="dialog"
        className={`image-lightbox__trigger${preview ? "" : " image-lightbox__trigger--text"}`}
        onClick={() => {
          setIsOpen(true);
          dialogRef.current?.showModal();
        }}
        ref={triggerRef}
        type="button"
      >
        {preview && <Image alt="" height={height} sizes="(max-width: 768px) 100vw, 50vw" src={src} width={width} />}
        <span>{triggerText}</span>
      </button>
      <dialog
        aria-label={label}
        aria-modal="true"
        className={`image-lightbox${modalClassName ? ` ${modalClassName}` : ""}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        onClose={() => {
          setIsOpen(false);
          queueMicrotask(() => triggerRef.current?.focus());
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          event.currentTarget.close();
          setTimeout(() => triggerRef.current?.focus());
        }}
        ref={dialogRef}
      >
        <button autoFocus onClick={() => dialogRef.current?.close()} type="button">关闭</button>
        {isOpen && <Image alt={alt} height={height} loading="eager" sizes="92vw" src={src} unoptimized width={width} />}
        {showOriginalLink && <a href={src}>在新页面查看原图</a>}
      </dialog>
    </>
  );
}
