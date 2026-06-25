/**
 * Accounts are username-only; each maps to a deterministic internal email so we
 * can use Supabase email/password auth. Shared by the auth and account actions.
 */
export const EMAIL_DOMAIN = "users.cutsewprint.app";

export function usernameToEmail(username: string): string {
  return `${username}@${EMAIL_DOMAIN}`;
}
