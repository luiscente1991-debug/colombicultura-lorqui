import Portal from './portal';
import {getSocietyManager} from '@/lib/site-auth';
export const dynamic='force-dynamic';
export default async function Home(){return <Portal canManage={!!(await getSocietyManager())}/>;}
