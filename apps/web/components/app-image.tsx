import Image,{type ImageProps}from"next/image";
type AppImageProps=Omit<ImageProps,"src"> & {src:string};
export function AppImage({src,alt,sizes="(max-width: 768px) 100vw, 50vw",...props}:AppImageProps){
  const remote=/^https?:\/\//i.test(src);
  return <Image src={src} alt={alt} sizes={sizes} unoptimized={remote} {...props}/>;
}
