import type { Session } from "@supabase/supabase-js";

export const EMAIL_CODE_COOLDOWN_SECONDS = 60;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeEmailCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function matchingAuthSession(session: Session | null, email: string): boolean {
  return !!session?.access_token && !!session.user?.id
    && normalizeEmail(session.user.email || "") === normalizeEmail(email);
}

export type AuthProblem = "credentials" | "send" | "signup" | "verify" | "expired"
  | "rateLimit" | "setup" | "session" | "passwordMismatch" | "passwordStrength" | "sixDigits";

export function authProblem(error: unknown, fallback: AuthProblem): AuthProblem {
  if (!error || typeof error !== "object") return fallback;
  const { code, status } = error as { code?: unknown; status?: unknown };
  if (status === 429 || code === "over_email_send_rate_limit" || code === "over_request_rate_limit") return "rateLimit";
  if (code === "otp_expired") return "expired";
  if (code === "otp_setup_required") return "setup";
  return fallback;
}
