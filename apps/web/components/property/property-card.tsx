"use client";
import{CheckCircle,Heart,GitCompareArrows,Share2,Images,MapPin}from"lucide-react";
import{AppImage}from"../app-image";
import{useEffect,useState}from"react";
import{toast}from"sonner";
import{TiltCard}from"../motion/tilt-card";
import{SpotlightCard}from"../motion/spotlight-card";
import{formatRwf}from"../../lib/api";
import{TransitionLink}from"../transition-link";
import{useCompareStore}from"../compare-store";
import{trackEvent}from"../../lib/analytics";
import{useFavorites,useSaveFavorite}from"../../hooks/use-favorites";

export function PropertyCard({item,variant="default"}:{item:any;variant?:"default"|"compact"|"large"}){
 const p=item.property??item;const l=item.listing??p.listings?.[0];const media=p.media??[];
 const{data:favorites=[]}=useFavorites();const save=useSaveFavorite();const[localSaved,setLocalSaved]=useState(false);
 const saved=localSaved||favorites.some(x=>x.propertyId===p.id);const compare=useCompareStore(s=>s.toggle);
 useEffect(()=>setLocalSaved(favorites.some(x=>x.propertyId===p.id)),[favorites,p.id]);
 const doSave=async(e:React.MouseEvent)=>{e.preventDefault();try{await save.mutateAsync(p.id);trackEvent(saved?"property_unsaved":"property_saved",{property_id:p.id});setLocalSaved(!saved);toast(saved?"Removed from saved":"Saved to your account")}catch(e){toast(e instanceof Error?e.message:"Sign in to save properties")}};
 const doShare=async(e:React.MouseEvent)=>{e.preventDefault();const url=window.location.origin+"/properties/"+p.id;try{if(navigator.share)await navigator.share({title:p.title||"Imizi property",url});else{await navigator.clipboard.writeText(url);toast("Property link copied")};trackEvent("property_shared",{property_id:p.id})}catch{}};
 return <TiltCard className={variant==="compact"?"":"h-full"}><SpotlightCard className="h-full"><TransitionLink href={"/properties/"+p.id} className="card block">
 <div className={"relative overflow-hidden "+(variant==="large"?"aspect-[16/10]":"aspect-[4/3]")}>
 {media[0]?.url?<AppImage src={media[0].url} alt={p.title||"Property"} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 ease-[var(--ease-out)] hover:scale-105" style={{viewTransitionName:"property-image-"+p.id}}/>:<div className="grid h-full w-full place-items-center bg-[var(--color-surface-3)] text-sm text-[var(--color-fg-muted)]">No property media</div>}
 <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2"><div>{p.verificationStatus==="VERIFIED"&&<span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-bold text-emerald-800"><CheckCircle size={13}/>Verified</span>}</div><div className="flex gap-2"><button type="button" aria-label="Share property" className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-900 shadow" onClick={doShare}><Share2 size={17}/></button><button type="button" aria-label={saved?"Remove saved property":"Save property"} className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-900 shadow" onClick={doSave} disabled={save.isPending}><Heart size={18} fill={saved?"currentColor":"none"}/></button></div></div>
 {media.length>0&&<span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1.5 text-xs font-bold text-white"><Images size={13}/>{media.length}</span>}
 <button type="button" aria-label="Add property to compare" className="absolute bottom-3 right-3 inline-flex h-9 items-center gap-1 rounded-full bg-white/90 px-3 text-xs font-bold text-slate-900 shadow" onClick={e=>{e.preventDefault();compare({id:p.id,title:p.title,price:l?formatRwf(l.priceMinor):"Price on request",image:media[0]?.url})}}><GitCompareArrows size={15}/>Compare</button>
 </div>
 <div className="cardBody"><div className="flex items-center justify-between gap-3"><div className="price">{l?formatRwf(l.priceMinor):"Price on request"}{l?.listingType==="RENT"&&<span className="text-sm text-[var(--color-fg-muted)]"> /mo</span>}</div></div><div className="mt-1 font-bold">{p.title}</div><div className="meta flex items-center gap-1"><MapPin size={13}/>{p.district} · {p.sector||"Rwanda"}</div><div className="meta">{p.bedrooms??"—"} bd · {p.bathrooms??"—"} ba · {p.areaValue??"—"} {p.areaUnit||""}</div></div>
 </TransitionLink></SpotlightCard></TiltCard>
}