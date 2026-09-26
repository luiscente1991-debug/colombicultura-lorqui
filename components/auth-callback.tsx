'use client';
import {useEffect} from 'react';
export default function AuthCallback(){
 useEffect(()=>{if(location.pathname!=='/admin'&&/(?:^#|&)(?:confirmation_token|recovery_token|invite_token|access_token)=/.test(location.hash))location.replace('/admin'+location.hash);},[]);
 return null;
}
