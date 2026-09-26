import {getUser,logout} from '@netlify/identity';

export async function endAdminSession(){
 try{await logout();}catch{/* Always end this browser's session, including when Identity is unavailable. */}
 finally{
  // Identity's browser logout can throw before clearing its cookies. These are
  // the same host-only cookies written by the SDK; never inspect their values.
  for(const name of ['nf_jwt','nf_refresh'])document.cookie=`${name}=; Max-Age=0; path=/; secure; samesite=lax`;
  // With no cookie, the SDK clears any remaining cached browser session.
  try{await getUser();}catch{/* The expired cookies already deny server access. */}
  window.location.replace('/');
 }
}
