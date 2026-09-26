import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from '@/components/ui/table';
import type {FullTable,Rank} from '@/lib/model';
import {classificationColumnWidths} from '@/lib/classification-columns';
export function manualClassification(rows:Rank[]):FullTable{return {headers:['Posición','Colombicultor / peña','Palomo','Puntos'],rows:[...rows].sort((a,b)=>a.position-b.position).map(r=>[String(r.position),r.participant,r.pigeon,r.points.toLocaleString('es-ES',{maximumFractionDigits:8})])};}
export default function ClassificationTable({table,limit,label='Clasificación completa'}:{table:FullTable;limit?:number;label?:string}){
 const visible=limit===undefined?table.rows:table.rows.slice(0,limit);
 const widths=classificationColumnWidths(table.headers);
 return <div className="classification-table" data-density={table.headers.length>6?'dense':'regular'}><Table aria-label={label}><colgroup>{widths.map((width,i)=><col key={i} style={{width:width+'%'}}/>)}</colgroup><TableHeader><TableRow>{table.headers.map((h,i)=><TableHead scope="col" key={i}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{visible.map((row,i)=><TableRow key={i}>{table.headers.map((_,j)=><TableCell key={j}>{row[j]??''}</TableCell>)}</TableRow>)}</TableBody></Table></div>;
}
