import type {Entry,Rank} from './model';
export function normalizeSeason(value:string){return value.trim().replace(/^(\d{4})\s*[\/\\–—-]\s*(\d{4})$/, '$1/$2');}
export function entrySeason(entry:Entry,defaultSeason:string){return normalizeSeason(entry.season||defaultSeason||entry.date.slice(0,4));}
export function seasonSummary(entries:Entry[],defaultSeason:string,selected='all'){
 const groups=new Map<string,Entry[]>();
 for(const entry of entries){
 if(entry.kind!=='result')continue;
 const season=entrySeason(entry,defaultSeason);if(selected!=='all'&&season!==selected)continue;
 const group=groups.get(season)||[];group.push(entry);groups.set(season,group);
 }
 return [...groups].sort(([a],[b])=>b.localeCompare(a,'es',{numeric:true})).map(([season,contests])=>({season,contests:contests.sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'es'))}));
}
export function podiumRows(rows:Rank[]){return [1,2,3].map(position=>({position,winners:rows.filter(r=>r.position===position)}));}
export function podiumContests(entries:Entry[],defaultSeason:string,selected='all'){
 const added=(entry:Entry)=>Date.parse(entry.created_at||entry.updated||entry.date)||0;
 return entries.filter(e=>e.kind==='result'&&(selected==='all'||entrySeason(e,defaultSeason)===selected))
  .sort((a,b)=>added(a)-added(b)||a.id.localeCompare(b.id));
}
