import {getSocietyManager} from '@/lib/site-auth';
import {isTrustedWriteOrigin} from '@/lib/request-origin';
import {database,publicFields,unpack} from '@/lib/store';
import {validAsset} from '@/lib/assets';
import {deleteSocietyContent} from '@/lib/content-deletion';
import {regions,slugify,eventTypes} from '@/lib/model';
import {z} from 'zod';
export const dynamic='force-dynamic';
const short=(n:number)=>z.string().trim().max(n).default('');
const asset=z.union([z.literal(''),z.string().uuid()]).default('');
const societyInput=z.object({name:z.string().trim().min(2).max(180),region:z.string(),province:z.string(),town:short(120),description:short(15000),email:z.union([z.literal(''),z.string().email().max(254)]).default(''),phone:short(40),address:short(250),published:z.number().int().min(0).max(1).default(0),crest_key:asset,headline:short(200),intro:short(1000),season:short(50),social_url:short(500).refine(s=>!s||/^https?:\/\//i.test(s)&&URL.canParse(s),{message:'El enlace debe comenzar por https:// o http://.'})}).refine(s=>regions.some(r=>r.id===s.region&&r.provinces.includes(s.province)),{message:'Selecciona una comunidad y una provincia válidas.'});
const entryInput=z.object({society_id:z.string().uuid(),kind:z.enum(['news','result','event','photo','member']),title:z.string().trim().min(2).max(200),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s),body:short(30000),rows:z.array(z.object({position:z.number().int().min(1).max(100000),participant:z.string().trim().min(1).max(180),pigeon:short(180),points:z.number().finite().min(0).max(100000000)})).max(1000).default([]),published:z.number().int().min(0).max(1).default(0),news_featured:z.boolean().default(false),news_priority:z.number().int().min(1).max(999).default(100),category:short(80),time:short(5).refine(s=>!s||/^([01]\d|2[0-3]):[0-5]\d$/.test(s)),location:short(250),season:short(50),image_key:asset,file_key:asset,member_number:short(40),table_data:z.object({headers:z.array(z.string().max(200)).max(30),rows:z.array(z.array(z.string().max(500)).max(30)).max(1000)}).default({headers:[],rows:[]})}).superRefine((e,c)=>{
 const bad=(message:string)=>c.addIssue({code:'custom',message});
 if(e.kind==='news'&&!e.body)bad('Añade el texto de la noticia.');
 if(e.news_featured&&e.kind!=='news')bad('Solo las noticias pueden destacarse en la página principal.');
 if(e.kind==='result'&&!e.rows.length&&!e.file_key)bad('Añade una clasificación o adjunta un PDF.');
 if(e.kind==='photo'&&!e.image_key)bad('Selecciona una fotografía.');
 if(e.kind==='event'&&!eventTypes.some(t=>t.value===e.category))bad('Selecciona el tipo de evento.');
 if(e.table_data.rows.length&&(!e.table_data.headers.length||e.table_data.rows.some(r=>r.length!==e.table_data.headers.length)))bad('La tabla importada no tiene un formato válido.');
});
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export async function GET(request:Request){
 try{const db=database(),manage=new URL(request.url).searchParams.has('manage'),user=await getSocietyManager();
 if(manage&&!user)return json({error:'Solo el administrador puede gestionar sociedades.'},401);
 const societies=await db.prepare('SELECT '+publicFields+' FROM societies WHERE '+(manage?'owner=?':'published=1')+' ORDER BY LOWER(name)').bind(...(manage?[user!.userId]:[])).all();
 const items=await db.prepare('SELECT e.* FROM entries e JOIN societies s ON s.id=e.society_id WHERE '+(manage?'s.owner=?':'s.published=1 AND e.published=1')+' ORDER BY e.date DESC,e.updated DESC').bind(...(manage?[user!.userId]:[])).all();
 return json({societies:societies.results,entries:items.results.map(unpack)});
 }catch(e){console.error('read societies',e);return json({error:'No se pudo cargar la información. Vuelve a intentarlo.'},503);}
}
export async function POST(request:Request){
 try{
 const user=await getSocietyManager();if(!user)return json({error:'Solo el administrador puede guardar cambios.'},401);
 if(!isTrustedWriteOrigin(request))return json({error:'Solicitud no permitida.'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Formato no válido.'},415);
 const raw=await request.text();if(raw.length>2000000)return json({error:'El contenido es demasiado grande.'},413);
 let p:any;try{p=JSON.parse(raw);}catch{return json({error:'Datos no válidos.'},400);}if(!p||typeof p!=='object')return json({error:'Datos no válidos.'},400);
 const db=database();let now=new Date().toISOString();
 if(p.action==='save-society'){
 let old:any=null;if(p.id){old=await db.prepare('SELECT * FROM societies WHERE id=? AND owner=?').bind(z.string().uuid().parse(p.id),user.userId).first();if(!old)return json({error:'No tienes permiso para editar esta sociedad.'},403);if(old.updated>=now)now=new Date(Date.parse(old.updated)+1).toISOString();}
 const s=societyInput.parse({...old,...p.data}),id=old?.id||crypto.randomUUID();let slug=old?.slug||slugify(s.name)||'sociedad';
 if(!await validAsset(s.crest_key,id,user.userId,'image'))return json({error:'El escudo debe pertenecer a esta sociedad.'},400);
 const keys=Object.keys(s),values=Object.values(s);
 if(old){const r=await db.prepare('UPDATE societies SET '+keys.map(k=>k+'=?').join(',')+',updated=? WHERE id=? AND owner=? AND updated=?').bind(...values,now,id,user.userId,p.updated||'').run();if(!r.meta.changes)return json({error:'Esta sociedad ha cambiado en otra sesión. Recarga la página antes de guardar.'},409);}
 else{if(slug==='plantilla'||await db.prepare('SELECT id FROM societies WHERE slug=?').bind(slug).first())slug+='-'+id.slice(0,8);await db.prepare('INSERT INTO societies (id,owner,slug,created,updated,'+keys.join(',')+') VALUES ('+Array(keys.length+5).fill('?').join(',')+')').bind(id,user.userId,slug,now,now,...values).run();}
 return json({id,slug,updated:now});
 }
 if(p.action==='save-entry'){
 let old:any=null;if(p.id){old=await db.prepare('SELECT e.* FROM entries e JOIN societies s ON s.id=e.society_id WHERE e.id=? AND s.owner=?').bind(z.string().uuid().parse(p.id),user.userId).first();if(!old)return json({error:'Contenido no encontrado.'},404);old=unpack(old);if(old.updated>=now)now=new Date(Date.parse(old.updated)+1).toISOString();}
 const e=entryInput.parse({...old,...p.data});
 if(old&&(old.society_id!==e.society_id||old.kind!==e.kind))return json({error:'Este contenido pertenece a otra sección.'},400);
 if(!await db.prepare('SELECT id FROM societies WHERE id=? AND owner=?').bind(e.society_id,user.userId).first())return json({error:'No tienes permiso para editar esta sociedad.'},403);
 if(!await validAsset(e.image_key,e.society_id,user.userId,'image')||!await validAsset(e.file_key,e.society_id,user.userId,'attachment'))return json({error:'Los archivos deben pertenecer a esta sociedad.'},400);
 const stored={...e,rows:JSON.stringify(e.rows),table_data:JSON.stringify(e.table_data)},keys=Object.keys(stored),values=Object.values(stored),id=old?.id||crypto.randomUUID();
 if(old){const r=await db.prepare('UPDATE entries SET '+keys.map(k=>k+'=?').join(',')+',updated=? WHERE id=? AND updated=?').bind(...values,now,id,p.updated||'').run();if(!r.meta.changes)return json({error:'El contenido ha cambiado. Recarga la página antes de guardar.'},409);}
 else await db.prepare('INSERT INTO entries (id,updated,'+keys.join(',')+') VALUES ('+Array(keys.length+2).fill('?').join(',')+')').bind(id,now,...values).run();
 return json({id,updated:now});
 }
 if(['delete-entry','delete-content','delete-society'].includes(p.action)){const result=await deleteSocietyContent(p,user.userId);return json(result.body,result.status);}
 return json({error:'Acción no válida.'},400);
 }catch(e){if(e instanceof z.ZodError)return json({error:'Revisa los datos: '+e.issues.map(i=>i.message).join(' ')},400);console.error('save societies',e);return json({error:'No se pudo guardar. Tus cambios siguen en el formulario; vuelve a intentarlo.'},503);}
}
