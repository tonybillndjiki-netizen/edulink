// Edulink OPS : répertoire emails, notifications et espace Classroom visible.
function studentEmailDirectory(){
  const map=new Map();
  (state.data?.invites||[]).filter(x=>x.role==='student').forEach(x=>{const email=String(x.email||'').trim().toLowerCase();if(email)map.set(email,{email,name:'',status:'Pré-inscrit',source:'Classroom / import'});});
  (state.data?.profiles||[]).filter(x=>x.role==='student').forEach(x=>{const email=String(x.email||'').trim().toLowerCase();if(email)map.set(email,{email,name:x.display_name||'',status:'Compte actif',source:'Edulink'});});
  return [...map.values()].sort((a,b)=>a.email.localeCompare(b.email));
}

const baseShellOps=shell;
shell=function(){
  const teacher=state.data.teacher;
  const emails=teacher?studentEmailDirectory().length:0;
  const nav=[['home','Accueil'],['roadmap','Mon parcours'],['courses','Mes cours'],['homework',teacher?'Travaux à corriger':'Mes devoirs'],['cc','Mes évaluations'],['results','Mes résultats'],['skills','Mes compétences'],['attendance','Présences / absences'],['agenda','Agenda'],['messages','Messagerie'],['notifications','Notifications'],...(teacher?[['classes','Classes & étudiants'],['classroom','Google Classroom']]:[]),['settings','Paramètres']];
  return `<div class="app"><aside class="sidebar" id="sidebar"><div class="brand"><div class="brand-mark">E</div><div><b>Edulink</b><small>Bachelor 3</small></div></div><nav class="nav">${nav.map(([id,l])=>`<button data-page="${id}" class="${state.page===id?'active':''}">${l}</button>`).join('')}</nav><div class="sidebar-footer"><b>${esc(state.data.user.display_name||state.data.user.email)}</b><small style="display:block;color:#94a3b8">${teacher?'Administration':'Étudiant'}</small>${teacher?`<small style="display:block;color:#94a3b8;margin-top:4px">${emails} email(s) étudiant(s)</small>`:''}<button class="btn ghost" id="logout">Déconnexion</button></div></aside><section class="main"><header class="topbar"><div><button class="btn secondary mobile-menu" id="menu">☰</button> <b>Edulink</b></div><div class="actions">${state.data.canTeach?`<button class="btn secondary" id="preview">${state.preview?'Vue responsable':'Tester en étudiant'}</button>`:''}<span class="status ${state.data.integrations.database?'green':'red'}">Supabase ${state.data.integrations.database?'connecté':'hors ligne'}</span></div></header><main class="content" id="view"></main></section></div>`;
};

function notificationIcon(type){return ({cc:'CC',devoir:'DEV',absence:'ABS',rappel:'RAP',information:'INFO'})[type]||'INFO'}
function notificationList(){
  return records('notification').slice().sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
}
function notificationCard(r,teacher=false){
  const p=r.payload||{};
  return `<section class="card" style="margin-top:12px"><div class="row"><div><span class="pill">${esc(notificationIcon(p.category))}</span><h3 style="margin:8px 0 4px">${esc(p.title||'Notification')}</h3><div class="muted">${esc(p.message||'')}</div>${p.dueDate?`<div style="margin-top:8px"><b>Échéance :</b> ${esc(p.dueDate)}</div>`:''}</div><span class="status blue">${esc(p.category||'information')}</span></div>${teacher&&p.emailRequested?`<div class="actions" style="margin-top:12px"><button class="btn secondary" data-retry-notification="${esc(r.id)}">Retenter l'e-mail</button></div>`:''}</section>`;
}

function notificationsPage(){
  const list=notificationList();
  if(!state.data.teacher){
    return `<div class="eyebrow">INFORMATIONS IMPORTANTES</div><h1>Notifications</h1><p class="muted">Retrouvez ici les rappels de devoirs, CC, absences et informations de l'établissement.</p>${list.length?list.map(r=>notificationCard(r,false)).join(''):'<section class="card"><p class="muted">Aucune notification pour le moment.</p></section>'}`;
  }
  const classes=state.data.classes||[];
  return `<div class="eyebrow">COMMUNICATION ÉTUDIANTS</div><h1>Notifications</h1><div class="grid two"><section class="card"><h2>Envoyer une notification</h2><p class="muted">La notification apparaît immédiatement dans Edulink. L'e-mail est tenté en parallèle ; tant que le DNS Resend n'est pas totalement validé, Edulink reste le canal garanti.</p><form id="notificationForm"><div class="field"><label>Classe</label><select name="classId" required>${classes.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label>Type</label><select name="category"><option value="devoir">Devoir</option><option value="cc">Contrôle continu</option><option value="rappel">Rappel</option><option value="absence">Absence / présence</option><option value="information">Information</option></select></div><div class="field"><label>Titre</label><input name="title" maxlength="160" required placeholder="Ex. CC1 mercredi à 10h"></div><div class="field"><label>Message</label><textarea name="message" required placeholder="Consignes, salle, éléments à préparer…"></textarea></div><div class="field"><label>Échéance / date</label><input name="dueDate" placeholder="Ex. 18 septembre 2026 à 10h"></div><label style="display:flex;gap:10px;align-items:center;margin:12px 0"><input type="checkbox" name="sendEmail" checked> Envoyer aussi par e-mail si le canal est disponible</label><button class="btn">Notifier la classe</button><div id="notificationResult"></div></form></section><section class="card"><h2>Canaux</h2><div class="row"><b>Notification Edulink</b><span class="status green">Opérationnel</span></div><div class="row"><b>Répertoire e-mail</b><span class="status green">${studentEmailDirectory().length} collecté(s)</span></div><div class="row"><b>E-mail externe</b><span class="status orange">Resend / DNS en validation</span></div><p class="notice" style="margin-top:14px">Même si l'e-mail externe échoue, la notification reste visible dans le compte étudiant.</p></section></div><section style="margin-top:18px"><h2>Historique</h2>${list.length?list.map(r=>notificationCard(r,true)).join(''):'<section class="card"><p class="muted">Aucune notification envoyée.</p></section>'}</section>`;
}

async function sendNotificationForm(e){
  e.preventDefault();const f=new FormData(e.currentTarget),out=document.getElementById('notificationResult'),btn=e.currentTarget.querySelector('button[type=submit]');btn.disabled=true;out.innerHTML='<p class="notice">Envoi en cours…</p>';
  try{
    const r=await fetch('/api/notifications/send',{method:'POST',headers:{Authorization:'Bearer '+token(),'Content-Type':'application/json'},body:JSON.stringify({classId:f.get('classId'),category:f.get('category'),title:f.get('title'),message:f.get('message'),dueDate:f.get('dueDate'),sendEmail:f.get('sendEmail')==='on'})});
    const d=await r.json();if(!r.ok)throw Error(d.error||'Notification impossible.');
    const email=d.email||{};out.innerHTML=`<p class="notice success">Notification Edulink envoyée à la classe.${email.attempted?` E-mail : ${email.delivered}/${email.attempted} délivré(s)${email.failed?' ; le reste pourra être retenté.':''}.`:''}</p>`;e.currentTarget.reset();await refresh();
  }catch(err){out.innerHTML=`<p class="notice error">${esc(err.message)}</p>`}finally{btn.disabled=false}
}

async function retryNotificationEmail(id){
  const r=records('notification').find(x=>x.id===id);if(!r)return toast('Notification introuvable.');const p=r.payload||{};try{const cls=r.class_id||state.data.classes?.[0]?.id;const res=await fetch('/api/notifications/send',{method:'POST',headers:{Authorization:'Bearer '+token(),'Content-Type':'application/json'},body:JSON.stringify({classId:cls,category:p.category,title:p.title,message:p.message,dueDate:p.dueDate,sendEmail:true,skipInApp:true})});const d=await res.json();if(!res.ok)throw Error(d.error||'Envoi impossible.');toast(d.email?.failed?`E-mail encore indisponible (${d.email.delivered||0}/${d.email.attempted||0}).`:`E-mails envoyés : ${d.email?.delivered||0}.`)}catch(e){toast(e.message)}
}
function bindNotifications(){
  document.getElementById('notificationForm')?.addEventListener('submit',sendNotificationForm);
  document.querySelectorAll('[data-retry-notification]').forEach(b=>b.onclick=()=>retryNotificationEmail(b.dataset.retryNotification));
}

function classroomWorkspace(){
  if(!state.data.teacher)return `<h1>Google Classroom</h1><section class="card"><p>Cette section est réservée à l'administration.</p></section>`;
  setTimeout(()=>loadClassroomStatus(),0);
  return `<div class="eyebrow">SYNCHRONISATION GOOGLE</div><h1>Google Classroom</h1><div class="grid two"><section class="card"><h2>État de la connexion</h2><div id="classroomPanel"><p class="muted">Diagnostic en cours…</p></div></section><section class="card"><h2>À quoi sert Classroom ?</h2><p>Classroom est facultatif pour l'inscription Edulink. Les étudiants peuvent déjà créer leur compte directement et leur email est enregistré dans le répertoire Edulink.</p><p class="muted">Quand Classroom est connecté avec un compte enseignant, Edulink peut aussi récupérer les cours, les listes d'étudiants et les devoirs Classroom.</p><div class="notice">Si aucun cours n'apparaît, reconnectez Google avec le compte qui est réellement enseignant ou propriétaire des classes Classroom concernées.</div></section></div>`;
}

function classDirectoryRows(){
  const rows=studentEmailDirectory();
  return rows.length?rows.map(x=>`<tr><td>${esc(x.name||'—')}</td><td>${esc(x.email)}</td><td><span class="status ${x.status==='Compte actif'?'green':'orange'}">${esc(x.status)}</span></td><td>${esc(x.source)}</td></tr>`).join(''):'<tr><td colspan="4" class="muted">Aucun email étudiant collecté.</td></tr>';
}
classesPage=function(){
  const classes=state.data.classes||[],emails=studentEmailDirectory();
  return `<h1>Classes & étudiants</h1><div class="grid two"><section class="card"><h2>Collecter des e-mails</h2><p class="muted">Classroom n'est pas obligatoire. Collez ici des adresses reçues par formulaire, inscription, Excel ou autre source.</p><form id="emailImportForm"><div class="field"><label>Classe</label><select name="classId" required>${classes.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label>E-mails</label><textarea name="emails" required placeholder="etudiant1@email.com\netudiant2@email.com\netudiant3@email.com"></textarea></div><button class="btn">Ajouter au répertoire</button></form></section><section class="card"><h2>Accès étudiants</h2><div class="notice success"><b>Mode simplifié actif :</b> les étudiants créent eux-mêmes leur compte avec nom + email + mot de passe.</div><div class="row" style="margin-top:14px"><b>E-mails collectés</b><span class="status green">${emails.length}</span></div><div class="actions" style="margin-top:12px"><button class="btn secondary" id="copyStudentEmails">Copier tous les e-mails</button></div></section></div><section class="card" style="margin-top:18px"><h2>Répertoire étudiant</h2><div class="table-wrap"><table><thead><tr><th>Nom</th><th>Email</th><th>Statut</th><th>Source</th></tr></thead><tbody>${classDirectoryRows()}</tbody></table></div></section>`;
};
bindClasses=function(){
  document.getElementById('emailImportForm')?.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget),emails=String(f.get('emails')||'').split(/[\s,;]+/).map(x=>x.trim().toLowerCase()).filter(Boolean);if(!emails.length)return toast('Ajoutez au moins un e-mail.');try{const d=await api({action:'enrollBatch',classId:f.get('classId'),emails});toast(`${d.count||emails.length} e-mail(s) ajouté(s).`);await refresh()}catch(err){toast(err.message)}});
  document.getElementById('copyStudentEmails')?.addEventListener('click',async()=>{const text=studentEmailDirectory().map(x=>x.email).join('\n');if(!text)return toast('Aucun e-mail à copier.');try{await navigator.clipboard.writeText(text);toast('Liste copiée.')}catch{toast('Copie impossible sur ce navigateur.')}});
};

const baseRenderPageOps=renderPage;
renderPage=function(){
  const v=document.getElementById('view');
  if(state.page==='notifications'){v.innerHTML=notificationsPage();bindNotifications();return;}
  if(state.page==='classroom'){v.innerHTML=classroomWorkspace();return;}
  return baseRenderPageOps();
};

window.retryNotificationEmail=retryNotificationEmail;
