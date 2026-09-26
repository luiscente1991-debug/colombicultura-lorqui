'use client';
import {useMemo,useState} from 'react';
import {Collapsible,CollapsibleTrigger,CollapsibleContent} from '@/components/ui/collapsible';
import {readRankingWorkbook,parseRanking,suggestMapping,preferredSheet,type RankingSheet,type RankingMapping,type RankingPreview} from '@/lib/ranking-import';
import {Choice,uploadAsset} from './fields';
import ClassificationTable from '@/components/classification-table';
type Imported={rows:RankingPreview['rows'];table_data:RankingPreview['table_data'];file_key:string};
const columnName=(i:number)=>i<26?String.fromCharCode(65+i):String.fromCharCode(64+Math.floor(i/26))+String.fromCharCode(65+i%26);
export default function RankingImporter({society,onImported,onBusy,onPending}:{society:string;onImported:(data:Imported,name:string)=>void;onBusy:(busy:boolean)=>void;onPending:(pending:boolean)=>void}){
 const [file,setFile]=useState<File>(),[sheets,setSheets]=useState<RankingSheet[]>([]),[sheetName,setSheetName]=useState(''),[mapping,setMapping]=useState<RankingMapping>(),[error,setError]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[applied,setApplied]=useState(false),[uploaded,setUploaded]=useState<{id:string;name:string}>();
 const sheet=sheets.find(s=>s.name===sheetName);
 const preview=useMemo(()=>{if(!sheet||!mapping)return {data:null,error:''};try{return {data:parseRanking(sheet.matrix,mapping,sheet.displayMatrix),error:''};}catch(e){return {data:null,error:(e as Error).message};}},[sheet,mapping]);
 function waiting(value:boolean,message=''){setBusy(value);onBusy(value);setStatus(message);}
 function clear(){setFile(undefined);setSheets([]);setMapping(undefined);setError('');setUploaded(undefined);setApplied(false);onPending(false);}
 function adjust(next:RankingMapping,name=sheetName){setSheetName(name);setMapping(next);setApplied(false);onPending(true);setError('');setStatus('Revisa la vista previa y pulsa «Aplicar ajustes».');}
 async function importPreview(source:File,data:RankingPreview,existing?:{id:string;name:string}){
  waiting(true,'Cargando '+source.name+'…');
  const asset=existing||await uploadAsset(source,society,'attachment');
  setUploaded(asset);onImported({rows:data.rows,table_data:data.table_data,file_key:asset.id},asset.name);
  setApplied(true);onPending(false);
  setStatus(data.rows.length?'Excel cargado. Ya puedes guardar la clasificación.':'Plantilla cargada sin resultados. Ya puedes guardar la clasificación.');
 }
 async function select(file?:File){if(!file)return;setError('');setSheets([]);setMapping(undefined);setUploaded(undefined);setApplied(false);setStatus('');setFile(file);onPending(true);
 if(!/\.(xlsx|xls|xlsm|xlsb|csv|pdf)$/i.test(file.name)){setError('Selecciona un archivo XLSX, XLS, XLSM, XLSB, CSV o PDF.');return;}
 if(!file.size||file.size>8*1024*1024){setError('El archivo debe tener contenido y ocupar como máximo 8 MB.');return;}
 waiting(true,'Leyendo '+file.name+'…');
 try{
 if(/\.pdf$/i.test(file.name)){const asset=await uploadAsset(file,society,'attachment');onImported({rows:[],table_data:{headers:[],rows:[]},file_key:asset.id},asset.name);clear();setStatus('PDF adjuntado. Guarda el concurso para aplicar el cambio.');}
 else{
  const available=await readRankingWorkbook(file),name=preferredSheet(available),chosen=available.find(s=>s.name===name)!,detected=suggestMapping(chosen.matrix);
  setSheets(available);setSheetName(name);setMapping(detected);
  let parsed:RankingPreview;
  try{parsed=parseRanking(chosen.matrix,detected,chosen.displayMatrix);}catch{setStatus('Selecciona la hoja y las columnas para completar la importación.');return;}
  await importPreview(file,parsed);
 }
 }catch(e){setError((e as Error).message);setStatus('');}finally{setBusy(false);onBusy(false);}
 }
 async function apply(){if(!file||!preview.data)return;setError('');try{await importPreview(file,preview.data,uploaded);}catch(e){setError((e as Error).message);setStatus('');}finally{setBusy(false);onBusy(false);}}
 const columns=sheet&&mapping?Array.from({length:Math.max(sheet.matrix[mapping.headerRow]?.length||0,...sheet.matrix.slice(mapping.headerRow+1,mapping.headerRow+6).map(r=>r.length))},(_,i)=>({value:String(i),label:columnName(i)+' · '+String(sheet.matrix[mapping.headerRow]?.[i]||'Sin título').slice(0,70)})):[];
 return <div className="import-box"><label className="form-field">Cargar Excel del concurso o adjuntar PDF<input type="file" accept=".xlsx,.xls,.xlsm,.xlsb,.csv,.pdf" disabled={busy} onChange={e=>{select(e.target.files?.[0]);e.target.value='';}}/></label><p className="form-help">XLSX, XLS, XLSM, XLSB o CSV: se leen los resultados sin ejecutar macros. Máximo 1.000 clasificados y 8 MB. Un PDF se ofrece para descargar.</p>
 {status&&<p className="import-status" role="status">{status}</p>}{error&&<p className="error-box" role="alert">{error}</p>}
 {file&&<div className="file-selected"><strong>{file.name}</strong>{!applied&&<button className="quiet-button" type="button" disabled={busy} onClick={()=>{clear();setStatus('');}}>Cancelar importación</button>}</div>}
 {sheet&&mapping&&<><Collapsible defaultOpen={!!preview.error} key={file?.name+'-'+sheets.length}><CollapsibleTrigger type="button" className="outline-button">Ajustar hoja y columnas</CollapsibleTrigger><CollapsibleContent className="import-mapping"><div className="form-grid"><Choice id="ranking-sheet" label="Hoja del Excel" value={sheetName} items={sheets.map(s=>({value:s.name,label:s.name}))} onChange={name=>adjust(suggestMapping(sheets.find(s=>s.name===name)!.matrix),name)}/><label className="form-field">Fila de encabezados<input type="number" min="1" max={sheet.matrix.length} value={mapping.headerRow+1} onChange={e=>{const row=Number(e.target.value)-1;if(row>=0&&row<sheet.matrix.length){const detected=suggestMapping([sheet.matrix[row]]);adjust({...detected,headerRow:row,numberFormat:mapping.numberFormat});}}}/></label>
 {(['position','pigeon','participant','points'] as const).map(key=><Choice key={key} id={'column-'+key} label={{position:'Posición',pigeon:'Palomo',participant:'Propietario / colombicultor',points:'Puntos totales'}[key]} value={String(mapping[key])} items={[{value:'-1',label:key==='position'?'Usar orden de las filas':key==='points'?'Selecciona la columna de puntos':'No hay esta columna'},...columns]} onChange={value=>adjust({...mapping,[key]:Number(value)})}/>)}<Choice id="ranking-number-format" label="Formato de números escritos como texto" value={mapping.numberFormat} onChange={v=>adjust({...mapping,numberFormat:v as 'es'|'en'})} items={[{value:'es',label:'Español: 1.234,56'},{value:'en',label:'Inglés: 1,234.56'}]}/></div></CollapsibleContent></Collapsible>
 {preview.error?<p className="error-box" role="alert">{preview.error}</p>:preview.data&&<div className="import-confirm">{preview.data.warnings.map(w=><p className="form-help" key={w}>{w}</p>)}{!applied&&<><button type="button" className="button" disabled={busy} onClick={apply}>{uploaded?'Aplicar ajustes':'Cargar esta clasificación'}</button><p><strong>{preview.data.rows.length} clasificados</strong> · {preview.data.table_data.headers.length} columnas · {preview.data.table_data.rows.length} filas · Hoja «{sheetName}»</p><ClassificationTable table={preview.data.table_data} limit={5} label="Vista previa de la clasificación"/></>}</div>}</>}
 </div>;
}
