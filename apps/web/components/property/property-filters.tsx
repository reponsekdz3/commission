"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { Button, Slider, Switch } from "../ui";

export function PropertyFilters(){
  const router=useRouter(), pathname=usePathname(), params=useSearchParams();
  const [open,setOpen]=useState(false);
  const [maxPrice,setMaxPrice]=useState(Number(params.get("maxPriceMinor")||5000000));
  const [beds,setBeds]=useState(Number(params.get("bedroomsMin")||0));
  const [verified,setVerified]=useState(params.get("verifiedOnly")==="true");

  function apply(next:{maxPrice?:number;beds?:number;verified?:boolean}={}){
    const p=new URLSearchParams(params.toString());
    const max=next.maxPrice ?? maxPrice, b=next.beds ?? beds, v=next.verified ?? verified;
    if(max>0 && max<5000000) p.set("maxPriceMinor",String(Math.round(max))); else p.delete("maxPriceMinor");
    if(b>0) p.set("bedroomsMin",String(b)); else p.delete("bedroomsMin");
    if(v) p.set("verifiedOnly","true"); else p.delete("verifiedOnly");
    router.replace(pathname+(p.toString()?"?"+p.toString():""),{scroll:false});
  }

  function clear(){
    setMaxPrice(5000000); setBeds(0); setVerified(false);
    const p=new URLSearchParams(params.toString());
    ["maxPriceMinor","bedroomsMin","verifiedOnly"].forEach(k=>p.delete(k));
    router.replace(pathname+(p.toString()?"?"+p.toString():""),{scroll:false});
  }

  return <div className="sticky top-20 z-20 rounded-2xl border border-[var(--color-border)] bg-[var(--color-glass)] p-3 shadow-[var(--shadow-2)] backdrop-blur-xl">
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="ghost" size="sm" onClick={()=>setOpen(x=>!x)} aria-expanded={open} aria-controls="property-filter-panel">
        <SlidersHorizontal size={16}/>{open?"Hide filters":"Filters"}
      </Button>
      {beds>0&&<span className="chip">{beds}+ beds</span>}
      {maxPrice<5000000&&<span className="chip">{new Intl.NumberFormat("en-RW",{style:"currency",currency:"RWF",maximumFractionDigits:0}).format(maxPrice)} max</span>}
      {verified&&<span className="chip bg-[var(--color-primary-soft)] text-[var(--color-primary)]"><Check size={14}/> Verified</span>}
      {(beds>0||maxPrice<5000000||verified)&&<button type="button" className="chip" onClick={clear}><X size={14}/>Clear</button>}
      {open&&<div id="property-filter-panel" className="grid w-full gap-6 border-t border-[var(--color-border)] pt-4 md:grid-cols-3">
        <fieldset className="min-w-0"><legend className="text-sm font-semibold">Minimum bedrooms</legend><div className="mt-2 flex flex-wrap gap-2">{[0,1,2,3,4].map(n=><button key={n} type="button" className={"chip "+(beds===n?"active":"")} onClick={()=>{setBeds(n);apply({beds:n})}}>{n===0?"Any":n+"+"}</button>)}</div></fieldset>
        <label className="text-sm font-semibold">Maximum price
          <Slider min={100000} max={5000000} step={100000} value={[maxPrice]} onValueChange={v=>setMaxPrice(v[0]??maxPrice)} onValueCommit={v=>apply({maxPrice:v[0]??maxPrice})}/>
          <span className="mt-1 block text-xs text-[var(--color-fg-muted)]">{new Intl.NumberFormat("en-RW",{style:"currency",currency:"RWF",maximumFractionDigits:0}).format(maxPrice)}</span>
        </label>
        <label className="flex items-start gap-3 pt-1 text-sm font-semibold"><Switch checked={verified} onCheckedChange={v=>{setVerified(v);apply({verified:v})}}/><span>Verified listings only</span></label>
      </div>}
    </div>
  </div>}
