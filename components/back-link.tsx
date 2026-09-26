'use client';

import type {MouseEvent} from 'react';

export default function BackLink({href}:{href:string}) {
 function goBack(event:MouseEvent<HTMLAnchorElement>) {
  // Keep normal link behavior for new tabs and when there is no internal visit.
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  try {
   const previous=new URL(document.referrer);
   if(previous.origin===window.location.origin&&previous.pathname!==window.location.pathname&&window.history.length>1) {
    event.preventDefault();
    window.history.back();
   }
  } catch { /* Direct visits use the community/province link. */ }
 }
 return <a className="back-link" href={href} onClick={goBack}><span aria-hidden="true">←</span> Volver atrás</a>;
}
