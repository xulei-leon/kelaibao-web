import type { AuthRepository } from "@/server/auth/service";

export interface AdminSessionRecord {
  id: number;
  adminId: number;
  username: string;
  csrfTokenHash: string;
  expiresAt: Date;
}

export interface AdminRepository extends AuthRepository {
  findValidSession(
    sessionToken: string,
    now?: Date,
  ): Promise<AdminSessionRecord | null>;
  revokeSession(
    session: AdminSessionRecord,
    requestId: string,
    now?: Date,
  ): Promise<void>;
}

