import { classroomFetch, deleteGoogleToken, loadGoogleToken, loadMappings, saveMappings, validateEdulinkUser } from "../lib/classroom.mts";

async function json(req: Request) {
  try { return await req.json(); } catch { return {}; }
}

async function callEdulink(auth: string, apiKey: string, supabaseUrl: string, body: any) {
  const res = await fetch(`${supabaseUrl}/functions/v1/mbn-campus`, {
    method: "POST",
    headers: { apikey: apiKey, Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Synchronisation Edulink impossible.");
  return data;
}

function courseIdSafe(value: unknown) {
  const id = String(value || "").trim();
  if (!/^[A-Za-z0-9_-]{1,120}$/.test(id)) throw new Error("Identifiant Classroom invalide.");
  return id;
}

export default async (req: Request) => {
  try {
    const { user, auth, apiKey, supabaseUrl, bootstrap } = await validateEdulinkUser(req, true);
    const url = new URL(req.url);
    const body = req.method === "POST" ? await json(req) : {};
    const action = String(body.action || url.searchParams.get("action") || "status");

    if (action === "status") {
      const token = await loadGoogleToken(user.id);
      const mappings = await loadMappings(user.id);
      return Response.json({ connected: !!token, connectedAt: token?.connected_at || null, email: token?.email || null, scope: token?.scope || null, mappings });
    }

    if (action === "disconnect") {
      if (req.method !== "POST") return Response.json({ error: "Méthode non autorisée." }, { status: 405 });
      await deleteGoogleToken(user.id);
      await saveMappings(user.id, {});
      return Response.json({ ok: true });
    }

    if (action === "courses") {
      let data: any;
      try {
        data = await classroomFetch(user.id, "/courses?pageSize=100");
      } catch {
        data = await classroomFetch(user.id, "/courses?teacherId=me&pageSize=100");
      }
      let courses = (data.courses || []).map((c: any) => ({ id: c.id, name: c.name, section: c.section, room: c.room, courseState: c.courseState, alternateLink: c.alternateLink, ownerId: c.ownerId }));
      if (!courses.length) {
        try {
          const studentData = await classroomFetch(user.id, "/courses?studentId=me&pageSize=100");
          courses = (studentData.courses || []).map((c: any) => ({ id: c.id, name: c.name, section: c.section, room: c.room, courseState: c.courseState, alternateLink: c.alternateLink, ownerId: c.ownerId }));
        } catch {}
      }
      return Response.json({ courses, mappings: await loadMappings(user.id) });
    }

    if (action === "roster") {
      const courseId = courseIdSafe(body.courseId || url.searchParams.get("courseId"));
      const data = await classroomFetch(user.id, `/courses/${encodeURIComponent(courseId)}/students?pageSize=100`);
      const students = (data.students || []).map((s: any) => ({ id: s.userId, name: s.profile?.name?.fullName || "", email: s.profile?.emailAddress || "", photoUrl: s.profile?.photoUrl || "" }));
      return Response.json({ students });
    }

    if (action === "coursework") {
      const courseId = courseIdSafe(body.courseId || url.searchParams.get("courseId"));
      const data = await classroomFetch(user.id, `/courses/${encodeURIComponent(courseId)}/courseWork?pageSize=100&orderBy=updateTime%20desc`);
      const courseWork = (data.courseWork || []).map((w: any) => ({ id: w.id, title: w.title, description: w.description, state: w.state, dueDate: w.dueDate, dueTime: w.dueTime, maxPoints: w.maxPoints, alternateLink: w.alternateLink, creationTime: w.creationTime, updateTime: w.updateTime }));
      return Response.json({ courseWork });
    }

    if (action === "submissions") {
      const courseId = courseIdSafe(body.courseId || url.searchParams.get("courseId"));
      const courseWorkId = courseIdSafe(body.courseWorkId || url.searchParams.get("courseWorkId"));
      const data = await classroomFetch(user.id, `/courses/${encodeURIComponent(courseId)}/courseWork/${encodeURIComponent(courseWorkId)}/studentSubmissions?pageSize=100`);
      return Response.json({ studentSubmissions: data.studentSubmissions || [] });
    }

    if (action === "map") {
      if (req.method !== "POST") return Response.json({ error: "Méthode non autorisée." }, { status: 405 });
      const courseId = courseIdSafe(body.courseId);
      const classId = String(body.edulinkClassId || "").trim();
      if (!bootstrap?.classes?.some((c: any) => c.id === classId)) throw new Error("Classe Edulink inconnue.");
      const mappings = await loadMappings(user.id);
      mappings[courseId] = { edulinkClassId: classId, courseName: String(body.courseName || ""), updatedAt: new Date().toISOString() };
      await saveMappings(user.id, mappings);
      return Response.json({ ok: true, mappings });
    }

    if (action === "syncRoster") {
      if (req.method !== "POST") return Response.json({ error: "Méthode non autorisée." }, { status: 405 });
      const courseId = courseIdSafe(body.courseId);
      const classId = String(body.edulinkClassId || "").trim();
      if (!bootstrap?.classes?.some((c: any) => c.id === classId)) throw new Error("Classe Edulink inconnue.");
      const data = await classroomFetch(user.id, `/courses/${encodeURIComponent(courseId)}/students?pageSize=100`);
      const emails = [...new Set((data.students || []).map((s: any) => String(s.profile?.emailAddress || "").trim().toLowerCase()).filter((x: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)))];
      if (!emails.length) throw new Error("Aucune adresse email exploitable dans ce cours Classroom.");
      const result = await callEdulink(auth, apiKey, supabaseUrl, { action: "enrollBatch", classId, emails });
      const mappings = await loadMappings(user.id);
      mappings[courseId] = { edulinkClassId: classId, courseName: String(body.courseName || ""), lastRosterSyncAt: new Date().toISOString(), studentCount: emails.length };
      await saveMappings(user.id, mappings);
      return Response.json({ ok: true, count: result.count || emails.length, emailSent: result.emailSent || false, mappings });
    }

    if (action === "createCoursework") {
      if (req.method !== "POST") return Response.json({ error: "Méthode non autorisée." }, { status: 405 });
      const courseId = courseIdSafe(body.courseId);
      const payload: any = {
        title: String(body.title || "").trim(),
        description: String(body.description || "").trim(),
        workType: "ASSIGNMENT",
        state: body.publish === true ? "PUBLISHED" : "DRAFT"
      };
      if (!payload.title) throw new Error("Titre requis.");
      if (Number.isFinite(Number(body.maxPoints))) payload.maxPoints = Number(body.maxPoints);
      if (body.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)) {
        const [year, month, day] = body.dueDate.split("-").map(Number);
        payload.dueDate = { year, month, day };
      }
      const data = await classroomFetch(user.id, `/courses/${encodeURIComponent(courseId)}/courseWork`, { method: "POST", body: JSON.stringify(payload) });
      return Response.json({ ok: true, courseWork: data });
    }

    return Response.json({ error: "Action Classroom inconnue." }, { status: 400 });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: e instanceof Error ? e.message : "Erreur Google Classroom." }, { status: 500 });
  }
};

export const config = { path: "/api/classroom" };
