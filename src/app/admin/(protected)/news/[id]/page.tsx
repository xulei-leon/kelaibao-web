import { notFound } from "next/navigation";

import { ContentEditor } from "@/components/admin/content-editor";

export default async function AdminEditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  return <ContentEditor contentType="news" itemId={id} />;
}
