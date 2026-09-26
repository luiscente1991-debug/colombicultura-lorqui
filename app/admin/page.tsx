import { getSocietyManager } from '@/lib/site-auth';
import Shell from '@/components/site-shell';
import Admin from './panel';
import Login from './login';
export const dynamic='force-dynamic';
export const metadata={title:'Acceso privado · ClasiColombicultura',robots:{index:false,follow:false}};
export default async function Page(){
 const user=await getSocietyManager();
 if(!user)return <Shell admin><Login/></Shell>;
 return <Admin user={user.displayName}/>;
}
