import { createSessionCredentials } from "@/server/auth/session";

const FAILURE_WINDOW_MS = 15 * 60 * 1_000;
const LOCK_DURATION_MS = 30 * 60 * 1_000;
const MAX_FAILURES = 5;

export const GENERIC_LOGIN_FAILURE =
  "用户名或密码不正确，请稍后重试。";

export interface AdminAuthRecord {
  id: number;
  username: string;
  passwordHash: string;
  failedLoginCount: number;
  failedLoginWindowStartedAt: Date | null;
  lockedUntil: Date | null;
  disabledAt: Date | null;
}

export interface SecurityAuditEvent {
  action:
    | "login_success"
    | "login_failed"
    | "login_locked"
    | "logout"
    | "session_revoked"
    | "admin_bootstrap"
    | "password_reset"
    | "admin_disabled"
    | "html_sanitized"
    | "media_presigned"
    | "media_confirmed"
    | "media_public_usage_confirmed"
    | "media_cleanup_deferred"
    | "content_created"
    | "content_draft_saved"
    | "content_published"
    | "content_offlined"
    | "content_republished"
    | "case_authorization_confirmed"
    | "cache_purge_enqueued"
    | "cache_purge_succeeded"
    | "cache_purge_failed";
  actorAdminId: number | null;
  requestId: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface SessionWrite {
  adminId: number;
  sessionTokenHash: string;
  csrfTokenHash: string;
  expiresAt: Date;
}

export interface LockedAdminTransaction {
  admin: AdminAuthRecord;
  recordFailure(
    state: Pick<
      AdminAuthRecord,
      "failedLoginCount" | "failedLoginWindowStartedAt" | "lockedUntil"
    >,
    event: SecurityAuditEvent,
  ): Promise<void>;
  recordSuccess(
    session: SessionWrite,
    replacementPasswordHash: string | null,
    event: SecurityAuditEvent,
  ): Promise<void>;
}

export interface AuthRepository {
  withLockedAdmin<T>(
    username: string,
    callback: (transaction: LockedAdminTransaction) => Promise<T>,
  ): Promise<T | null>;
  recordSecurityAudit(event: SecurityAuditEvent): Promise<void>;
}

export interface PasswordHasher {
  verify(encodedHash: string, password: string): Promise<boolean>;
  needsRehash(encodedHash: string): boolean;
  hash(password: string): Promise<string>;
}

export type LoginResult =
  | {
      ok: true;
      status: 200;
      sessionToken: string;
      csrfToken: string;
      expiresAt: Date;
    }
  | {
      ok: false;
      status: 401;
      message: typeof GENERIC_LOGIN_FAILURE;
    };

function failure(): LoginResult {
  return {
    ok: false,
    status: 401,
    message: GENERIC_LOGIN_FAILURE,
  };
}

export function nextLoginFailureState(
  admin: AdminAuthRecord,
  now: Date,
) {
  const existingWindow = admin.failedLoginWindowStartedAt;
  const withinWindow =
    existingWindow !== null &&
    now.getTime() - existingWindow.getTime() < FAILURE_WINDOW_MS;
  const failedLoginCount = withinWindow
    ? admin.failedLoginCount + 1
    : 1;
  return {
    failedLoginCount,
    failedLoginWindowStartedAt: withinWindow ? existingWindow : now,
    lockedUntil:
      failedLoginCount >= MAX_FAILURES
        ? new Date(now.getTime() + LOCK_DURATION_MS)
        : null,
  };
}

export async function authenticateAdmin({
  username,
  password,
  repository,
  passwordHasher,
  dummyPasswordHash,
  csrfSecret,
  now = new Date(),
  requestId,
}: {
  username: string;
  password: string;
  repository: AuthRepository;
  passwordHasher: PasswordHasher;
  dummyPasswordHash: string;
  csrfSecret: Buffer;
  now?: Date;
  requestId: string;
}): Promise<LoginResult> {
  const normalizedUsername = username.trim().toLowerCase();
  const result = await repository.withLockedAdmin(
    normalizedUsername,
    async (transaction) => {
      const admin = transaction.admin;
      const locked =
        admin.disabledAt !== null ||
        (admin.lockedUntil !== null && admin.lockedUntil > now);

      if (locked) {
        await passwordHasher.verify(dummyPasswordHash, password);
        return {
          result: failure(),
          deferredAudit: {
            action: admin.disabledAt ? "login_failed" : "login_locked",
            actorAdminId: admin.id,
            requestId,
            metadata: {
              outcome: admin.disabledAt ? "disabled" : "locked",
            },
          } satisfies SecurityAuditEvent,
        };
      }

      const valid = await passwordHasher.verify(admin.passwordHash, password);
      if (!valid) {
        const state = nextLoginFailureState(admin, now);
        await transaction.recordFailure(state, {
          action:
            state.lockedUntil === null ? "login_failed" : "login_locked",
          actorAdminId: admin.id,
          requestId,
          metadata: {
            outcome:
              state.lockedUntil === null ? "invalid_credentials" : "locked",
            failedLoginCount: state.failedLoginCount,
          },
        });
        return { result: failure(), deferredAudit: null };
      }

      const replacementPasswordHash = passwordHasher.needsRehash(
        admin.passwordHash,
      )
        ? await passwordHasher.hash(password)
        : null;
      const credentials = createSessionCredentials(
        now,
        undefined,
        csrfSecret,
      );
      await transaction.recordSuccess(
        {
          adminId: admin.id,
          sessionTokenHash: credentials.sessionTokenHash,
          csrfTokenHash: credentials.csrfTokenHash,
          expiresAt: credentials.expiresAt,
        },
        replacementPasswordHash,
        {
          action: "login_success",
          actorAdminId: admin.id,
          requestId,
          metadata: { outcome: "success" },
        },
      );
      return {
        result: {
          ok: true,
          status: 200,
          sessionToken: credentials.sessionToken,
          csrfToken: credentials.csrfToken,
          expiresAt: credentials.expiresAt,
        } satisfies LoginResult,
        deferredAudit: null,
      };
    },
  );

  if (result === null) {
    await passwordHasher.verify(dummyPasswordHash, password);
    await repository.recordSecurityAudit({
      action: "login_failed",
      actorAdminId: null,
      requestId,
      metadata: { outcome: "unknown_account" },
    });
    return failure();
  }

  if (result.deferredAudit) {
    await repository.recordSecurityAudit(result.deferredAudit);
  }
  return result.result;
}
