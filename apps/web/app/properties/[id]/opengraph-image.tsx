import { ImageResponse } from "next/og";
import { api } from "../../../lib/api";
export const runtime="edge";
export const alt="Imizi property";
export const size={width:1200,height:630};
export const contentType="image/png";
export default async function Image({params}:{params:Promise<{id:string}>}) {
 const {id}=await params; let p:{title?:string;district?:string;province?:string;propertyType?:string}={};
 try{p=await api<typeof p>("/properties/"+id)}catch{}
 return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:64,background:"linear-gradient(135deg,#0b1220,#17314a)",color:"white",fontFamily:"sans-serif"}}><div style={{fontSize:32,fontWeight:700}}>IMIZI · RWANDA</div><div style={{display:"flex",flexDirection:"column",gap:18}}><div style={{fontSize:58,fontWeight:800}}>{p.title||"Property"}</div><div style={{fontSize:30,color:"#d1d5db"}}>{[p.propertyType,p.district,p.province].filter(Boolean).join(" · ")}</div></div><div style={{fontSize:24,color:"#fbbf24"}}>Verified property discovery, viewings, booking and payments</div></div>,size);
}