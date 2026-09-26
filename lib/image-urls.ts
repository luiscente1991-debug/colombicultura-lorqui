// Originals remain at /api/media. Only published raster images use the CDN.
export type ImageVariant = 'detail' | 'crest' | 'summary' | 'gallery';
const widths = {detail:[800,1200,1600,2400],crest:[160,320,480],summary:[240,480,800],gallery:[480,800,1200]};
const sizes = {
 detail:'(max-width: 700px) calc(100vw - 44px), (max-width: 1200px) calc(100vw - 100px), 1100px',
 crest:'150px',
 summary:'(max-width: 700px) 105px, 145px',
 gallery:'(max-width: 400px) calc(100vw - 44px), (max-width: 1050px) 45vw, 380px',
};
export function optimizedImageUrl(key:string,width:number,quality=85){
 return '/.netlify/images?url='+encodeURIComponent('/api/public-images/'+encodeURIComponent(key))+'&w='+width+'&q='+quality+'&fm=webp';
}
export function imageProps(key:string,variant:ImageVariant='detail',published=true){
 const original='/api/media/'+encodeURIComponent(key);
 if(!published)return {src:original};
 const quality=variant==='detail'?90:85;
 const candidates=widths[variant];
 return {src:optimizedImageUrl(key,candidates[1],quality),srcSet:candidates.map(w=>optimizedImageUrl(key,w,quality)+' '+w+'w').join(', '),sizes:sizes[variant]};
}
