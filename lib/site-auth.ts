import {getUser} from '@netlify/identity';
import {cookies} from 'next/headers';
import {cache} from 'react';

// Use the project's canonical endpoint, never a Host header supplied by a client.
const identityUserUrl='https://clasicolombicultura.netlify.app/.netlify/identity/user';
async function verifiedSession(){
 let token:string|undefined;
 try{token=(await cookies()).get('nf_jwt')?.value;}catch{/* Outside a Next.js request, use the SDK context below. */}
 if(!token)return getUser();
 // The Identity SDK's server cookie reader uses Netlify.context.cookies, which
 // is not always populated by the Next.js runtime. Read the request cookie via
 // Next.js and ask Identity to verify it; never authorize decoded JWT claims.
 try{
  const response=await fetch(identityUserUrl,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});
  if(!response.ok)return null;
  const user=await response.json();
  if(typeof user?.id!=='string'||!user.id||typeof user.email!=='string'||typeof user.confirmed_at!=='string'||!user.confirmed_at)return null;
  return{email:user.email,confirmedAt:user.confirmed_at,name:typeof user.user_metadata?.full_name==='string'?user.user_metadata.full_name:undefined};
 }catch{return null;}
}
// Netlify verifies the session. Never trust incoming identity headers.
export const getSocietyManager=cache(async()=>{
 const email=process.env.SOCIETY_MANAGER_EMAIL?.trim().toLowerCase();
 const userId=process.env.SOCIETY_MANAGER_USER_KEY?.trim();
 if(!email||!userId)return null;
 const user=await verifiedSession();
 if(!user?.confirmedAt||user.email?.toLowerCase()!==email)return null;
 return{userId,email:user.email,displayName:user.name||user.email};
});
