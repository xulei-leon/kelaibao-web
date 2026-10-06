import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#admin-main-content">
        跳到管理内容
      </a>
      <main id="admin-main-content">{children}</main>
    </>
  );
}
