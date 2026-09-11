// Authentification Edulink : connexion classique + inscription étudiante immédiate.
const SELF_SIGNUP=SB+'/functions/v1/edulink-self-signup';
function authNotice(message,type='notice'){const el=document.getElementById('authMsg');if(el)el.innerHTML=`<p class="notice ${type}">${esc(message)}</p>`}
async function simpleStudentSignup(body){const r=await fetch(SELF_SIGNUP,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({action:'simpleSignup',...body})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Création du compte impossible.');return d}

showLogin=function(){
  document.body.innerHTML=`<section class="login"><div class="login-hero"><span class="pill">MBN Global Education · Bachelor 3</span><h1>Edulink</h1><p>Votre parcours pédagogique, vos cours, vos devoirs, vos évaluations et vos compétences au même endroit.</p></div><div class="login-panel"><form class="auth-card" id="loginForm"><h2>Connexion</h2><p class="muted">Vous avez déjà un compte ? Connectez-vous avec votre email et votre mot de passe.</p><div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" required></div><div class="field"><label>Mot de passe</label><input name="password" type="password" autocomplete="current-password" minlength="8" required></div><button class="btn" type="submit">Se connecter</button><hr style="border:0;border-top:1px solid #e2e8f0;margin:22px 0"><p class="muted"><b>Nouvel étudiant ?</b> Créez votre accès immédiatement, sans attendre d'e-mail.</p><button class="btn secondary" type="button" id="firstLogin">Créer mon compte étudiant</button><div id="authMsg"></div></form></div></section>`;
  $('#loginForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{const s=await auth('/auth/v1/token?grant_type=password',{email:String(f.get('email')).trim().toLowerCase(),password:f.get('password')});saveSession(s);await refresh()}catch(err){authNotice(err.message,'error')}};
  $('#firstLogin').onclick=()=>renderSimpleSignup();
};

function renderSimpleSignup(){
  const card=document.querySelector('.auth-card');
  card.innerHTML=`<h2>Créer mon accès étudiant</h2><p class="muted">Renseignez votre identité, votre email et choisissez votre mot de passe. Votre compte sera disponible immédiatement.</p><form id="simpleSignup"><div class="field"><label>Nom complet</label><input name="displayName" autocomplete="name" required></div><div class="field"><label>Adresse e-mail</label><input name="email" type="email" autocomplete="email" required></div><div class="field"><label>Mot de passe</label><input name="password" type="password" autocomplete="new-password" minlength="8" required></div><div class="field"><label>Confirmer le mot de passe</label><input name="confirm" type="password" autocomplete="new-password" minlength="8" required></div><button class="btn">Créer mon compte</button><button class="btn ghost" type="button" id="backLogin">Retour à la connexion</button><div id="authMsg"></div></form>`;
  $('#backLogin').onclick=showLogin;
  $('#simpleSignup').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),email=String(f.get('email')).trim().toLowerCase(),pwd=String(f.get('password')||''),confirm=String(f.get('confirm')||''),button=e.currentTarget.querySelector('button[type=submit]');if(pwd!==confirm)return authNotice('Les deux mots de passe ne correspondent pas.','error');button.disabled=true;authNotice('Création de votre compte…');try{await simpleStudentSignup({email,displayName:String(f.get('displayName')).trim(),password:pwd});const s=await auth('/auth/v1/token?grant_type=password',{email,password:pwd});saveSession(s);await refresh()}catch(err){button.disabled=false;authNotice(err.message,'error')}};
}

classesPage=function(){
  return `<h1>Classes & étudiants</h1><div class="grid two"><section class="card"><h2>Créer une classe</h2><form id="classForm"><div class="field"><label>Nom</label><input name="name" required></div><button class="btn">Créer</button></form></section><section class="card"><h2>Accès étudiants</h2><p>Les étudiants créent eux-mêmes leur compte depuis la page de connexion.</p><div class="notice success"><b>Mode simplifié actif :</b> nom + email + mot de passe → accès immédiat.</div><p class="muted" style="margin-top:10px">La validation par code e-mail pourra être réactivée dès que le domaine d’envoi sera totalement vérifié.</p></section></div><section class="card" style="margin-top:18px"><h2>Utilisateurs</h2><div class="table-wrap"><table><thead><tr><th>Nom</th><th>Email</th><th>Rôle</th></tr></thead><tbody>${state.data.profiles.map(p=>`<tr><td>${esc(p.display_name)}</td><td>${esc(p.email)}</td><td><span class="status ${p.role==='admin'?'blue':'green'}">${esc(p.role)}</span></td></tr>`).join('')}</tbody></table></div></section>`;
};

bindClasses=function(){
  $('#classForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await api({action:'createClass',name:f.get('name')});toast('Classe créée.');await refresh()}catch(x){toast(x.message)}};
};
window.renderSimpleSignup=renderSimpleSignup;
if(!token())showLogin();
