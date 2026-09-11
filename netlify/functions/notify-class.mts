declare const Netlify: any;

function env(name: string) {
  const value = Netlify.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function cleanText(value: unknown, max = 5000) {
  return String(value ?? '').trim().slice(0, max);
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] || c));
}

async function edulinkCall(auth: string, body: Record<string, unknown>) {
  const supabaseUrl = env('SUPABASE_URL');
  const apiKey = env('SUPABASE_PUBLISHABLE_KEY');
  const res = await fetch(`${supabaseUrl}/functions/v1/mbn-campus`, {
    method: 'POST',
    headers: { apikey: apiKey, Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Edulink indisponible.');
  return data;
}

async function sendOneEmail(to: string, subject: string, message: string, dueDate: string, category: string) {
  const key = Netlify.env.get('RESEND_API_KEY');
  if (!key) return { ok: false, error: 'Canal email non configuré.' };
  const from = Netlify.env.get('EDULINK_EMAIL_FROM') || 'Edulink <notifications@ms-studios.fr>';
  const appUrl = Netlify.env.get('EDULINK_PUBLIC_URL') || 'https://edulink-pro.netlify.app';
  const due = dueDate ? `\nÉchéance : ${dueDate}` : '';
  const text = `${subject}\n\n${message}${due}\n\nOuvrir Edulink : ${appUrl}`;
  const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#10233f"><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px"><tr><td style="padding:28px"><p style="font-size:12px;line-height:18px;color:#64748b;margin:0 0 8px">EDULINK · ${escapeHtml(category.toUpperCase())}</p><h1 style="font-size:24px;line-height:32px;color:#10233f;margin:0 0 16px">${escapeHtml(subject)}</h1><p style="font-size:16px;line-height:24px;color:#334155;margin:0 0 16px">${escapeHtml(message).replace(/\n/g,'<br>')}</p>${dueDate?`<p style="font-size:14px;line-height:22px;color:#334155;margin:0 0 20px"><b>Échéance :</b> ${escapeHtml(dueDate)}</p>`:''}<table cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#2563eb" style="background-color:#2563eb"><a href="${appUrl}" style="display:inline-block;padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px;color:#ffffff;text-decoration:none;font-size:14px;line-height:20px;font-family:Arial,Helvetica,sans-serif">Ouvrir Edulink</a></td></tr></table></td></tr></table></td></tr></table></body></html>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text, html })
  });
  const data = await res.json().catch(() => ({}));
  return res.ok ? { ok: true, id: data.id } : { ok: false, error: data.message || data.error || `Resend HTTP ${res.status}` };
}

export default async (req: Request) => {
  if (req.method !== 'POST') return Response.json({ error: 'Méthode non autorisée.' }, { status: 405 });
  try {
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) return Response.json({ error: 'Connexion Edulink requise.' }, { status: 401 });
    const body = await req.json();
    const bootstrap = await edulinkCall(auth, { action: 'bootstrap' });
    if (!bootstrap.canTeach) return Response.json({ error: 'Action réservée à l’administration.' }, { status: 403 });

    const classId = cleanText(body.classId, 80);
    const category = cleanText(body.category || 'information', 40) || 'information';
    const title = cleanText(body.title, 160);
    const message = cleanText(body.message, 5000);
    const dueDate = cleanText(body.dueDate, 80);
    const sendEmail = body.sendEmail !== false;
    const skipInApp = body.skipInApp === true;
    if (!title || !message) return Response.json({ error: 'Titre et message requis.' }, { status: 400 });
    if (!bootstrap.classes?.some((c: any) => c.id === classId)) return Response.json({ error: 'Classe inconnue.' }, { status: 400 });

    const membershipIds = new Set((bootstrap.memberships || []).filter((m: any) => m.class_id === classId).map((m: any) => m.user_id));
    const registered = (bootstrap.profiles || [])
      .filter((p: any) => p.role === 'student' && membershipIds.has(p.id))
      .map((p: any) => String(p.email || '').trim().toLowerCase());
    const invited = (bootstrap.invites || [])
      .filter((i: any) => i.role === 'student' && i.class_id === classId)
      .map((i: any) => String(i.email || '').trim().toLowerCase());
    const recipients = [...new Set([...registered, ...invited].filter(validEmail))];

    if (!skipInApp) {
      await edulinkCall(auth, {
        action: 'saveOperational',
        kind: 'notification',
        classId,
        payload: {
          category,
          title,
          message,
          dueDate: dueDate || null,
          emailRequested: sendEmail,
          recipientCount: recipients.length,
          createdFrom: 'notification-center',
          createdAt: new Date().toISOString()
        }
      });
    }

    if (!sendEmail || !recipients.length) {
      return Response.json({ ok: true, inApp: !skipInApp, recipients: recipients.length, email: { attempted: 0, delivered: 0, failed: 0, status: 'not-requested' } });
    }

    let delivered = 0;
    let failed = 0;
    let firstError = '';
    for (let i = 0; i < recipients.length; i += 10) {
      const chunk = recipients.slice(i, i + 10);
      const results = await Promise.all(chunk.map(email => sendOneEmail(email, title, message, dueDate, category)));
      for (const result of results) {
        if (result.ok) delivered++;
        else { failed++; if (!firstError) firstError = result.error || 'Échec email'; }
      }
    }

    return Response.json({
      ok: true,
      inApp: !skipInApp,
      recipients: recipients.length,
      email: { attempted: recipients.length, delivered, failed, status: failed ? (delivered ? 'partial' : 'pending') : 'sent', error: firstError || null }
    });
  } catch (error) {
    console.error('notify-class', error);
    return Response.json({ error: error instanceof Error ? error.message : 'Notification impossible.' }, { status: 500 });
  }
};

export const config = { path: '/api/notifications/send' };
