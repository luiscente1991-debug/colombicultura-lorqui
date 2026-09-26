import {database} from '@/lib/store';
import {bucket} from '@/lib/assets';
export const dynamic='force-dynamic';
const privateHeaders={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const imageTypes=new Set(['image/png','image/jpeg','image/webp','image/gif']);

// Separate, anonymous source for Image CDN: a manager's cookie cannot make a
// draft cacheable. Originals and attachments keep their existing private route.
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return new Response('Archivo no disponible',{status:404,headers:privateHeaders});
 try{
  const a=await database().prepare(`SELECT a.* FROM assets a JOIN societies s ON s.id=a.society_id
   WHERE a.id=? AND a.kind='image' AND s.published=1 AND
   (s.crest_key=a.id OR EXISTS (SELECT 1 FROM entries e WHERE e.society_id=a.society_id AND e.published=1 AND e.image_key=a.id))`)
   .bind(id).first<{society_id:string;type:string;name:string}>();
  if(!a||!imageTypes.has(a.type))return new Response('Archivo no disponible',{status:404,headers:privateHeaders});
  const object=await bucket().get(a.society_id+'/'+id);
  if(!object)return new Response('Archivo no disponible',{status:404,headers:privateHeaders});
  return new Response(object.body,{headers:{
   'Content-Type':a.type,'Content-Disposition':"inline; filename*=UTF-8''"+encodeURIComponent(a.name),
   'X-Content-Type-Options':'nosniff',
   // New uploads receive a new UUID. This TTL applies to the source response;
   // Image CDN maintains a separate transformed cache. Never cache errors/drafts.
   'Cache-Control':'public, max-age=300, must-revalidate',
   'Netlify-CDN-Cache-Control':'public, s-maxage=300, must-revalidate',
  }});
 }catch(e){console.error('read public image',e);return new Response('No se pudo cargar el archivo',{status:503,headers:privateHeaders});}
}
