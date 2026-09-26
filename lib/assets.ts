import {database} from './store';
export {bucket} from './object-storage';
export async function validAsset(id:string,society:string,owner:string,kind:string){if(!id)return true;return !!await database().prepare('SELECT id FROM assets WHERE id=? AND society_id=? AND owner=? AND kind=?').bind(id,society,owner,kind).first();}
export function fileType(bytes:Uint8Array,name:string,kind:string){
 const starts=(a:number[])=>a.every((x,i)=>bytes[i]===x),text=new TextDecoder().decode(bytes.slice(0,12));
 if(kind==='image'){
 if(starts([137,80,78,71,13,10,26,10]))return 'image/png';
 if(starts([255,216,255]))return 'image/jpeg';
 if(text.startsWith('RIFF')&&text.slice(8)==='WEBP')return 'image/webp';
 if(text.startsWith('GIF87a')||text.startsWith('GIF89a'))return 'image/gif';
 }else{
 if(/\.pdf$/i.test(name)&&text.startsWith('%PDF-'))return 'application/pdf';
 if(/\.(xlsx|xlsm|xlsb)$/i.test(name)&&starts([80,75,3,4]))return /\.xlsm$/i.test(name)?'application/vnd.ms-excel.sheet.macroEnabled.12':/\.xlsb$/i.test(name)?'application/vnd.ms-excel.sheet.binary.macroEnabled.12':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
 if(/\.xls$/i.test(name)&&starts([208,207,17,224,161,177,26,225]))return 'application/vnd.ms-excel';
 if(/\.csv$/i.test(name)&&!bytes.includes(0))return 'text/csv; charset=utf-8';
 }return null;
}
