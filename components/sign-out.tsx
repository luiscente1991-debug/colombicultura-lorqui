'use client';
import {useState} from 'react';
import {endAdminSession} from '@/lib/sign-out';
export default function SignOut(){
 const[busy,setBusy]=useState(false);
 return <button className="session-sign-out" disabled={busy} onClick={async()=>{if(busy)return;setBusy(true);await endAdminSession();}}>{busy?'Cerrando sesión…':'Cerrar sesión'}</button>;
}
