// Correctifs fonctionnels chargés après l'application principale.
async function sendMessage(event){
  event.preventDefault();
  const form=event.currentTarget, data=new FormData(form), text=String(data.get('text')||'').trim();
  if(!text)return;
  try{
    await api({action:'saveOperational',kind:'message',payload:{text}});
    toast('Message envoyé.');
    form.reset();
    await refresh();
  }catch(e){toast(e.message)}
}
messagesPage=function(){
  const rs=records('message');
  return `<h1>Messagerie</h1><section class="card"><form onsubmit="sendMessage(event)"><div class="field"><label>Message à l’équipe pédagogique</label><textarea name="text" required></textarea></div><button class="btn">Envoyer</button></form></section>${rs.map(r=>`<section class="card" style="margin-top:12px"><p>${esc(r.payload.text)}</p><small class="muted">${esc(r.created_at||'')}</small></section>`).join('')}`
};

async function classroomApi(action, payload=null){
  const isPost=payload!==null;
  const url=isPost?'/api/classroom':'/api/classroom?action='+encodeURIComponent(action);
  const r=await fetch(url,{method:isPost?'POST':'GET',headers:{Authorization:'Bearer '+token(),...(isPost?{'Content-Type':'application/json'}:{})},body:isPost?JSON.stringify({action,...payload}):undefined});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(d.error||'Google Classroom indisponible.');
  return d;
}

async function connectClassroom(){
  try{
    const r=await fetch('/api/classroom/connect',{method:'POST',headers:{Authorization:'Bearer '+token()}}),d=await r.json();
    if(!r.ok)throw Error(d.error||'Connexion Classroom impossible.');
    location.href=d.url;
  }catch(e){toast(e.message)}
}

async function disconnectClassroom(){
  if(!confirm('Déconnecter Google Classroom de ce compte Edulink ?'))return;
  try{await classroomApi('disconnect',{});toast('Google Classroom déconnecté.');await loadClassroomStatus()}catch(e){toast(e.message)}
}

function classroomClassOptions(selected=''){
  const classes=state.data?.classes||[];
  return `<option value="">Choisir une classe Edulink</option>${classes.map(c=>`<option value="${esc(c.id)}" ${c.id===selected?'selected':''}>${esc(c.name)}</option>`).join('')}`;
}

async function loadClassroomStatus(){
  const box=document.getElementById('classroomPanel');
  if(!box||!state.data?.teacher)return;
  box.innerHTML='<p class="muted">Vérification de Google Classroom…</p>';
  try{
    const status=await classroomApi('status');
    if(!status.connected){
      box.innerHTML=`<div class="row"><div><b>Google Classroom</b><div class="muted">Aucun compte Google connecté.</div></div><span class="status orange">À connecter</span></div><div class="actions" style="margin-top:14px"><button class="btn" onclick="connectClassroom()">Connecter Google Classroom</button></div>`;
      return;
    }
    const data=await classroomApi('courses');
    box.innerHTML=`<div class="row"><div><b>Google Classroom connecté</b><div class="muted">${esc(status.email||'Compte Google autorisé')} · ${data.courses.length} cours trouvé(s)</div></div><span class="status green">Connecté</span></div><div class="actions" style="margin:14px 0"><button class="btn secondary" onclick="loadClassroomStatus()">Actualiser</button><button class="btn secondary" onclick="disconnectClassroom()">Déconnecter</button></div><div id="classroomCourses">${data.courses.length?data.courses.map(c=>{const mapping=(status.mappings||{})[c.id]||{};return `<section class="card" style="margin-top:12px"><div class="row"><div><b>${esc(c.name)}</b><div class="muted">${esc(c.section||'')}${c.room?' · '+esc(c.room):''}</div></div><span class="status ${c.courseState==='ACTIVE'?'green':'orange'}">${esc(c.courseState||'')}</span></div><div class="field" style="margin-top:12px"><label>Classe Edulink associée</label><select data-class-map="${esc(c.id)}">${classroomClassOptions(mapping.edulinkClassId||'')}</select></div><div class="actions"><button class="btn" data-sync-course="${esc(c.id)}" data-course-name="${esc(c.name)}">Synchroniser les étudiants</button><button class="btn secondary" data-roster-course="${esc(c.id)}">Voir les étudiants</button><button class="btn secondary" data-work-course="${esc(c.id)}">Voir les devoirs Classroom</button>${c.alternateLink?`<a class="btn ghost" href="${esc(c.alternateLink)}" target="_blank" rel="noopener">Ouvrir Classroom</a>`:''}</div><div data-course-detail="${esc(c.id)}" style="margin-top:12px"></div></section>`}).join(''):'<p class="notice">Aucun cours Classroom accessible avec ce compte Google.</p>'}</div>`;
    bindClassroomCourses();
  }catch(e){box.innerHTML=`<p class="notice error">${esc(e.message)}</p><button class="btn" onclick="connectClassroom()">Reconnecter Google Classroom</button>`}
}

function findCourseDetail(courseId){return [...document.querySelectorAll('[data-course-detail]')].find(x=>x.dataset.courseDetail===courseId)}
function findCourseSelect(courseId){return [...document.querySelectorAll('[data-class-map]')].find(x=>x.dataset.classMap===courseId)}

function bindClassroomCourses(){
  document.querySelectorAll('[data-sync-course]').forEach(btn=>btn.onclick=()=>syncClassroomRoster(btn.dataset.syncCourse,btn.dataset.courseName||''));
  document.querySelectorAll('[data-roster-course]').forEach(btn=>btn.onclick=()=>showClassroomRoster(btn.dataset.rosterCourse));
  document.querySelectorAll('[data-work-course]').forEach(btn=>btn.onclick=()=>showClassroomWork(btn.dataset.workCourse));
}

async function syncClassroomRoster(courseId,courseName){
  const select=findCourseSelect(courseId), classId=select?.value;
  if(!classId)return toast('Choisissez d’abord une classe Edulink.');
  const detail=findCourseDetail(courseId);if(detail)detail.innerHTML='<p class="muted">Synchronisation en cours…</p>';
  try{
    const d=await classroomApi('syncRoster',{courseId,courseName,edulinkClassId:classId});
    if(detail)detail.innerHTML=`<p class="notice success">${d.count} étudiant(s) synchronisé(s) dans Edulink.</p>`;
    toast('Liste Classroom synchronisée.');
    await refresh();
  }catch(e){if(detail)detail.innerHTML=`<p class="notice error">${esc(e.message)}</p>`;else toast(e.message)}
}

async function showClassroomRoster(courseId){
  const detail=findCourseDetail(courseId);if(!detail)return;
  detail.innerHTML='<p class="muted">Chargement des étudiants…</p>';
  try{
    const d=await classroomApi('roster',{courseId});
    detail.innerHTML=`<h3>Étudiants Classroom (${d.students.length})</h3>${d.students.length?`<div class="table-wrap"><table><thead><tr><th>Nom</th><th>Email</th></tr></thead><tbody>${d.students.map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(s.email||'Non visible')}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Aucun étudiant.</p>'}`;
  }catch(e){detail.innerHTML=`<p class="notice error">${esc(e.message)}</p>`}
}

async function showClassroomWork(courseId){
  const detail=findCourseDetail(courseId);if(!detail)return;
  detail.innerHTML='<p class="muted">Chargement des travaux…</p>';
  try{
    const d=await classroomApi('coursework',{courseId});
    detail.innerHTML=`<h3>Travaux Classroom (${d.courseWork.length})</h3>${d.courseWork.length?d.courseWork.map(w=>`<div class="row" style="padding:10px 0;border-bottom:1px solid #e2e8f0"><div><b>${esc(w.title)}</b><div class="muted">${esc(w.state||'')}${w.dueDate?` · échéance ${w.dueDate.day}/${w.dueDate.month}/${w.dueDate.year}`:''}</div></div>${w.alternateLink?`<a class="btn ghost" href="${esc(w.alternateLink)}" target="_blank" rel="noopener">Ouvrir</a>`:''}</div>`).join(''):'<p class="muted">Aucun travail.</p>'}`;
  }catch(e){detail.innerHTML=`<p class="notice error">${esc(e.message)}</p>`}
}

const baseSettingsPage=settingsPage;
settingsPage=function(){
  const i=state.data.integrations;
  const teacher=state.data.teacher;
  setTimeout(()=>{if(teacher)loadClassroomStatus()},0);
  return `<h1>Paramètres</h1><section class="card"><h2>Connexions</h2>${[['Base de données',i.database],['Stockage privé',i.storage],['Emails automatiques',i.email],['Régénération IA',i.aiRegeneration]].map(([n,ok])=>`<div class="row"><b>${n}</b><span class="status ${ok?'green':'orange'}">${ok?'Connecté':'À configurer'}</span></div>`).join('')}</section><section class="card" style="margin-top:18px"><h2>Google Classroom</h2>${teacher?'<div id="classroomPanel"><p class="muted">Vérification…</p></div>':'<p class="muted">La connexion Google Classroom est administrée par l’équipe pédagogique.</p>'}</section><section class="card" style="margin-top:18px"><h2>Sécurité</h2><p class="muted">Les banques de questions, corrigés et jetons Google restent côté serveur. Les jetons Classroom sont chiffrés avant stockage.</p></section>`;
};

window.sendMessage=sendMessage;
window.connectClassroom=connectClassroom;
window.disconnectClassroom=disconnectClassroom;

setTimeout(()=>{
  const params=new URLSearchParams(location.search), result=params.get('classroom');
  if(!result)return;
  if(result==='connected')toast('Google Classroom est maintenant connecté à Edulink.');
  else toast('Connexion Google Classroom incomplète : '+(params.get('reason')||'erreur OAuth'));
  history.replaceState({},'',location.pathname);
  if(state.data?.teacher){state.page='settings';render()}
},800);
