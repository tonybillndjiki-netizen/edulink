import { env, signState, validateEdulinkUser } from "../lib/classroom.mts";

export default async (req: Request) => {
  try {
    if (req.method !== "POST") return new Response(JSON.stringify({ error: "Méthode non autorisée." }), { status: 405, headers: { "Content-Type": "application/json" } });
    const { user } = await validateEdulinkUser(req, true);
    const state = await signState({ uid: user.id, email: user.email, exp: Date.now() + 10 * 60 * 1000, nonce: crypto.randomUUID() });
    const scopes = [
      "https://www.googleapis.com/auth/classroom.courses.readonly",
      "https://www.googleapis.com/auth/classroom.rosters.readonly",
      "https://www.googleapis.com/auth/classroom.coursework.students",
      "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
      "https://www.googleapis.com/auth/classroom.profile.emails",
      "https://www.googleapis.com/auth/classroom.profile.photos"
    ];
    const params = new URLSearchParams({
      client_id: env("GOOGLE_CLASSROOM_CLIENT_ID"),
      redirect_uri: env("GOOGLE_CLASSROOM_REDIRECT_URI"),
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      scope: scopes.join(" "),
      state
    });
    return new Response(JSON.stringify({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Connexion Google impossible." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const config = { path: "/api/classroom/connect" };
