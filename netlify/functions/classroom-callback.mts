import { env, loadGoogleToken, saveGoogleToken, verifyState } from "../lib/classroom.mts";

export default async (req: Request) => {
  const appUrl = env("EDULINK_PUBLIC_URL");
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("error")) {
      return Response.redirect(`${appUrl}/?classroom=error&reason=${encodeURIComponent(url.searchParams.get("error") || "oauth")}`, 302);
    }
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) return Response.redirect(`${appUrl}/?classroom=error&reason=missing_code`, 302);
    const payload = await verifyState(state);
    const body = new URLSearchParams({
      client_id: env("GOOGLE_CLASSROOM_CLIENT_ID"),
      client_secret: env("GOOGLE_CLASSROOM_CLIENT_SECRET"),
      code,
      grant_type: "authorization_code",
      redirect_uri: env("GOOGLE_CLASSROOM_REDIRECT_URI")
    });
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    const token = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(token.error_description || token.error || "Échange OAuth impossible.");
    const previous = await loadGoogleToken(payload.uid);
    const stored = {
      ...previous,
      ...token,
      refresh_token: token.refresh_token || previous?.refresh_token,
      expires_at: Date.now() + Number(token.expires_in || 3600) * 1000,
      connected_at: new Date().toISOString(),
      email: payload.email
    };
    if (!stored.refresh_token) throw new Error("Google n’a pas fourni de jeton hors ligne. Reconnectez en autorisant l’accès.");
    await saveGoogleToken(payload.uid, stored);
    return Response.redirect(`${appUrl}/?classroom=connected`, 302);
  } catch (e) {
    const message = encodeURIComponent(e instanceof Error ? e.message : "oauth_error");
    return Response.redirect(`${appUrl}/?classroom=error&reason=${message}`, 302);
  }
};

export const config = { path: "/google-classroom/callback" };
