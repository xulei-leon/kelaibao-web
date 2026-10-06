import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createAuthRepository } from "@/server/db/repository-factory";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const token = (await cookies()).get("saino_admin_session")?.value;
  if (!token) redirect("/admin/login");
  try {
    const session = await createAuthRepository().findValidSession(token);
    if (!session) redirect("/admin/login");
  } catch {
    redirect("/admin/login");
  }
  return children;
}
