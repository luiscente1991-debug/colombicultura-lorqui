'use client';
import {useState} from 'react';
import {regions,type Society} from '@/lib/model';
import {Checkbox} from '@/components/ui/checkbox';
import {Choice,ImageField,mutate} from './fields';
const fresh=()=>({name:'',region:'murcia',province:'Murcia',town:'',description:'',email:'',phone:'',address:'',published:0,crest_key:'',headline:'',intro:'',season:'',social_url:''});
export default function SocietyForm({initial,compact=false,onSaved}:{initial?:Society;compact?:boolean;onSaved:(data:any)=>Promise<void>}){
 const [data,setData]=useState(initial||fresh()),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState('');
 const update=(key:string,value:any)=>setData(d=>({...d,[key]:value}));
 async function submit(e:React.FormEvent){e.preventDefault();if(uploading)return;setBusy(true);setError('');try{const r=await mutate({action:'save-society',id:initial?.id,updated:initial?.updated,data});await onSaved(r);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <form onSubmit={submit} className="editor-form"><fieldset disabled={busy}><div className="form-grid"><label className="form-field wide">Nombre de la sociedad *<input value={data.name} onChange={e=>update('name',e.target.value)} required minLength={2} maxLength={180}/></label>
 <Choice id={compact?'new-region':'edit-region'} label="Comunidad *" value={data.region} items={regions.map(r=>({value:r.id,label:r.name}))} onChange={v=>setData(d=>({...d,region:v,province:regions.find(r=>r.id===v)!.provinces[0]}))}/>
 <Choice id={compact?'new-province':'edit-province'} label="Provincia *" value={data.province} items={regions.find(r=>r.id===data.region)!.provinces.map(p=>({value:p,label:p}))} onChange={v=>update('province',v)}/>
 <label className="form-field wide">Pueblo<input value={data.town} onChange={e=>update('town',e.target.value)} maxLength={120}/></label>
 {!compact&&<><div className="wide"><ImageField crest label="Escudo de la sociedad" value={data.crest_key} society={initial!.id} onChange={v=>update('crest_key',v)} onBusy={setUploading}/></div>
 <label className="form-field">Temporada<input value={data.season} onChange={e=>update('season',e.target.value)} maxLength={50} placeholder="Ej. 2026–2027"/></label><label className="form-field wide">Titular de bienvenida<input value={data.headline} onChange={e=>update('headline',e.target.value)} maxLength={200} placeholder="Nuestra afición, nuestra sociedad."/></label>
 <label className="form-field wide">Presentación breve<textarea value={data.intro} onChange={e=>update('intro',e.target.value)} maxLength={1000} rows={3}/></label>
 <label className="form-field wide">Historia e información de la sociedad<textarea value={data.description} onChange={e=>update('description',e.target.value)} maxLength={15000} rows={7}/></label>
 <label className="form-field">Correo público<input type="email" value={data.email} onChange={e=>update('email',e.target.value)} maxLength={254}/></label><label className="form-field">Teléfono público<input type="tel" value={data.phone} onChange={e=>update('phone',e.target.value)} maxLength={40}/></label><label className="form-field wide">Dirección<input value={data.address} onChange={e=>update('address',e.target.value)} maxLength={250}/></label><label className="form-field wide">Enlace a redes sociales<input type="url" value={data.social_url} onChange={e=>update('social_url',e.target.value)} maxLength={500} placeholder="https://..."/></label></>}</div>
 {!compact&&<div className="publication"><label className="check-line"><Checkbox checked={!!data.published} onCheckedChange={v=>update('published',v===true?1:0)}/> Publicar esta sociedad y mostrarla en el directorio</label><p>Sin marcar, solo tú podrás abrir su página como vista previa. Se conserva todo su contenido.</p></div>}
 {error&&<div className="error-box" role="alert">{error}</div>}<button className="button" disabled={busy||uploading} type="submit">{busy?'Guardando…':uploading?'Subiendo imagen…':compact?'Crear y abrir sociedad':'Guardar información'}</button></fieldset></form>;
}
