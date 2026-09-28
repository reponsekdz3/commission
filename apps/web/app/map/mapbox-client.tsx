"use client";
import{useEffect,useRef,useState}from"react";
import{useRouter}from"next/navigation";
import{MapSearchDraw}from"../../components/map-search-draw";

type Props={items:any[];activeId?:string;onMarkerSelect?:(id:string)=>void};

export function MapboxClient({items,activeId,onMarkerSelect}:Props){
  const ref=useRef<HTMLDivElement>(null);
  const mapRef=useRef<any>(null);
  const markersRef=useRef<Map<string,any>>(new Map());
  const[map,setMap]=useState<any>(null);
  const router=useRouter();

  useEffect(()=>{
    const token=process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if(!ref.current||!token)return;
    let script=document.querySelector('script[data-imizi-mapbox]') as HTMLScriptElement|null;
    const cssId="imizi-mapbox-css";
    if(!document.getElementById(cssId)){
      const l=document.createElement("link");l.id=cssId;l.rel="stylesheet";l.href="https://api.mapbox.com/mapbox-gl-js/v3.30.0/mapbox-gl.css";document.head.appendChild(l);
    }
    let cancelled=false;
    const start=()=>{
      const mb=(window as any).mapboxgl;
      if(!mb||cancelled||mapRef.current||!ref.current)return;
      mb.accessToken=token;
      const instance=new mb.Map({container:ref.current,style:"mapbox://styles/mapbox/standard",center:[30.0619,-1.9441],zoom:11});
      instance.addControl(new mb.NavigationControl(),"top-right");
      mapRef.current=instance;setMap(instance);
    };
    if(script)script.addEventListener("load",start);
    else{
      script=document.createElement("script");
      script.src="https://api.mapbox.com/mapbox-gl-js/v3.30.0/mapbox-gl.js";
      script.async=true;script.dataset.imiziMapbox="true";script.onload=start;document.head.appendChild(script);
    }
    return()=>{cancelled=true;script?.removeEventListener("load",start);markersRef.current.forEach(m=>m.remove());markersRef.current.clear();mapRef.current?.remove();mapRef.current=null;setMap(null)};
  },[]);

  useEffect(()=>{
    const mb=(window as any).mapboxgl;
    const instance=mapRef.current;
    if(!mb||!instance)return;
    markersRef.current.forEach(m=>m.remove());markersRef.current.clear();
    const bounds=new mb.LngLatBounds();
    let hasBounds=false;
    for(const item of items){
      const id=String(item.property?.id||"");
      const lat=Number(item.property?.latitude),lng=Number(item.property?.longitude);
      if(!id||!Number.isFinite(lat)||!Number.isFinite(lng))continue;
      const el=document.createElement("button");
      el.type="button";el.title=item.property.title||"Property";el.setAttribute("aria-label","Open "+(item.property.title||"property"));
      el.style.cssText="width:22px;height:22px;border-radius:999px;border:3px solid white;background:#0E9F6E;box-shadow:0 4px 14px #0005;cursor:pointer;transition:transform .18s ease,background .18s ease,box-shadow .18s ease";
      el.onclick=()=>{if(onMarkerSelect){onMarkerSelect(id);}else{router.push("/properties/"+id);}};
      const marker=new mb.Marker(el).setLngLat([lng,lat]).addTo(instance);
      markersRef.current.set(id,marker);bounds.extend([lng,lat]);hasBounds=true;
    }
    if(hasBounds&&items.length>1)instance.fitBounds(bounds,{padding:70,maxZoom:14,duration:500});
  },[items,router,onMarkerSelect]);

  useEffect(()=>{
    const instance=mapRef.current;
    if(!instance)return;
    markersRef.current.forEach((marker,id)=>{
      const el=marker.getElement();
      const active=id===activeId;
      el.style.transform=active?"scale(1.55)":"scale(1)";
      el.style.background=active?"#F59E0B":"#0E9F6E";
      el.style.boxShadow=active?"0 0 0 8px rgba(245,158,11,.18),0 5px 18px #0006":"0 4px 14px #0005";
    });
    if(activeId){
      const marker=markersRef.current.get(activeId);
      if(marker){const lngLat=marker.getLngLat();instance.easeTo({center:lngLat,duration:450,offset:[80,0]});}
    }
  },[activeId]);

  return <div style={{position:"relative",height:"100%"}}>
    <div ref={ref} className="realMap"/>
    {map&&<MapSearchDraw map={map}/>}
    {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN&&<div className="mapOverlay">Set <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to render the production Mapbox map.</div>}
  </div>
}