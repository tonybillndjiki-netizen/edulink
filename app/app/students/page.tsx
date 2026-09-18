import { getAppContext } from "@/lib/data/context";

export default async function StudentsPage() {
  const context = await getAppContext();
  if (!context?.organization) return null;
  const orgId = context.organization.id;

  const [{ data: memberships, error }, { data: classes }] = await Promise.all([
    context.supabase
      .from("scolaria_class_memberships")
      .select("id, user_id, class_id, matricule, status, group_id, enrolled_at")
      .eq("organization_id", orgId)
      .eq("membership_type", "student")
      .order("created_at", { ascending: false }),
    context.supabase.from("scolaria_classes").select("id, name").eq("organization_id", orgId),
  ]);

  const userIds = [...new Set((memberships ?? []).map((m) => m.user_id))];
  const { data: profiles } = userIds.length
    ? await context.supabase.from("scolaria_profiles").select("id, display_name, email, phone, avatar_url").in("id", userIds)
    : { data: [] as Array<{ id: string; display_name: string | null; email: string | null; phone: string | null; avatar_url: string | null }> };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const classMap = new Map((classes ?? []).map((c) => [c.id, c.name]));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="badge">Effectifs</span>
          <h1 className="mt-3 text-3xl font-black">Étudiants</h1>
          <p className="mt-2 text-sm text-[#68758a]">Les inscriptions sont uniques par étudiant et reliées à la classe, sans duplication par matière.</p>
        </div>
        <span className="badge">{memberships?.length ?? 0} étudiant(s)</span>
      </div>

      {error && <p className="mt-6 rounded-xl bg-[#fff0f0] p-4 text-sm text-[#a12c2c]">{error.message}</p>}
      <div className="table-shell mt-7">
        <table>
          <thead><tr><th>Étudiant</th><th>Matricule</th><th>Email</th><th>Classe</th><th>Statut</th><th>Inscription</th></tr></thead>
          <tbody>
            {(memberships ?? []).map((item) => {
              const profile = profileMap.get(item.user_id);
              return (
                <tr key={item.id}>
                  <td><b>{profile?.display_name || "Profil étudiant"}</b></td>
                  <td>{item.matricule || "—"}</td>
                  <td>{profile?.email || "—"}</td>
                  <td>{classMap.get(item.class_id) || "—"}</td>
                  <td><span className={`badge ${item.status === "active" ? "badge-ok" : ""}`}>{item.status}</span></td>
                  <td>{new Date(item.enrolled_at).toLocaleDateString("fr-FR")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!memberships?.length && !error && (
        <div className="surface mt-7 p-8">
          <h2 className="text-lg font-black">Aucun étudiant inscrit</h2>
          <p className="mt-2 text-sm leading-6 text-[#68758a]">La structure est prête pour l’import CSV/Excel et l’inscription individuelle. Le workflow de provisioning des comptes sera activé avec le module d’import massif.</p>
        </div>
      )}
    </>
  );
}
