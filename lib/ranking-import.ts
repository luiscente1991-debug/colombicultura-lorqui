import type {Rank,FullTable} from './model';
export type RankingMapping={headerRow:number;position:number;participant:number;pigeon:number;points:number;numberFormat:'es'|'en'};
export type RankingSheet={name:string;matrix:unknown[][];displayMatrix?:unknown[][]};
export type RankingPreview={rows:Rank[];table_data:FullTable;warnings:string[]};
export const normalizeHeading=(s:unknown)=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const text=(v:unknown)=>String(v??'').trim();
function number(v:unknown,format:'es'|'en'){
 if(typeof v==='number')return v;
 let s=text(v).replace(/[\s\u00a0]/g,'');if(!s)return NaN;
 if(format==='es')s=s.includes(',')?s.replace(/\./g,'').replace(',','.'):s.replace(/\.(?=\d{3}(?:\.|$))/g,'');
 else s=s.replace(/,/g,'');
 return Number(s);
}
function position(v:unknown){return number(text(v).replace(/(?:\.?\s*[ºª°]|\.\s*o)$/i,''),'en');}
function detectColumns(row:unknown[]){
 const names=row.map(normalizeHeading),find=(re:RegExp)=>names.findIndex(n=>re.test(n));
 const pos=find(/^(N|NO|NUM|NUMERO|NORDEN|NOORDEN|NUMORDEN|NUMEROORDEN|NPUESTO|NOPUESTO|POS|POSICION|PUESTO|ORDEN|CLASIF|CLASIFICACION|POSICIONFINAL)$/);
 const pigeon=find(/^(PALOMO|NOMBREPALOMO|NOMBREDELPALOMO|EJEMPLAR)/);
 let participant=find(/^(COLOMBICULTOR|PROPIETARIO|PARTICIPANTE|SOCIO|PENA|DUENO|NOMBREDELPROPIETARIO)/);
 let points=find(/^(TOTAL|TOTALPUNTOS|PUNTUACIONTOTAL|PUNTOSTOTALES|PTOTAL|PUNTOSFINAL|PUNTOSFINALES)$/);
 if(points<0)points=find(/^(PUNTOS|PUNTUACION|PTS|PTOS)$/);
 // The federation layout has eleven columns, including a total at column I.
 if(pos>=0&&pigeon===pos+1&&row.length>=pos+11){if(points<0)points=pos+8;if(participant<0)participant=pos+10;}
 return {position:pos,participant,pigeon,points};
}
export function suggestMapping(matrix:unknown[][]):RankingMapping{
 let headerRow=0,best=-1;
 matrix.slice(0,200).forEach((row,i)=>{const m=detectColumns(row),score=(m.points>=0?5:0)+(m.position>=0?2:0)+(m.pigeon>=0?3:0)+(m.participant>=0?3:0);if(score>best){best=score;headerRow=i;}});
 return {headerRow,...detectColumns(matrix[headerRow]||[]),numberFormat:'es'};
}
export function parseRanking(matrix:unknown[][],mapping?:RankingMapping,displayMatrix?:unknown[][]):RankingPreview{
 if(matrix.some(r=>r[0]==='__TRUNCATED__'))throw new Error('La hoja contiene demasiadas filas. Guarda una copia con un máximo de 1.000 clasificados.');
 const m=mapping||suggestMapping(matrix);
 if(!matrix.length||!matrix[m.headerRow])throw new Error('La hoja está vacía. Selecciona otra hoja del archivo.');
 if(m.points<0||m.participant<0&&m.pigeon<0)throw new Error('No se han reconocido las columnas. Selecciona la fila de encabezados, los puntos y el propietario o palomo en «Ajustar hoja y columnas».');
 const header=matrix[m.headerRow];
 const isContestTemplate=['NO','PALOMO','PRUEBA1','PRUEBA2','PRUEBA3','PRUEBA4','PRUEBA5','PRUEBA6','TOTAL','PLUMA','PROPIETARIO'].every((h,i)=>normalizeHeading(header[i])===h);
 const rows:Rank[]=[],sourceRows:unknown[][]=[];let missingOwner=0,ignored=0;
 // Keep every row of the supplied classification grid, including unused template slots.
 if(isContestTemplate&&matrix.length-m.headerRow-1>1000)throw new Error('Se admiten como máximo 1.000 filas por clasificación.');
 for(let i=m.headerRow+1;i<matrix.length;i++){
 const r=matrix[i];if(!r||!r.some(v=>text(v)))continue;
 const participant=m.participant<0?'':text(r[m.participant]),pigeon=m.pigeon<0?'':text(r[m.pigeon]);
 const rank=m.position<0?rows.length+1:position(r[m.position]);
 if(!participant&&!pigeon){ignored++;continue;}
 // Repeated headers and notes are not competitors. Never silently discard a numbered competitor.
 if(m.position>=0&&(!Number.isInteger(rank)||rank<1)){
  if(!text(r[m.position])||/^(N|NO|NUMERO|POSICION|PUESTO)/.test(normalizeHeading(r[m.position]))){ignored++;continue;}
  throw new Error('La posición de la fila '+(i+1)+' no es válida. Revisa la columna elegida.');
 }
 const score=number(r[m.points],m.numberFormat);
 if(!Number.isFinite(score)||score<0)throw new Error('Los puntos de la fila '+(i+1)+' no son válidos. Revisa la columna y el formato de números. Si contiene fórmulas, recalcula y guarda el archivo en Excel antes de subirlo.');
 if(rank>100000||score>100000000)throw new Error('La posición o los puntos de la fila '+(i+1)+' superan el límite admitido.');
 if(participant.length>180||pigeon.length>180)throw new Error('El nombre de la fila '+(i+1)+' es demasiado largo. Revisa las columnas seleccionadas.');
 if(!participant)missingOwner++;
 rows.push({position:rank,participant:participant||'—',pigeon,points:score});sourceRows.push(displayMatrix?.[i]||r);
 if(rows.length>1000)throw new Error('Se admiten como máximo 1.000 participantes por clasificación.');
 }
 if(!rows.length&&!isContestTemplate)throw new Error('No se han encontrado clasificados. Comprueba la hoja, la fila de encabezados y las columnas elegidas.');
 if(isContestTemplate){sourceRows.splice(0,sourceRows.length,...(displayMatrix||matrix).slice(m.headerRow+1));}
 const width=isContestTemplate?11:Math.max(header.length,...sourceRows.map(r=>r.length));
 const columns=Array.from({length:width},(_,i)=>i).filter(i=>text(header[i])||sourceRows.some(r=>text(r[i])));
 if(columns.length>30)throw new Error('La clasificación contiene más de 30 columnas con datos. Utiliza una hoja que contenga únicamente la clasificación.');
 const headers=columns.map(i=>text(header[i])||'Columna '+(i+1)),tableRows=sourceRows.map(r=>columns.map(i=>text(r[i])));
 if(headers.some(h=>h.length>200)||tableRows.some(r=>r.some(c=>c.length>500)))throw new Error('Una celda es demasiado larga. Revisa la hoja seleccionada.');
 const warnings:string[]=[];
 if(isContestTemplate&&!rows.length)warnings.push('Plantilla sin resultados: se conservarán las 11 columnas y las '+sourceRows.length+' filas. Completa ENTRADA DATOS y guarda el Excel para que CLASIFICACION muestre los resultados.');
 if(m.position<0)warnings.push('Las posiciones se asignan según el orden de las filas.');
 if(missingOwner)warnings.push(missingOwner+' '+(missingOwner===1?'palomo sin propietario indicado.':'palomos sin propietario indicado.'));
 if(ignored&&!isContestTemplate)warnings.push('Se han omitido '+ignored+' filas sin clasificados o con encabezados repetidos.');
 return {rows,table_data:{headers,rows:tableRows},warnings};
}
async function excelReader(){
 try{const [XLSX,cptable]=await Promise.all([import('./vendor/xlsx.mjs'),import('./vendor/cpexcel.full.mjs')]);XLSX.set_cptable(cptable);return XLSX;}
 catch{throw new Error('No se pudo cargar el lector de Excel. Recarga la página y vuelve a seleccionar el archivo.');}
}
export function workbookSheets(XLSX:any,workbook:any):RankingSheet[]{
 const sheets:RankingSheet[]=[];
 for(const name of workbook.SheetNames){
 const sheet=workbook.Sheets[name];if(!sheet)continue;
 let minRow=Infinity,maxRow=-1,minCol=Infinity,maxCol=-1;
 // Ignore Excel's formatted but empty rows/columns, which can extend to XFD.
 for(const address of Object.keys(sheet)){
 if(address.startsWith('!')||!text(sheet[address]?.v)&&!sheet[address]?.f)continue;
 const cell=XLSX.utils.decode_cell(address);minRow=Math.min(minRow,cell.r);maxRow=Math.max(maxRow,cell.r);minCol=Math.min(minCol,cell.c);maxCol=Math.max(maxCol,cell.c);
 }
 if(maxRow<0)continue;
 if(maxCol-minCol>255)continue;
 const truncated=maxRow>=1200;
 const options={header:1,defval:'',blankrows:true,range:{s:{r:0,c:0},e:{r:Math.min(maxRow,1199),c:maxCol}}};
 const matrix=XLSX.utils.sheet_to_json(sheet,{...options,raw:true}) as unknown[][];
 const displayMatrix=XLSX.utils.sheet_to_json(sheet,{...options,raw:false}) as unknown[][];
 // Keep a sentinel so a bounded reader cannot silently publish an incomplete file.
 if(truncated)matrix.push(['__TRUNCATED__']);
 sheets.push({name,matrix,displayMatrix});
 }
 if(!sheets.length)throw new Error('No se encontraron hojas con datos. Comprueba que el archivo sea un Excel válido y no esté protegido con contraseña.');
 const classification=sheets.find(s=>normalizeHeading(s.name)==='CLASIFICACION');
 const input=sheets.find(s=>normalizeHeading(s.name)==='ENTRADADATOS');
 if(classification&&input){
  const m=suggestMapping(classification.matrix),hasResults=classification.matrix.slice(m.headerRow+1).some(r=>text(r[1])&&text(r[8]));
  const hasInput=input.matrix.slice(suggestMapping(input.matrix).headerRow+1).some(r=>text(r[1])&&r.slice(2,8).some(v=>typeof v==='number'));
  if(hasInput&&!hasResults)throw new Error('ENTRADA DATOS contiene puntuaciones, pero CLASIFICACION todavía está vacía. Abre el archivo en Excel, recalcula las fórmulas y guarda antes de subirlo.');
 }
 return sheets;
}
export function preferredSheet(sheets:RankingSheet[]){
 const named=sheets.find(s=>/^CLASIFICACION(?:ES)?$/.test(normalizeHeading(s.name)));
 if(named)return named.name;
 return sheets.find(s=>{const m=suggestMapping(s.matrix);return m.points>=0&&(m.participant>=0||m.pigeon>=0);})?.name||sheets[0].name;
}
export async function readRankingWorkbook(file:File):Promise<RankingSheet[]>{
 if(!file.size||file.size>8*1024*1024)throw new Error('El archivo debe tener contenido y ocupar como máximo 8 MB.');
 const XLSX=await excelReader();let workbook;
 try{workbook=XLSX.read(await file.arrayBuffer(),{type:'array',cellFormula:true,cellHTML:false,cellText:true,raw:true,bookVBA:false});}
 catch{throw new Error('No se ha podido leer este archivo. Si está protegido, guarda una copia sin contraseña. Puedes usar XLSX, XLS, XLSM, XLSB o CSV.');}
 return workbookSheets(XLSX,workbook);
}
export async function readRanking(file:File){const sheets=await readRankingWorkbook(file);const s=sheets.find(s=>s.name===preferredSheet(sheets))!;return parseRanking(s.matrix,undefined,s.displayMatrix);}
