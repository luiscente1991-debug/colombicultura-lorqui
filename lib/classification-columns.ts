/** Give names more room while keeping every Excel column within the table. */
export function classificationColumnWidths(headers:string[]):number[]{
 const weights=headers.map(header=>{
  const key=header.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  if(/propietario|colombicultor|participante|peña|pena/.test(key))return 2.8;
  if(/palomo|nombre/.test(key))return 2.4;
  if(/pluma/.test(key))return 1.4;
  if(/^(n[º°o.]?|numero|pos\.?|posicion|puesto)$/.test(key))return .7;
  return 1;
 });
 const total=weights.reduce((sum,weight)=>sum+weight,0);
 return weights.map(weight=>weight/total*100);
}
