import {notFound} from 'next/navigation';
import {database,publicFields,unpack} from '@/lib/store';
import {getSocietyManager} from '@/lib/site-auth';
import Shell from '@/components/site-shell';
import ClassificationTable,{manualClassification} from '@/components/classification-table';
import {displayDate,mediaUrl,competitionLabel,type Entry} from '@/lib/model';
export const dynamic='force-dynamic';
export const metadata={title:'Clasificación completa · ClasiColombicultura'};
export default async function Page({params}:{params:Promise<{slug:string;id:string}>}){
 const {slug,id}=await params;let society:any,entry:Entry|undefined,owner=false,failed=false;
 try{
 const user=await getSocietyManager(),db=database();society=await db.prepare('SELECT '+publicFields+',owner FROM societies WHERE slug=?').bind(slug).first<any>();
 if(society){owner=!!user&&society.owner===user.userId;if(society.published||owner){const row=await db.prepare("SELECT * FROM entries WHERE id=? AND society_id=? AND kind='result'"+(owner?'':' AND published=1')).bind(id,society.id).first();if(row)entry=unpack(row);}delete society.owner;}
 }catch(e){console.error('full classification',e);failed=true;}
 if(failed)return <Shell><section className="page-head"><h1>No se pudo cargar la clasificación.</h1><p>Vuelve a intentarlo en unos instantes.</p><a className="button" href={'/sociedad/'+encodeURIComponent(slug)+'/clasificacion/'+encodeURIComponent(id)}>Reintentar</a></section></Shell>;
 if(!society||!entry)notFound();
 const back='/sociedad/'+encodeURIComponent(slug)+'#clasificaciones',table=entry.table_data.headers.length?entry.table_data:manualClassification(entry.rows);
 return <Shell canManage={owner}>{owner&&<div className="preview-notice owner-toolbar"><span>{!society.published||!entry.published?'Vista previa · Clasificación en borrador':'Vista de administrador'}</span><a href={'/admin?society='+society.id+'&tab=result'}>Editar clasificaciones ↗</a></div>}<section className="page-head full-classification-head"><div className="breadcrumb"><a href={back}>{society.name}</a> / Clasificaciones</div><span className="eyebrow">CLASIFICACIÓN COMPLETA{entry.season?' · TEMPORADA '+entry.season:''}</span><h1>{entry.title}</h1><p>{displayDate(entry.date)} · {competitionLabel(entry.category)} · {entry.rows.length} clasificados{entry.table_data.headers.length?' · '+table.rows.length+' filas':''}</p>{entry.location&&<p><strong>Localidad:</strong> {entry.location}</p>}{entry.body&&<p className="preserve-lines">{entry.body}</p>}<a className="textlink" href={back}>← Volver a las clasificaciones</a></section><section className="complete-classification"><div className="ranking">{table.rows.length?<><p className="table-scroll-help">Todas las columnas se ajustan al ancho de la pantalla.</p>{!entry.rows.length&&<p className="table-empty-notice">Plantilla pendiente de resultados.</p>}<ClassificationTable table={table}/></>:<div className="ranking-heading"><p>Todavía no hay resultados en tabla.</p>{entry.file_key&&<a className="textlink" href={mediaUrl(entry.file_key)}>Consultar documento adjunto</a>}</div>}</div><a className="outline-button" href={back}>Volver a las clasificaciones</a></section></Shell>;
}
