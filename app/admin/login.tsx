'use client';
import {useEffect,useState} from 'react';
import {login,signup,logout,getSettings,handleAuthCallback,acceptInvite,requestPasswordRecovery,updateUser} from '@netlify/identity';
export default function Login(){
 const[mode,setMode]=useState<'login'|'signup'|'recovery'|'password'>('login');
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[invite,setInvite]=useState('');
 const[signupAllowed,setSignupAllowed]=useState(false);
 useEffect(()=>{let active=true;(async()=>{
  try{
   const result=await handleAuthCallback();if(!active)return;
   if(result?.type==='invite'){setInvite(result.token||'');setMode('password');}
   else if(result?.type==='recovery'){setMode('password');}
   else if(result){location.replace('/admin');return;}
   const settings=await getSettings();if(active)setSignupAllowed(!settings.disableSignup);
  }catch{if(active)setError('El acceso todavía no está disponible. Vuelve a intentarlo en unos minutos.');}
 })();return()=>{active=false;};},[]);
 async function submit(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError('');setMessage('');
  try{
   if(mode==='password'){
    if(password!==confirm)throw new Error('Las contraseñas no coinciden.');
    if(invite)await acceptInvite(invite,password);else await updateUser({password});
    location.replace('/admin');return;
   }
   if(mode==='recovery'){await requestPasswordRecovery(email);setMessage('Si la cuenta existe, recibirás un enlace para recuperar el acceso.');return;}
   if(mode==='signup'){
    const user=await signup(email,password);if(!user.confirmedAt){setMessage('Revisa tu correo y confirma la dirección para activar tu acceso.');return;}
   }else await login(email,password);
   const check=await fetch('/api/data?manage=1',{cache:'no-store'});
   if(!check.ok){await logout();throw new Error('Esta cuenta no tiene permisos de administrador.');}
   location.replace('/admin');
  }catch(e){setError((e as Error).message||'No se pudo iniciar sesión.');}finally{setBusy(false);}
 }
 return <section className="page-head"><span className="eyebrow">ACCESO PRIVADO</span><h1>Administración.</h1><p>Acceso exclusivo para el propietario de ClasiColombicultura.</p>
 <form onSubmit={submit} className="admin-login"><h2>{mode==='signup'?'Activar mi cuenta':mode==='recovery'?'Recuperar contraseña':mode==='password'?'Elegir contraseña':'Iniciar sesión'}</h2>
 {mode!=='password'&&<label className="form-field">Correo electrónico<input autoComplete="username" type="email" required value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label>}
 {mode!=='recovery'&&<label className="form-field">Contraseña<input autoComplete={mode==='login'?'current-password':'new-password'} type="password" required minLength={mode==='login'?1:12} value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label>}
 {mode==='password'&&<label className="form-field">Repetir contraseña<input autoComplete="new-password" type="password" required minLength={12} value={confirm} onChange={e=>setConfirm(e.target.value)} disabled={busy}/></label>}
 {mode==='signup'&&<p className="form-help">Utiliza el correo de la cuenta propietaria. Necesitarás confirmarlo por correo electrónico. Mínimo 12 caracteres para la contraseña.</p>}
 {error&&<p role="alert" className="error-box">{error}</p>}{message&&<p role="status" className="notice">{message}</p>}
 <button className="button" disabled={busy}>{busy?'Un momento…':mode==='recovery'?'Enviar enlace':mode==='password'?'Guardar contraseña':mode==='signup'?'Activar cuenta':'Entrar'}</button>
 <div className="login-options">{mode!=='login'&&<button type="button" className="quiet-button" onClick={()=>{setMode('login');setError('');setMessage('');}}>Volver al acceso</button>}{mode==='login'&&<><button type="button" className="quiet-button" onClick={()=>setMode('recovery')}>He olvidado mi contraseña</button>{signupAllowed&&<button type="button" className="quiet-button" onClick={()=>setMode('signup')}>Primer acceso del propietario</button>}</>}</div>
 </form></section>;
}
