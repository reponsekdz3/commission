import { ImageResponse } from "next/og";
import { api } from "../../../../lib/api";
export const runtime="edge";
export const alt="Imizi district property search";
export const size={width:1200,height:630};
export const contentType="image/png";
export default async function Image({params}:{params:Promise<{district:string}>}) {
 const {district}=await params; const name=decodeURIComponent(district).replace(/-/g," ");
 let count=0; try{const r=await api<{items:{property:{id:string}}[]}>("/search?district="+encodeURIComponent(name)+"&limit=1");count=r.items.length;}catch{}
 return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",gap:26,padding:64,background:"linear-gradient(135deg,#101827,#244b55)",color:"white",fontFamily:"sans-serif"}}><div style={{fontSize:32,fontWeight:700}}>IMIZI · RWANDA</div><div style={{fontSize:70,fontWeight:800,textTransform:"capitalize"}}>{name}</div><div style={{fontSize:30,color:"#d1d5db"}}>Live property discovery in {name}</div><div style={{fontSize:24,color:"#fbbf24"}}>{count>0?"Live inventory available":"Explore current listings"} · Rent · Buy · Short stay</div></div>,size);
}