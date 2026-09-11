import { createHash, createHmac, timingSafeEqual, randomBytes } from "node:crypto";

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const sign = (payload64: string, secret: string) => createHmac("sha256", secret).update(payload64).digest("base64url");
const safe = (a: string, b: string) => { const A = Buffer.from(a), B = Buffer.from(b); return A.length === B.length && timingSafeEqual(A, B); };

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
  try {
    const { challenge, code } = await req.json();
    const secret = Netlify.env.get("EDULINK_SIGNUP_BRIDGE_SECRET");
    if (!secret) return json({ error: "Service indisponible." }, 503);
    if (typeof challenge !== "string" || typeof code !== "string" || !/^\d{6}$/.test(code)) return json({ error: "Code invalide." }, 400);
    const [payload64, sig] = challenge.split(".");
    if (!payload64 || !sig || !safe(sign(payload64, secret), sig)) return json({ error: "Demande de vérification invalide." }, 400);
    const payload = JSON.parse(Buffer.from(payload64, "base64url").toString("utf8"));
    if (!payload.exp || Date.now() > Number(payload.exp)) return json({ error: "Ce code a expiré. Demandez-en un nouveau." }, 400);
    if (!safe(sha(`${code}.${payload.nonce}`), String(payload.codeHash || ""))) return json({ error: "Code incorrect." }, 400);

    const setup = {
      email: payload.email,
      displayName: payload.displayName,
      proofId: randomBytes(24).toString("base64url"),
      exp: Date.now() + 5 * 60 * 1000,
    };
    const setup64 = Buffer.from(JSON.stringify(setup)).toString("base64url");
    const setupToken = `${setup64}.${sign(setup64, secret)}`;
    return json({ ok: true, setupToken, email: setup.email, displayName: setup.displayName, expiresIn: 300 });
  } catch (e) {
    console.error("auth-verify-code", e);
    return json({ error: "Impossible de vérifier ce code." }, 500);
  }
};

export const config = { path: "/api/auth/verify-code" };
