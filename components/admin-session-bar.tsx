'use client';
import SignOut from './sign-out';

export default function AdminSessionBar({inAdmin=false}:{inAdmin?:boolean}){
 return <aside className="admin-session-bar" aria-label="Sesión privada del administrador">
  <div><strong>Sesión de administrador</strong><span>Esta barra solo aparece en tu sesión.</span></div>
  <div className="admin-session-actions"><a href={inAdmin?'/':'/admin'}>{inAdmin?'Ver web pública':'Panel privado'}</a><SignOut/></div>
 </aside>;
}
