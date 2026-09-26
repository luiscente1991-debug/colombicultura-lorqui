import type {Metadata} from 'next';
import './globals.css';
import AuthCallback from '@/components/auth-callback';
export const metadata:Metadata={title:'ClasiColombicultura · Sociedades',description:'Sociedades por comunidad, noticias, información y clasificaciones de colombicultura.',manifest:'/manifest.webmanifest',themeColor:'#d90000',icons:{icon:[{url:'/favicon.svg'},{url:'/icons/favicon-48.png',sizes:'48x48',type:'image/png'}],apple:[{url:'/icons/apple-touch-icon.png',sizes:'180x180',type:'image/png'}]}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es"><body><AuthCallback/>{children}</body></html>}
