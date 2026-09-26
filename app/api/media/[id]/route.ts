import {getSocietyManager} from '@/lib/site-auth';
import {database} from '@/lib/store';
import {bucket} from '@/lib/assets';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
 try{
 const a=await database().prepare('SELECT a.*,s.published,s.crest_key FROM assets a JOIN societies s ON s.id=a.society_id WHERE a.id=?').bind(id).first<any>();
 if(!a)return new Response('Archivo no disponible',{status:404,headers});
 const owner=await getSocietyManager();let allowed=owner?.userId===a.owner;
 if(!allowed&&a.published)allowed=a.crest_key===id||!!await database().prepare('SELECT id FROM entries WHERE society_id=? AND published=1 AND (image_key=? OR file_key=?)').bind(a.society_id,id,id).first();
 if(!allowed)return new Response('Archivo no disponible',{status:404,headers});
 const object=await bucket().get(a.society_id+'/'+id);if(!object)return new Response('Archivo no disponible',{status:404,headers});
 return new Response(object.body,{headers:{...headers,'Content-Type':a.type,'Content-Disposition':(a.kind==='image'?'inline':'attachment')+"; filename*=UTF-8''"+encodeURIComponent(a.name)}});
 }catch(e){console.error('read asset',e);return new Response('No se pudo cargar el archivo',{status:503,headers});}
}
