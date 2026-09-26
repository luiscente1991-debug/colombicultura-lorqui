'use client';
import {useState} from 'react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {mediaUrl} from '@/lib/model';
export function Choice({id,label,value,onChange,items}:{id:string;label:string;value:string;onChange:(v:string)=>void;items:{value:string;label:string}[]}){return <div className="form-field"><label htmlFor={id}>{label}</label><Select value={value} onValueChange={onChange}><SelectTrigger id={id} className="choice"><SelectValue placeholder="Selecciona una opción"/></SelectTrigger><SelectContent>{items.map(i=><SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent></Select></div>}
export async function mutate(payload:any){const r=await fetch('/api/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data:any=await r.json();if(!r.ok)throw new Error(data.error||'No se pudo guardar.');return data;}
export async function uploadAsset(file:File,society:string,kind:'image'|'attachment'){
 async function read(response:Response){const data=await response.json().catch(()=>({error:'No se pudo subir el archivo. Vuelve a intentarlo.'}));if(!response.ok)throw new Error(data.error||'No se pudo subir el archivo.');return data;}
 if(file.size>3*1024*1024){
  const session=await read(await fetch('/api/uploads?action=start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({society_id:society,name:file.name,kind,size:file.size})}));
  try{
   for(let start=0,part=0;start<file.size;start+=session.chunkSize,part++)await read(await fetch('/api/uploads?action=chunk&id='+encodeURIComponent(session.id)+'&index='+part,{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:file.slice(start,start+session.chunkSize)}));
   return await read(await fetch('/api/uploads?action=finish&id='+encodeURIComponent(session.id),{method:'POST'})) as {id:string;name:string};
  }catch(e){await fetch('/api/uploads?action=cancel&id='+encodeURIComponent(session.id),{method:'POST'}).catch(()=>{});throw e;}
 }
 const form=new FormData();form.set('file',file);form.set('society_id',society);form.set('kind',kind);return await read(await fetch('/api/assets',{method:'POST',body:form})) as {id:string;name:string};
}
export function ImageField({label,value,society,onChange,onBusy,crest=false}:{label:string;value:string;society:string;onChange:(v:string)=>void;onBusy:(v:boolean)=>void;crest?:boolean}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function upload(file?:File){if(!file)return;setError('');if(file.size>5*1024*1024){setError('La imagen debe ocupar como máximo 5 MB.');return;}setBusy(true);onBusy(true);try{const a=await uploadAsset(file,society,'image');onChange(a.id);}catch(e){setError((e as Error).message);}finally{setBusy(false);onBusy(false);}}
 return <div className={'image-field'+(crest?' crest-field':'')}><label className="form-field">{label}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={busy} onChange={e=>{upload(e.target.files?.[0]);e.target.value='';}}/></label><p className="form-help">PNG, JPG, WebP o GIF. Máximo 5 MB. Guarda los cambios para aplicar la imagen.</p>{busy&&<p role="status">Subiendo imagen…</p>}{error&&<p className="error-box" role="alert">{error}</p>}{value&&<div className="image-preview"><img src={mediaUrl(value)} alt={label}/><button className="quiet-button" type="button" disabled={busy} onClick={()=>onChange('')}>Quitar imagen</button></div>}</div>;
}
