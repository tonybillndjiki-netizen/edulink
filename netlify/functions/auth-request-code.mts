import { createHash, createHmac, randomInt, randomBytes } from "node:crypto";

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});

const b64url = (input: string | Buffer) => Buffer.from(input).toString("base64url");
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const sign = (payload64: string, secret: string) => createHmac("sha256", secret).update(payload64).digest("base64url");
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
  try {
    const { email: rawEmail, displayName: rawName } = await req.json();
    const email = String(rawEmail || "").trim().toLowerCase();
    const displayName = String(rawName || "").trim().slice(0, 160);
    if (!emailRe.test(email) || email.length > 200) return json({ error: "Adresse email invalide." }, 400);
    if (displayName.length < 2) return json({ error: "Indiquez votre nom complet." }, 400);

    const bridgeSecret = Netlify.env.get("EDULINK_SIGNUP_BRIDGE_SECRET");
    const resendKey = Netlify.env.get("RESEND_API_KEY");
    const from = Netlify.env.get("EDULINK_EMAIL_FROM") || "Edulink <no-reply@ms-studios.fr>";
    if (!bridgeSecret || !resendKey) return json({ error: "Le service d'inscription n'est pas encore configuré." }, 503);

    const reserve = await fetch("https://gzdixxmcptlymzjmjqat.supabase.co/functions/v1/edulink-self-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reserve", bridgeSecret, email }),
    });
    const reserveData = await reserve.json().catch(() => ({}));
    if (!reserve.ok) return json({ error: reserveData.error || "Veuillez patienter avant de demander un nouveau code." }, reserve.status);

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const nonce = randomBytes(18).toString("base64url");
    const exp = Date.now() + 10 * 60 * 1000;
    const payload = { email, displayName, nonce, exp, codeHash: sha(`${code}.${nonce}`) };
    const payload64 = b64url(JSON.stringify(payload));
    const challenge = `${payload64}.${sign(payload64, bridgeSecret)}`;

    const text = `Votre code Edulink est : ${code}\n\nCe code expire dans 10 minutes. Si vous n'avez pas demandé ce code, ignorez cet e-mail.`;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"></head><body style="margin:0;background-color:#f5f7fb;font-family:Arial,Helvetica,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#f5f7fb" style="padding-top:32px;padding-right:16px;padding-bottom:32px;padding-left:16px;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;"><tr><td bgcolor="#ffffff" style="padding-top:32px;padding-right:32px;padding-bottom:12px;padding-left:32px;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:32px;color:#10233f;font-weight:700;">Edulink</td></tr><tr><td bgcolor="#ffffff" style="padding-top:4px;padding-right:32px;padding-bottom:12px;padding-left:32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#475569;">Code de vérification pour votre première connexion.</td></tr><tr><td align="center" bgcolor="#ffffff" style="padding-top:20px;padding-right:32px;padding-bottom:20px;padding-left:32px;font-family:Arial,Helvetica,sans-serif;font-size:36px;line-height:44px;letter-spacing:8px;color:#1f5eff;font-weight:700;">${code}</td></tr><tr><td bgcolor="#ffffff" style="padding-top:12px;padding-right:32px;padding-bottom:32px;padding-left:32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#64748b;">Ce code expire dans 10 minutes. Ne le communiquez à personne.</td></tr></table></td></tr></table></body></html>`;

    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email], subject: "Votre code de vérification Edulink", text, html }),
    });
    const sentData = await sent.json().catch(() => ({}));
    if (!sent.ok) {
      console.error("edulink otp send", sent.status, sentData);
      return json({ error: "Le code n'a pas pu être envoyé. Le domaine d'envoi doit être vérifié avant l'ouverture aux étudiants." }, 503);
    }

    return json({ ok: true, challenge, expiresIn: 600 });
  } catch (e) {
    console.error("auth-request-code", e);
    return json({ error: "Impossible d'envoyer le code pour le moment." }, 500);
  }
};

export const config = { path: "/api/auth/request-code" };
