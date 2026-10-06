import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "运行状态｜客来宝",
  robots: { index: false, follow: false },
};

export default function HealthPage() {
  return (
    <main>
      <h1>客来宝运行状态</h1>
      <p>m2-01-standalone-ssr</p>
      <p>版本：{process.env.SINO_APP_VERSION ?? "local"}</p>
      <time dateTime={new Date().toISOString()}>
        {new Date().toISOString()}
      </time>
    </main>
  );
}
