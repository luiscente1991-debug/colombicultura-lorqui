import {z} from 'zod';
import {database} from './store';
import {bucket} from './assets';
const scopes=z.enum(['news','result','event','photo','member','info']);
const snapshot=z.array(z.object({id:z.string().uuid(),updated:z.string().min(1).max(60)})).max(10000);
const requestInput=z.object({society_id:z.string().uuid(),updated:z.string().min(1),confirm_name:z.string(),scopes:z.array(scopes).min(1).max(6).optional(),entries:snapshot});
const response=(body:unknown,status=200)=>({body,status});
async function deleteObjects(keys:string[]){
 if(!keys.length)return false;
 try{for(let i=0;i<keys.length;i+=500)await bucket().delete(keys.slice(i,i+500));return false;}
 catch(e){console.error('remove detached files',e);return true;}
}
async function removeUnusedAssets(owner:string,ids:string[]){
 if(!ids.length)return {filesPending:false};
 const result=await database().prepare(`DELETE FROM assets WHERE owner=? AND id IN (SELECT json_array_elements_text(?::json))
 AND NOT EXISTS (SELECT 1 FROM societies s WHERE s.crest_key=assets.id)
 AND NOT EXISTS (SELECT 1 FROM entries e WHERE e.image_key=assets.id OR e.file_key=assets.id)
 RETURNING id,society_id`).bind(owner,JSON.stringify([...new Set(ids.filter(Boolean))])).all<{id:string;society_id:string}>();
 return {filesPending:await deleteObjects(result.results.map(a=>a.society_id+'/'+a.id))};
}
export async function deleteSocietyContent(payload:any,owner:string){
 const db=database();
 if(payload.action==='delete-entry'){
 const id=z.string().uuid().parse(payload.id),old=await db.prepare('SELECT e.* FROM entries e JOIN societies s ON s.id=e.society_id WHERE e.id=? AND s.owner=?').bind(id,owner).first<any>();
 if(!old)return response({error:'Contenido no encontrado.'},404);
 if(payload.updated&&payload.updated!==old.updated)return response({error:'Este contenido ha cambiado. Recarga antes de eliminarlo.'},409);
 const result=await db.prepare('DELETE FROM entries WHERE id=? AND society_id=? AND updated=?').bind(id,old.society_id,old.updated).run();
 if(!result.meta.changes)return response({error:'Este contenido ha cambiado. Recarga antes de eliminarlo.'},409);
 return response({ok:true,deleted:1,...await removeUnusedAssets(owner,[old.image_key,old.file_key])});
 }
 const p=requestInput.parse(payload),society=await db.prepare('SELECT * FROM societies WHERE id=? AND owner=?').bind(p.society_id,owner).first<any>();
 if(!society)return response({error:'No tienes permiso para eliminar contenido de esta sociedad.'},403);
 if(p.confirm_name!==society.name)return response({error:'Escribe el nombre exacto de la sociedad para confirmar.'},400);
 if(p.updated!==society.updated)return response({error:'La sociedad ha cambiado. Recarga y revisa la selección antes de eliminar.'},409);
 const deletingSociety=payload.action==='delete-society',selected=new Set(p.scopes||[]);
 if(!deletingSociety&&!selected.size)return response({error:'Selecciona qué contenido quieres eliminar.'},400);
 const all=await db.prepare('SELECT id,kind,updated,image_key,file_key FROM entries WHERE society_id=?').bind(p.society_id).all<any>();
 const target=all.results.filter(e=>deletingSociety||selected.has(e.kind));
 const expected=p.entries;
 // The browser sends only the entries selected for deletion. Refuse stale or incomplete confirmations.
 const signature=(rows:{id:string;updated:string}[])=>JSON.stringify(rows.map(e=>[e.id,e.updated]).sort((a,b)=>a[0].localeCompare(b[0])));
 if(signature(expected)!==signature(target))return response({error:'El contenido ha cambiado. Recarga y revisa de nuevo lo que vas a eliminar.'},409);
 const targetJSON=JSON.stringify(target.map(e=>({id:e.id,updated:e.updated})));
 const allContent=selected.size===6;
 let assetIds:string[]=target.flatMap(e=>[e.image_key,e.file_key]);
 if(selected.has('info'))assetIds.push(society.crest_key);
 let allAssets:{id:string;society_id:string}[]=[];
 if(deletingSociety||allContent){const a=await db.prepare('SELECT id,society_id FROM assets WHERE society_id=? AND owner=?').bind(p.society_id,owner).all<{id:string;society_id:string}>();allAssets=a.results;assetIds=allAssets.map(a=>a.id);}
 if(deletingSociety){
 const r=await db.prepare(`DELETE FROM societies WHERE id=? AND owner=? AND updated=?
 AND (SELECT count(*) FROM entries WHERE society_id=?)=json_array_length(?::json)
 AND NOT EXISTS (SELECT 1 FROM entries e WHERE e.society_id=? AND NOT EXISTS
 (SELECT 1 FROM json_array_elements(?::json) j WHERE j.value->>'id'=e.id AND j.value->>'updated'=e.updated))`).bind(p.society_id,owner,p.updated,p.society_id,targetJSON,p.society_id,targetJSON).run();
 if(!r.meta.changes)return response({error:'La sociedad o su contenido han cambiado. Recarga antes de eliminarla.'},409);
 return response({ok:true,societyDeleted:true,deleted:target.length,filesPending:await deleteObjects(allAssets.map(a=>a.society_id+'/'+a.id))});
 }
 const operations=[db.prepare(`DELETE FROM entries WHERE society_id=? AND EXISTS
 (SELECT 1 FROM json_array_elements(?::json) j WHERE j.value->>'id'=entries.id AND j.value->>'updated'=entries.updated)`).bind(p.society_id,targetJSON)];
 if(selected.has('info'))operations.push(db.prepare("UPDATE societies SET town='',description='',email='',phone='',address='',crest_key='',headline='',intro='',season='',social_url='',updated=? WHERE id=? AND owner=? AND updated=?").bind(new Date(Math.max(Date.now(),Date.parse(p.updated)+1)).toISOString(),p.society_id,owner,p.updated));
 const results=await db.batch(operations),deleted=results[0].meta.changes||0,infoCleared=selected.has('info')&&!!results[1]?.meta.changes;
 return response({ok:true,deleted,infoCleared,skipped:target.length-deleted+(selected.has('info')&&!infoCleared?1:0),...await removeUnusedAssets(owner,assetIds)});
}
