import { getStore, getDeployStore } from "@netlify/blobs";

declare const Netlify: any;

const te = new TextEncoder();
const td = new TextDecoder();

export const env = (name: string) => {
  const value = Netlify.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

function base64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const s = atob(normalized);
  return Uint8Array.from(s, c => c.charCodeAt(0));
}

async function hmac(input: string) {
  const key = await crypto.subtle.importKey("raw", te.encode(env("CLASSROOM_STATE_SECRET")), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, te.encode(input)));
}

export async function signState(payload: Record<string, unknown>) {
  const body = base64url(te.encode(JSON.stringify(payload)));
  const sig = base64url(await hmac(body));
  return `${body}.${sig}`;
}

export async function verifyState(state: string) {
  const [body, sig] = String(state || "").split(".");
  if (!body || !sig) throw new Error("Invalid OAuth state");
  const expected = await hmac(body);
  const supplied = fromBase64url(sig);
  if (expected.length !== supplied.length) throw new Error("Invalid OAuth state");
  let diff = 0;
  expected.forEach((b, i) => diff |= b ^ supplied[i]);
  if (diff !== 0) throw new Error("Invalid OAuth state");
  const payload = JSON.parse(td.decode(fromBase64url(body)));
  if (!payload.exp || Date.now() > payload.exp) throw new Error("Expired OAuth state");
  return payload;
}

function productionStore(name: string) {
  return Netlify.context?.deploy?.context === "production"
    ? getStore(name, { consistency: "strong" })
    : getDeployStore(name);
}

async function encryptionKey() {
  const digest = await crypto.subtle.digest("SHA-256", te.encode(env("CLASSROOM_TOKEN_ENCRYPTION_KEY")));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptJson(value: unknown) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), te.encode(JSON.stringify(value))));
  return JSON.stringify({ v: 1, iv: base64url(iv), ct: base64url(ct) });
}

async function decryptJson(value: string) {
  const parsed = JSON.parse(value);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64url(parsed.iv) }, await encryptionKey(), fromBase64url(parsed.ct));
  return JSON.parse(td.decode(plain));
}

export async function saveGoogleToken(userId: string, token: any) {
  const store = productionStore("edulink-classroom-tokens");
  await store.set(userId, await encryptJson(token));
}

export async function loadGoogleToken(userId: string) {
  const store = productionStore("edulink-classroom-tokens");
  const raw = await store.get(userId);
  return raw ? await decryptJson(raw) : null;
}

export async function deleteGoogleToken(userId: string) {
  await productionStore("edulink-classroom-tokens").delete(userId);
}

export async function loadMappings(userId: string) {
  return (await productionStore("edulink-classroom-mappings").get(userId, { type: "json" })) || {};
}

export async function saveMappings(userId: string, mappings: any) {
  await productionStore("edulink-classroom-mappings").setJSON(userId, mappings);
}

export async function validateEdulinkUser(req: Request, requireTeacher = false) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) throw new Response(JSON.stringify({ error: "Connexion Edulink requise." }), { status: 401, headers: { "Content-Type": "application/json" } });
  const supabaseUrl = env("SUPABASE_URL");
  const apiKey = env("SUPABASE_PUBLISHABLE_KEY");
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: apiKey, Authorization: auth } });
  if (!userRes.ok) throw new Response(JSON.stringify({ error: "Session Edulink invalide." }), { status: 401, headers: { "Content-Type": "application/json" } });
  const user = await userRes.json();
  let bootstrap: any = null;
  if (requireTeacher) {
    const res = await fetch(`${supabaseUrl}/functions/v1/mbn-campus`, { method: "POST", headers: { apikey: apiKey, Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify({ action: "bootstrap" }) });
    bootstrap = await res.json();
    if (!res.ok || !bootstrap.canTeach) throw new Response(JSON.stringify({ error: "Connexion Classroom réservée à l’équipe pédagogique." }), { status: 403, headers: { "Content-Type": "application/json" } });
  }
  return { user, bootstrap, auth, apiKey, supabaseUrl };
}

export async function refreshGoogleToken(userId: string, existing: any) {
  if (existing?.access_token && Number(existing.expires_at || 0) > Date.now() + 60000) return existing;
  if (!existing?.refresh_token) throw new Error("Reconnectez Google Classroom pour obtenir une nouvelle autorisation.");
  const body = new URLSearchParams({
    client_id: env("GOOGLE_CLASSROOM_CLIENT_ID"),
    client_secret: env("GOOGLE_CLASSROOM_CLIENT_SECRET"),
    refresh_token: existing.refresh_token,
    grant_type: "refresh_token"
  });
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || "Impossible de renouveler l’accès Google Classroom.");
  const merged = { ...existing, ...data, refresh_token: existing.refresh_token, expires_at: Date.now() + Number(data.expires_in || 3600) * 1000 };
  await saveGoogleToken(userId, merged);
  return merged;
}

export async function classroomFetch(userId: string, path: string, init: RequestInit = {}) {
  const current = await loadGoogleToken(userId);
  if (!current) throw new Error("Google Classroom n’est pas connecté.");
  const token = await refreshGoogleToken(userId, current);
  const res = await fetch(`https://classroom.googleapis.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json", ...(init.headers || {}) }
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(data?.error?.message || `Google Classroom HTTP ${res.status}`);
  return data;
}
