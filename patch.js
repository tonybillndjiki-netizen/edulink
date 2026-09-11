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
window.sendMessage=sendMessage;
