import { getDatabase, getConnectionString } from '@netlify/database';
type Result<T> = { results:T[]; meta:{changes:number} };
type Executor = {query:(sql:string,values:unknown[])=>Promise<{rows:any[];rowCount:number|null}>};
let connection:ReturnType<typeof getDatabase>|undefined;
let connectionKey:string|undefined;
function driver(){
 const key=getConnectionString();
 if(!connection||key!==connectionKey){connection=getDatabase();connectionKey=key;}
 return connection;
}
// Only application SQL is translated. All user values remain bound parameters.
export function postgresParameters(sql:string){
 let parameter=0,quoted=false,out='';
 for(let i=0;i<sql.length;i++){
  const c=sql[i];
  if(c==="'"){out+=c;if(quoted&&sql[i+1]==="'"){out+=sql[++i];continue;}quoted=!quoted;continue;}
  out+=c==='?'&&!quoted?'$'+(++parameter):c;
 }
 return out;
}
export class Statement{
 constructor(readonly sql:string,readonly values:unknown[]=[]){ }
 bind(...values:unknown[]){return new Statement(this.sql,values);}
 async execute<T=any>(executor?:Executor):Promise<Result<T>>{
  const db=driver(),query=postgresParameters(this.sql);
  if(executor){const r=await executor.query(query,this.values);return{results:r.rows,meta:{changes:r.rowCount||0}};}
  if(db.driver==='serverless'){
   const r=await db.httpClient.query(query,this.values,{fullResults:true});
   return {results:r.rows as T[],meta:{changes:r.rowCount||0}};
  }
  const r=await db.pool.query(query,this.values);return{results:r.rows as T[],meta:{changes:r.rowCount||0}};
 }
 all<T=any>(){return this.execute<T>();}
 run(){return this.execute();}
 async first<T=any>():Promise<T|null>{return(await this.execute<T>()).results[0]??null;}
}
export function database(){return{
 prepare:(sql:string)=>new Statement(sql),
 async batch(statements:Statement[]){
  const client=await driver().pool.connect();
  try{await client.query('BEGIN');const results=[];for(const s of statements)results.push(await s.execute(client as Executor));await client.query('COMMIT');return results;}
  catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 }
};}
export const publicFields='id,slug,name,region,province,town,description,email,phone,address,published,updated,crest_key,headline,intro,season,social_url';
export function unpack(e:any){return {...e,...(e.created_at?{created_at:new Date(e.created_at).toISOString()}:{}),rows:JSON.parse(e.rows||'[]'),table_data:JSON.parse(e.table_data||'{"headers":[],"rows":[]}')};}
