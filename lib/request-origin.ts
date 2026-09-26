const publicOrigin='https://clasicolombicultura.netlify.app';

/** Validate the browser's public origin, not Next.js's internal proxy URL. */
export function isTrustedWriteOrigin(request:Request){
 const origin=request.headers.get('origin');
 if(!origin||origin==='null')return false;
 try{if(new URL(origin).origin!==origin)return false;}catch{return false;}

 // Only server-configured Netlify URLs are trusted. Incoming Host and forwarded
 // headers must never be able to add another origin to this allowlist.
 const allowed=new Set([publicOrigin]);
 for(const value of [process.env.URL,process.env.DEPLOY_URL,process.env.DEPLOY_PRIME_URL]){
  if(!value)continue;
  try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password)allowed.add(url.origin);}catch{/* Ignore invalid configuration. */}
 }
 if(process.env.NODE_ENV!=='production')allowed.add(new URL(request.url).origin);
 return allowed.has(origin);
}
