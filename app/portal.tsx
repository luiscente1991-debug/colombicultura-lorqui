'use client';
import { useEffect } from 'react';
import shell from './portal-shell.json';
import AdminSessionBar from '@/components/admin-session-bar';
export default function Portal({canManage=false}:{canManage?:boolean}){
 useEffect(()=>{if(document.getElementById('portal-symbols'))return;const s=document.createElement('script');s.id='portal-symbols';s.src='/symbols.js';s.onload=()=>{const a=document.createElement('script');a.src='/portal.js';document.body.appendChild(a);};document.body.appendChild(s);},[]);
 return <>{canManage&&<AdminSessionBar/>}<div dangerouslySetInnerHTML={{__html:shell}}/></>;
}
