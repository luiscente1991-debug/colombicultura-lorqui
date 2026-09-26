import { notFound } from 'next/navigation';
import { database,publicFields,unpack } from '@/lib/store';
import { getSocietyManager } from '@/lib/site-auth';
import SocietyPage from './view';
import type { Society,Entry } from '@/lib/model';
export const dynamic='force-dynamic';
const demo={id:'demo',slug:'plantilla',name:'Nombre de tu sociedad',region:'murcia',province:'Murcia',town:'Tu localidad',description:'Aquí podrás contar la historia de la sociedad, presentar su actividad y publicar la información que quieras compartir con los aficionados.',email:'',phone:'',address:'',published:0,updated:'',crest_key:'',headline:'',intro:'',season:'',social_url:''};
export default async function Page({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;if(slug==='plantilla')return <SocietyPage society={demo} entries={[]} demo owner={!!(await getSocietyManager())}/>;
 let society:any,items:Entry[]=[],owner=false,failed=false;
 try{const db=database(),user=await getSocietyManager();society=await db.prepare('SELECT '+publicFields+',owner FROM societies WHERE slug=?').bind(slug).first<any>();if(society){owner=!!user&&society.owner===user.userId;if(!society.published&&!owner)society=null;else{const result=await db.prepare('SELECT * FROM entries WHERE society_id=?'+(owner?'':' AND published=1')+' ORDER BY date DESC,updated DESC').bind(society.id).all();items=result.results.map(unpack) as Entry[];delete society.owner;}}}catch(e){console.error('society page',e);failed=true;}
 if(failed)return <div className="section"><h1>No se pudo cargar la sociedad.</h1><p>Vuelve a intentarlo en unos instantes.</p><a className="button" href={'/sociedad/'+encodeURIComponent(slug)}>Reintentar</a></div>;
 if(!society)notFound();return <SocietyPage society={society as Society} entries={items} owner={owner}/>;
}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const{slug}=await params;if(slug==='plantilla')return{title:'Plantilla de sociedad · ClasiColombicultura'};try{const s=await database().prepare('SELECT name FROM societies WHERE slug=? AND published=1').bind(slug).first<any>();return{title:s?s.name+' · ClasiColombicultura':'Sociedad · ClasiColombicultura'};}catch{return{title:'Sociedad · ClasiColombicultura'};}}
