import {getSocietyManager} from '@/lib/site-auth';
import {isTrustedWriteOrigin} from '@/lib/request-origin';
import {database} from '@/lib/store';
import {bucket,fileType} from '@/lib/assets';
import {z} from 'zod';
export const dynamic='force-dynamic';
const chunkSize=1024*1024;
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
const uuid=z.string().uuid();
export async function POST(request:Request){
 const user=await getSocietyManager();if(!user)return json({error:'Solo el administrador puede subir archivos.'},401);
 if(!isTrustedWriteOrigin(request))return json({error:'Solicitud no permitida.'},403);
 try{
  const db=database(),action=new URL(request.url).searchParams.get('action');
  if(action==='start'){
   const raw=await request.text();if(raw.length>2000)return json({error:'Datos no válidos.'},400);
   const p=z.object({society_id:uuid,name:z.string().min(1).max(200),kind:z.enum(['image','attachment']),size:z.number().int().min(1).max(8*1024*1024)}).parse(JSON.parse(raw));
   if(p.kind==='image'&&p.size>5*1024*1024)return json({error:'La imagen debe ocupar como máximo 5 MB.'},413);
   if(!await db.prepare('SELECT id FROM societies WHERE id=? AND owner=?').bind(p.society_id,user.userId).first())return json({error:'Sociedad no disponible.'},403);
   await db.prepare('DELETE FROM upload_sessions WHERE expires < ?').bind(new Date().toISOString()).run();
   const id=crypto.randomUUID();await db.prepare('INSERT INTO upload_sessions (id,society_id,owner,name,kind,size,expires) VALUES (?,?,?,?,?,?,?)').bind(id,p.society_id,user.userId,p.name.replace(/[\x00-\x1f\x7f]/g,''),p.kind,p.size,new Date(Date.now()+3600000).toISOString()).run();
   return json({id,chunkSize});
  }
  const id=uuid.parse(new URL(request.url).searchParams.get('id'));
  const session=await db.prepare('SELECT u.* FROM upload_sessions u JOIN societies s ON s.id=u.society_id WHERE u.id=? AND u.owner=? AND s.owner=? AND u.expires>?').bind(id,user.userId,user.userId,new Date().toISOString()).first<any>();
  if(!session)return json({error:'La subida ha caducado. Selecciona el archivo de nuevo.'},404);
  if(action==='cancel'){await db.prepare('DELETE FROM upload_sessions WHERE id=? AND owner=?').bind(id,user.userId).run();return json({ok:true});}
  if(action==='chunk'){
   const index=z.coerce.number().int().min(0).max(7).parse(new URL(request.url).searchParams.get('index'));
   const expected=Math.min(chunkSize,session.size-index*chunkSize);
   if(expected<=0)return json({error:'Fragmento no válido.'},400);
   const bytes=await request.arrayBuffer();if(bytes.byteLength!==expected)return json({error:'El archivo no ha llegado completo.'},400);
   await db.prepare('INSERT INTO upload_chunks (upload_id,part,content) VALUES (?,?,?) ON CONFLICT (upload_id,part) DO UPDATE SET content=excluded.content').bind(id,index,Buffer.from(bytes).toString('base64')).run();
   return json({ok:true});
  }
  if(action==='finish'){
   const chunks=await db.prepare('SELECT part,content FROM upload_chunks WHERE upload_id=? ORDER BY part').bind(id).all<{part:number;content:string}>();
   if(chunks.results.length!==Math.ceil(session.size/chunkSize)||chunks.results.some((c,i)=>c.part!==i))return json({error:'Faltan partes del archivo. Vuelve a subirlo.'},400);
   const bytes=new Uint8Array(Buffer.concat(chunks.results.map(c=>Buffer.from(c.content,'base64'))));
   if(bytes.length!==session.size)return json({error:'El archivo no ha llegado completo.'},400);
   const type=fileType(bytes,session.name,session.kind);if(!type)return json({error:'El formato del archivo no es válido.'},400);
   const assetId=crypto.randomUUID(),key=session.society_id+'/'+assetId;
   await bucket().put(key,bytes);
   try{await db.batch([
    db.prepare('INSERT INTO assets (id,society_id,owner,name,type,kind,created) VALUES (?,?,?,?,?,?,?)').bind(assetId,session.society_id,user.userId,session.name,type,session.kind,new Date().toISOString()),
    db.prepare('DELETE FROM upload_sessions WHERE id=?').bind(id)
   ]);}catch(e){await bucket().delete(key);throw e;}
   return json({id:assetId,name:session.name});
  }
  return json({error:'Acción no válida.'},400);
 }catch(e){if(e instanceof z.ZodError||e instanceof SyntaxError)return json({error:'Datos no válidos.'},400);console.error('upload document',e);return json({error:'No se pudo subir el archivo. Vuelve a intentarlo.'},503);}
}
