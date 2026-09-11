// Authentification Edulink : connexion classique + première connexion par code email.
let signupFlow={challenge:null,email:null,displayName:null,proofId:null};

function authNotice(message,type='notice'){const el=document.getElementById('authMsg');if(el)el.innerHTML=`<p class="notice ${type}">${esc(message)}</p>`}

showLogin=function(){
  document.body.innerHTML=`<section class="login"><div class="login-hero"><span class="pill">MBN Global Education · Bachelor 3</span><h1>Edulink</h1><p>Votre parcours pédagogique, vos cours, vos devoirs, vos évaluations et vos compétences au même endroit.</p></div><div class="login-panel"><form class="auth-card" id="loginForm"><h2>Connexion</h2><p class="muted">Vous avez déjà créé votre mot de passe ? Connectez-vous ici.</p><div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" required></div><div class="field"><label>Mot de passe</label><input name="password" type="password" autocomplete="current-password" minlength="8" required></div><button class="btn" type="submit">Se connecter</button><hr style="border:0;border-top:1px solid #e2e8f0;margin:22px 0"><p class="muted"><b>Première connexion ?</b> Vérifiez d'abord votre adresse e-mail avec un code à 6 chiffres.</p><button class="btn secondary" type="button" id="firstLogin">Créer mon accès étudiant</button><div id="authMsg"></div></form></div></section>`;
  $('#loginForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{const s=await auth('/auth/v1/token?grant_type=password',{email:String(f.get('email')).trim().toLowerCase(),password:f.get('password')});saveSession(s);await refresh()}catch(err){authNotice(err.message,'error')}};
  $('#firstLogin').onclick=()=>renderSignupEmail();
};

function renderSignupEmail(){
  const card=document.querySelector('.auth-card');
  card.innerHTML=`<h2>Première connexion</h2><p class="muted">1/3 · Indiquez votre identité et votre adresse e-mail. Un code de vérification vous sera envoyé.</p><form id="signupEmail"><div class="field"><label>Nom complet</label><input name="displayName" autocomplete="name" required></div><div class="field"><label>Adresse e-mail</label><input name="email" type="email" autocomplete="email" required></div><button class="btn">Recevoir mon code</button><button class="btn ghost" type="button" id="backLogin">Retour à la connexion</button><div id="authMsg"></div></form>`;
  $('#backLogin').onclick=showLogin;
  $('#signupEmail').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),button=e.currentTarget.querySelector('button[type=submit]');button.disabled=true;authNotice('Envoi du code…');try{const r=await fetch('/api/auth/request-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:f.get('email'),displayName:f.get('displayName')})});const d=await r.json();if(!r.ok)throw Error(d.error||'Envoi impossible.');signupFlow={challenge:d.challenge,email:String(f.get('email')).trim().toLowerCase(),displayName:String(f.get('displayName')).trim(),proofId:null};renderSignupCode()}catch(err){button.disabled=false;authNotice(err.message,'error')}};
}

function renderSignupCode(){
  const card=document.querySelector('.auth-card');
  card.innerHTML=`<h2>Vérifiez votre e-mail</h2><p class="muted">2/3 · Un code à 6 chiffres a été envoyé à <b>${esc(signupFlow.email)}</b>. Il expire après 10 minutes.</p><form id="signupCode"><div class="field"><label>Code de vérification</label><input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="000000" required style="font-size:24px;letter-spacing:8px;text-align:center"></div><button class="btn">Vérifier le code</button><button class="btn ghost" type="button" id="restartSignup">Changer d'adresse</button><div id="authMsg"></div></form>`;
  $('#restartSignup').onclick=renderSignupEmail;
  $('#signupCode').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),button=e.currentTarget.querySelector('button[type=submit]');button.disabled=true;authNotice('Vérification…');try{const r=await fetch('/api/auth/verify-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({challenge:signupFlow.challenge,code:String(f.get('code')).trim()})});const d=await r.json();if(!r.ok)throw Error(d.error||'Code incorrect.');signupFlow.email=d.email;signupFlow.displayName=d.displayName;signupFlow.proofId=d.proofId;renderSignupPassword()}catch(err){button.disabled=false;authNotice(err.message,'error')}};
}

function renderSignupPassword(){
  const card=document.querySelector('.auth-card');
  card.innerHTML=`<h2>Créez votre mot de passe</h2><p class="muted">3/3 · Votre adresse est vérifiée. Choisissez maintenant votre mot de passe Edulink.</p><form id="signupPassword"><div class="field"><label>Nouveau mot de passe</label><input name="password" type="password" autocomplete="new-password" minlength="8" required></div><div class="field"><label>Confirmer le mot de passe</label><input name="confirm" type="password" autocomplete="new-password" minlength="8" required></div><button class="btn">Créer mon compte et me connecter</button><div id="authMsg"></div></form>`;
  $('#signupPassword').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),pwd=String(f.get('password')||''),confirm=String(f.get('confirm')||''),button=e.currentTarget.querySelector('button[type=submit]');if(pwd!==confirm)return authNotice('Les deux mots de passe ne correspondent pas.','error');button.disabled=true;authNotice('Création de votre compte…');try{const r=await fetch('/api/auth/finalize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'complete',email:signupFlow.email,proofId:signupFlow.proofId,password:pwd})});const d=await r.json();if(!r.ok)throw Error(d.error||'Création impossible.');const s=await auth('/auth/v1/token?grant_type=password',{email:signupFlow.email,password:pwd});saveSession(s);await refresh()}catch(err){button.disabled=false;authNotice(err.message,'error')}};
}

classesPage=function(){
  return `<h1>Classes & étudiants</h1><div class="grid two"><section class="card"><h2>Créer une classe</h2><form id="classForm"><div class="field"><label>Nom</label><input name="name" required></div><button class="btn">Créer</button></form></section><section class="card"><h2>Accès étudiants</h2><p>Les étudiants créent désormais eux-mêmes leur compte depuis la page de connexion.</p><div class="notice success"><b>Parcours :</b> adresse e-mail → code de vérification → choix du mot de passe → connexion.</div></section></div><section class="card" style="margin-top:18px"><h2>Utilisateurs</h2><div class="table-wrap"><table><thead><tr><th>Nom</th><th>Email</th><th>Rôle</th></tr></thead><tbody>${state.data.profiles.map(p=>`<tr><td>${esc(p.display_name)}</td><td>${esc(p.email)}</td><td><span class="status ${p.role==='admin'?'blue':'green'}">${esc(p.role)}</span></td></tr>`).join('')}</tbody></table></div></section>`;
};

bindClasses=function(){
  $('#classForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await api({action:'createClass',name:f.get('name')});toast('Classe créée.');await refresh()}catch(x){toast(x.message)}};
};

window.renderSignupEmail=renderSignupEmail;
window.renderSignupCode=renderSignupCode;
window.renderSignupPassword=renderSignupPassword;
if(!token())showLogin();
