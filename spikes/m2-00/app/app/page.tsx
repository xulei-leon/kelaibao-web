export const dynamic = "force-dynamic";

export default function M200SpikePage() {
  return (
    <main>
      <h1>M2-00 FC Next.js SSR Spike</h1>
      <p>m2-00-next-ssr-marker</p>
      <p>{new Date().toISOString()}</p>
    </main>
  );
}
