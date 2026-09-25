"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Item={listing:{id:string;priceMinor:number};property:{id:string;title:string;latitude:number;longitude:number;district:string}};
declare global { interface Window { L:any; } }

const API=process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export function MapClient({items:initialItems}:{items:Item[]}){
  const mapRef=useRef<HTMLDivElement|null>(null);
  const mapInstance=useRef<any>(null);
  const layerRef=useRef<any>(null);
  const [items,setItems]=useState<Item[]>(initialItems);

  useEffect(()=>{
    let disposed=false;
    let moveTimer:ReturnType<typeof setTimeout>|undefined;

    const renderMarkers=(L:any,map:any,data:Item[])=>{
      if(layerRef.current){layerRef.current.clearLayers();}else{layerRef.current=L.layerGroup().addTo(map);}
      const bounds:any[]=[];
      for(const item of data){
        const p=item.property;if(!p||!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude))continue;
        const marker=L.marker([p.latitude,p.longitude]).addTo(layerRef.current);
        marker.bindPopup(
          "<strong>"+String(p.title).replace(/</g,"&lt;")+"</strong><br/>"+p.district+"<br/>"+
          '<a href="/properties/'+encodeURIComponent(p.id)+'">Open property</a>'
        );
        bounds.push([p.latitude,p.longitude]);
      }
      if(bounds.length>1&&!map.__imiziFitOnce){map.fitBounds(bounds,{padding:[30,30]});map.__imiziFitOnce=true;}
    };

    const searchArea=async(map:any)=>{
      const b=map.getBounds();
      const params=new URLSearchParams({
        north:String(b.getNorth()),south:String(b.getSouth()),east:String(b.getEast()),west:String(b.getWest()),limit:"50",
      });
      try{
        const response=await fetch(API+"/search?"+params.toString(),{cache:"no-store"});
        if(!response.ok)return;
        const data=await response.json() as {items:Item[]};
        if(!disposed){
          setItems(data.items);
          renderMarkers(window.L,map,data.items);
        }
      }catch{}
    };

    const ensure=async()=>{
      if(!document.getElementById("leaflet-css")){
        const link=document.createElement("link");link.id="leaflet-css";link.rel="stylesheet";link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(link);
      }
      if(!window.L){
        await new Promise<void>((resolve,reject)=>{
          const script=document.createElement("script");script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";script.onload=()=>resolve();script.onerror=()=>reject(new Error("Leaflet failed to load"));document.body.appendChild(script);
        });
      }
      if(disposed||!mapRef.current)return;
      const L=window.L;const first=initialItems[0]?.property;const center:[number,number]=first?[first.latitude,first.longitude]:[-1.9441,30.0619];
      const map=L.map(mapRef.current,{zoomControl:true}).setView(center,first?11:8);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap contributors"}).addTo(map);
      mapInstance.current=map;renderMarkers(L,map,initialItems);
      map.on("moveend",()=>{
        if(moveTimer)clearTimeout(moveTimer);
        moveTimer=setTimeout(()=>void searchArea(map),350);
      });
      void searchArea(map);
    };

    ensure().catch(()=>{});
    return()=>{disposed=true;if(moveTimer)clearTimeout(moveTimer);if(mapInstance.current){mapInstance.current.remove();mapInstance.current=null;layerRef.current=null;}};
  },[initialItems]);

  return <div ref={mapRef} style={{height:520,borderRadius:18,overflow:"hidden",marginBottom:24}}/>;
}

export function MapResultList({items}:{items:Item[]}){
  return <div className="grid">{items.slice(0,8).map(item=>
    <Link key={item.listing.id} className="card" href={"/properties/"+item.property.id}>
      <div className="meta"><strong>{item.property.title}</strong><div className="muted">{item.property.district}</div><div>{new Intl.NumberFormat("en-RW",{style:"currency",currency:"RWF",maximumFractionDigits:0}).format(item.listing.priceMinor)}</div></div>
    </Link>
  )}</div>;
}
