import {getSocietyManager} from '@/lib/site-auth';
import {isTrustedWriteOrigin} from '@/lib/request-origin';
import {database} from '@/lib/store';
import {bucket,fileType} from '@/lib/assets';
export const dynamic='force-dynamic';
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'private, no-store'}});
export async function POST(request:Request){
 const user=await getSocietyManager();if(!user)return json({error:'Solo el administrador puede subir archivos.'},401);
 if(!isTrustedWriteOrigin(request))return json({error:'Solicitud no permitida.'},403);
 if(!request.headers.get('content-type')?.startsWith('multipart/form-data'))return json({error:'Formato no válido.'},415);
 try{
 const limit=9*1024*1024;let size=0;const chunks:Uint8Array[]=[];const reader=request.body?.getReader();if(!reader)return json({error:'Selecciona un archivo.'},400);
 while(true){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>limit){await reader.cancel();return json({error:'El archivo supera el tamaño permitido.'},413);}chunks.push(next.value);}
 const raw=new Uint8Array(size);let offset=0;for(const c of chunks){raw.set(c,offset);offset+=c.length;}
 const form=await new Response(raw,{headers:{'content-type':request.headers.get('content-type')!}}).formData();
 const society=String(form.get('society_id')||''),kind=String(form.get('kind')||''),file=form.get('file');
 if(!['image','attachment'].includes(kind)||!file||typeof file==='string')return json({error:'Selecciona un archivo válido.'},400);
 if(!await database().prepare('SELECT id FROM societies WHERE id=? AND owner=?').bind(society,user.userId).first())return json({error:'No tienes permiso para editar esta sociedad.'},403);
 if(!file.size||file.size>(kind==='image'?5:8)*1024*1024)return json({error:kind==='image'?'La imagen debe ocupar como máximo 5 MB.':'El documento debe ocupar como máximo 8 MB.'},413);
 const bytes=new Uint8Array(await file.arrayBuffer()),type=fileType(bytes,file.name,kind);if(!type)return json({error:kind==='image'?'Usa una imagen PNG, JPG, WebP o GIF.':'Usa un documento Excel (.xlsx, .xls, .xlsm, .xlsb), CSV o PDF.'},400);
 const id=crypto.randomUUID(),key=society+'/'+id,name=file.name.replace(/[\x00-\x1f\x7f]/g,'').slice(0,200)||'archivo';
 await bucket().put(key,bytes,{httpMetadata:{contentType:type}});
 try{await database().prepare('INSERT INTO assets (id,society_id,owner,name,type,kind,created) VALUES (?,?,?,?,?,?,?)').bind(id,society,user.userId,name,type,kind,new Date().toISOString()).run();}catch(e){await bucket().delete(key);throw e;}
 return json({id,name});
 }catch(e){console.error('upload asset',e);return json({error:'No se pudo subir el archivo. Vuelve a intentarlo.'},503);}
}
