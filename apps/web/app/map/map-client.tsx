"use client";

import { useEffect,useRef } from "react";
import Link from "next/link";

type Item={listing:{id:string;priceMinor:number};property:{id:string;title:string;latitude:number;longitude:number;district:string}};

declare global { interface Window { L:any; } }

export function MapClient({items}:{items:Item[]}){
  const mapRef=useRef<HTMLDivElement|null>(null);
  const mapInstance=useRef<any>(null);

  useEffect(()=>{
    let disposed=false;
    const ensure=async()=>{
      if(!document.getElementById("leaflet-css")){
        const link=document.createElement("link");
        link.id="leaflet-css";link.rel="stylesheet";
        link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if(!window.L){
        await new Promise<void>((resolve,reject)=>{
          const script=document.createElement("script");
          script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload=()=>resolve();script.onerror=()=>reject(new Error("Leaflet failed to load"));
          document.body.appendChild(script);
        });
      }
      if(disposed||!mapRef.current||mapInstance.current)return;
      const L=window.L;
      const first=items[0]?.property;
      const center:[number,number]=first?[first.latitude,first.longitude]:[-1.9441,30.0619];
      const map=L.map(mapRef.current,{zoomControl:true}).setView(center,first?11:8);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap contributors"}).addTo(map);
      const bounds:any[]=[];
      for(const item of items){
        const p=item.property;if(!p||!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude))continue;
        const marker=L.marker([p.latitude,p.longitude]).addTo(map);
        marker.bindPopup(
          `<strong>${String(p.title).replace(/</g,"&lt;")}</strong><br/>${p.district}<br/>`+
          `<a href="/properties/${encodeURIComponent(p.id)}">Open property</a>`
        );
        bounds.push([p.latitude,p.longitude]);
      }
      if(bounds.length>1)map.fitBounds(bounds,{padding:[30,30]});
      mapInstance.current=map;
    };
    ensure().catch(()=>{});
    return()=>{disposed=true;if(mapInstance.current){mapInstance.current.remove();mapInstance.current=null;}};
  },[items]);

  return <div ref={mapRef} style={{height:520,borderRadius:18,overflow:"hidden",marginBottom:24}}/>;
}

export function MapResultList({items}:{items:Item[]}){
  return <div className="grid">{items.slice(0,8).map(item=>
    <Link key={item.listing.id} className="card" href={`/properties/${item.property.id}`}>
      <div className="meta"><strong>{item.property.title}</strong><div className="muted">{item.property.district}</div><div>{new Intl.NumberFormat("en-RW",{style:"currency",currency:"RWF",maximumFractionDigits:0}).format(item.listing.priceMinor)}</div></div>
    </Link>
  )}</div>;
}
