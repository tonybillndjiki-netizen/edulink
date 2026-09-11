// Contournement production du quota email Supabase : création des comptes par l'administration.
const ADMIN_AUTH='https://gzdixxmcptlymzjmjqat.supabase.co/functions/v1/edulink-admin-auth';
async function adminAuth(body){
  const r=await fetch(ADMIN_AUTH,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token(),'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json();
  if(!r.ok)throw Error(d.error||'Création du compte impossible.');
  return d;
}

showLogin=function(){
  document.body.innerHTML=`<section class="login"><div class="login-hero"><span class="pill">MBN Global Education · Bachelor 3</span><h1>Edulink</h1><p>Votre parcours pédagogique, vos cours, vos devoirs, vos évaluations et vos compétences au même endroit.</p></div><div class="login-panel"><form class="auth-card" id="loginForm"><h2>Connexion</h2><p class="muted">Utilisez le compte créé par votre établissement.</p><div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" required></div><div class="field"><label>Mot de passe</label><input name="password" type="password" autocomplete="current-password" minlength="8" required></div><button class="btn" type="submit">Se connecter</button><div class="notice" style="margin-top:16px">Les confirmations par e-mail et magic links sont temporairement désactivés afin d’éviter la limite d’envoi Supabase. Les comptes étudiants sont créés directement par l’équipe pédagogique.</div><div id="authMsg"></div></form></div></section>`;
  $('#loginForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{const s=await auth('/auth/v1/token?grant_type=password',{email:f.get('email'),password:f.get('password')});saveSession(s);await refresh()}catch(err){$('#authMsg').innerHTML=`<p class="notice error">${esc(err.message)}</p>`}};
};

classesPage=function(){
  return `<h1>Classes & étudiants</h1><div class="grid two"><section class="card"><h2>Créer une classe</h2><form id="classForm"><div class="field"><label>Nom</label><input name="name" required></div><button class="btn">Créer</button></form></section><section class="card"><h2>Créer un compte étudiant</h2><p class="muted">Le compte sera immédiatement confirmé. Aucun e-mail Supabase ne sera envoyé.</p><form id="studentAccountForm"><div class="field"><label>Nom complet</label><input name="displayName" required></div><div class="field"><label>Email</label><input name="email" type="email" required></div><div class="field"><label>Classe</label><select name="classId" required>${state.data.classes.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label>Mot de passe temporaire (facultatif)</label><input name="password" type="text" minlength="10" placeholder="Laisser vide pour générer automatiquement"></div><button class="btn">Créer le compte</button></form><div id="accountResult"></div></section></div><section class="card" style="margin-top:18px"><h2>Étudiants</h2><div class="table-wrap"><table><thead><tr><th>Nom</th><th>Email</th><th>Rôle</th></tr></thead><tbody>${state.data.profiles.map(p=>`<tr><td>${esc(p.display_name)}</td><td>${esc(p.email)}</td><td>${esc(p.role)}</td></tr>`).join('')}</tbody></table></div></section>`;
};

bindClasses=function(){
  $('#classForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await api({action:'createClass',name:f.get('name')});toast('Classe créée.');await refresh()}catch(x){toast(x.message)}};
  $('#studentAccountForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const result=$('#accountResult');result.innerHTML='<p class="notice">Création du compte…</p>';try{const d=await adminAuth({email:f.get('email'),displayName:f.get('displayName'),classId:f.get('classId'),password:f.get('password')||undefined});result.innerHTML=`<div class="notice success"><b>Compte créé et confirmé.</b><br>Email : ${esc(d.email)}<br>Mot de passe temporaire : <code id="tempPassword">${esc(d.password)}</code><br><small>Copiez ce mot de passe maintenant et transmettez-le à l’étudiant par un canal sécurisé.</small><br><button type="button" class="btn secondary" id="copyTemp" style="margin-top:10px">Copier le mot de passe</button></div>`;$('#copyTemp').onclick=async()=>{try{await navigator.clipboard.writeText(d.password);toast('Mot de passe copié.')}catch{toast('Copiez le mot de passe affiché.')}};setTimeout(()=>refresh(),1500)}catch(err){result.innerHTML=`<p class="notice error">${esc(err.message)}</p>`}};
};

window.adminAuth=adminAuth;
