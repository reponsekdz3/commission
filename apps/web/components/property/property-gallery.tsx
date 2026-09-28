"use client";
import useEmblaCarousel from "embla-carousel-react";
import{useEffect,useState}from"react";
import{AppImage}from"../app-image";
export function PropertyGallery({media,transitionId}:{media:{id:string;url:string}[];transitionId?:string}){
 const[ref,api]=useEmblaCarousel({loop:true}),[i,setI]=useState(0);
 useEffect(()=>{if(!api)return;const onSelect=()=>setI(api.selectedScrollSnap());api.on("select",onSelect);return()=>{api.off("select",onSelect)}},[api]);
 return <div><div ref={ref} className="overflow-hidden rounded-2xl"><div className="flex">{media.map((m,n)=><div key={m.id} className="relative min-w-0 flex-[0_0_100%]"><AppImage src={m.url} alt="" fill sizes="100vw" priority={n===0} className="h-[60vh] min-h-[420px] w-full object-cover ken-burns" style={n===0&&transitionId?{viewTransitionName:"property-image-"+transitionId}:undefined}/></div>)}</div></div><div className="mt-2 flex gap-2 overflow-auto">{media.map((m,n)=><button key={m.id} aria-label={"Show image "+(n+1)} className={"relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 "+(i===n?"border-[var(--color-primary)]":"border-transparent")} onClick={()=>api?.scrollTo(n)}><AppImage src={m.url} alt="" fill sizes="96px" className="object-cover"/></button>)}</div></div>
}