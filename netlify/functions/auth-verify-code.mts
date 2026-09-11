import { createHash, createHmac, timingSafeEqual, randomBytes } from "node:crypto";
const json=(d:any,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
const sha=(s:string)=>createHash("sha256").update(s).digest("hex");
const sign=(p:string,k:string)=>createHmac("sha256",k).update(p).digest("base64url");
const safe=(a:string,b:string)=>{const A=Buffer.from(a),B=Buffer.from(b);return A.length===B.length&&timingSafeEqual(A,B)};
export default async(req:Request)=>{
 if(req.method!=="POST")return json({error:"Méthode non autorisée."},405);
 try{
  const {challenge,code}=await req.json(); const secret=Netlify.env.get("EDULINK_SIGNUP_BRIDGE_SECRET"); if(!secret)return json({error:"Service indisponible."},503);
  if(typeof challenge!=="string"||typeof code!=="string"||!/^\d{6}$/.test(code))return json({error:"Code invalide."},400);
  const [p,s]=challenge.split("."); if(!p||!s||!safe(sign(p,secret),s))return json({error:"Demande invalide."},400);
  const payload=JSON.parse(Buffer.from(p,"base64url").toString("utf8")); if(Date.now()>Number(payload.exp||0))return json({error:"Ce code a expiré. Demandez-en un nouveau."},400);
  if(!safe(sha(`${code}.${payload.nonce}`),String(payload.codeHash||"")))return json({error:"Code incorrect."},400);
  const proofId=randomBytes(24).toString("base64url");
  const r=await fetch("https://gzdixxmcptlymzjmjqat.supabase.co/functions/v1/edulink-self-signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"authorize",bridgeSecret:secret,email:payload.email,displayName:payload.displayName,proofId})});
  const d=await r.json().catch(()=>({})); if(!r.ok)return json({error:d.error||"Autorisation impossible."},r.status);
  return json({ok:true,email:payload.email,displayName:payload.displayName,proofId,expiresIn:300});
 }catch(e){console.error("auth-verify-code",e);return json({error:"Impossible de vérifier ce code."},500)}
};
export const config={path:"/api/auth/verify-code"};
