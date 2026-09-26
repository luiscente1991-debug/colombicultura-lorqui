'use client';
import {useState,type ImgHTMLAttributes} from 'react';
import {imageProps,type ImageVariant} from '@/lib/image-urls';
import {mediaUrl} from '@/lib/model';

type Props=Omit<ImgHTMLAttributes<HTMLImageElement>,'src'|'srcSet'|'sizes'> & {imageKey:string;published:boolean;variant?:ImageVariant};
export default function PublicImage({imageKey,published,variant='detail',alt='',loading='lazy',...props}:Props){
 const [failedKey,setFailedKey]=useState('');
 const optimized=published&&failedKey!==imageKey;
 return <img {...props} {...imageProps(imageKey,variant,optimized)} alt={alt} loading={loading} decoding="async"
  onError={()=>{if(optimized)setFailedKey(imageKey);}} data-original={mediaUrl(imageKey)}/>;
}
