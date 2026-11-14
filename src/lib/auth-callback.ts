import type { SupabaseClient } from "@supabase/supabase-js";

type CallbackAuth = Pick<SupabaseClient["auth"], "exchangeCodeForSession" | "verifyOtp" | "setSession">;

export async function completeAuthCallback(auth: CallbackAuth, url: URL): Promise<boolean> {
  const query = url.searchParams;
  const fragment = new URLSearchParams(url.hash.slice(1));
  if ([query, fragment].some(params => ["error", "error_code", "error_description"].some(key => params.has(key)))) return false;

  const code = query.get("code");
  const tokenHash = query.get("token_hash");
  const type = query.get("type");
  const accessToken = fragment.get("access_token");
  const refreshToken = fragment.get("refresh_token");
  if ([!!code, !!tokenHash, !!(accessToken || refreshToken)].filter(Boolean).length !== 1) return false;

  try {
    let result;
    if (code && code.length <= 4096) {
      result = await auth.exchangeCodeForSession(code);
    } else if (tokenHash && tokenHash.length <= 4096 && (type === "email" || type === "signup" || type === "magiclink")) {
      result = await auth.verifyOtp({ token_hash: tokenHash, type });
    } else if (accessToken && refreshToken && accessToken.length <= 16384 && refreshToken.length <= 4096
      && (!fragment.has("type") || ["signup", "magiclink", "email"].includes(fragment.get("type")!))) {
      result = await auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    } else {
      return false;
    }
    return !result.error && !!result.data.session?.access_token && !!result.data.user?.id
      && result.data.session.user.id === result.data.user.id;
  } catch {
    return false;
  }
}
