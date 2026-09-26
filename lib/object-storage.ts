import {getStore,getDeployStore} from '@netlify/blobs';
import {database} from './store';
function files(){
 return process.env.SOCIETY_STORAGE_SCOPE==='production'
  ?getStore({name:'society-files',consistency:'strong'})
  :getDeployStore({name:'society-files',consistency:'strong'});
}
export function bucket(){return{
 async put(key:string,bytes:Uint8Array,_options?:unknown){await files().set(key,new Blob([new Uint8Array(bytes)]));},
 async get(key:string){
  const stored=await files().get(key,{type:'stream'});
  if(stored)return{body:stored};
  // Copy existing files once from the private migration seed, preserving IDs.
  const seed=await database().prepare('SELECT content FROM asset_imports WHERE key=?').bind(key).first<{content:string}>();
  if(!seed)return null;
  const bytes=new Uint8Array(Buffer.from(seed.content,'base64'));
  await files().set(key,new Blob([bytes]));
  await database().prepare('DELETE FROM asset_imports WHERE key=?').bind(key).run();
  return{body:bytes};
 },
 async delete(key:string|string[]){
  const keys=Array.isArray(key)?key:[key];
  for(const k of keys){await files().delete(k);await database().prepare('DELETE FROM asset_imports WHERE key=?').bind(k).run();}
 }
};}
