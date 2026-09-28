"use client";
import{useEffect,useMemo,useState}from"react";
import{useRouter}from"next/navigation";
import{useQuery}from"@tanstack/react-query";
import{api,formatRwf}from"../../lib/api";
import{useCompareStore}from"../../components/compare-store";

const rows=["price","bedrooms","bathrooms","parking","verified","district","propertyType","area"];
export default function ComparePage(){
 const router=useRouter();const items=useCompareStore(s=>s.items);const remove=useCompareStore(s=>s.remove);const clear=useCompareStore(s=>s.clear);
 const ids=useMemo(()=>items.map(x=>x.id).join(","),[items]);
 const q=useQuery({queryKey:["compare",ids],queryFn:()=>api<any[]>("/compare"+(ids?"?ids="+encodeURIComponent(ids):"")),staleTime:30000});
 useEffect(()=>{if(!items.length)void q.refetch()},[items.length]);
 return <main className="wrap section"><div className="sectionHead"><div><div className="eyebrow">Decision workspace</div><h1>Compare up to 4 properties</h1><p className="muted">The selected properties are loaded again from the live backend before comparison.</p></div><div className="actions">{items.length>0&&<button className="btn ghost" onClick={clear}>Clear</button>}<button className="btn ghost" onClick={()=>router.push("/search")}>Add properties</button></div></div>
 {q.isPending?<div className="panel">Loading live comparison…</div>:q.isError?<div className="notice error">{q.error instanceof Error?q.error.message:"Unable to load comparison"}</div>:q.data?.length?<div className="overflow-x-auto"><table className="table min-w-[760px]"><thead><tr><th>Attribute</th>{q.data.map((i:any)=><th key={i.listing.id}><div>{i.property.title}</div><button className="chip mt-2" onClick={()=>remove(i.property.id)}>Remove</button></th>)}</tr></thead><tbody>{rows.map(row=><tr key={row}><td className="font-semibold">{row}</td>{q.data.map((i:any)=><td key={i.listing.id+row}>{row==="price"&&formatRwf(i.listing.priceMinor)}{row==="bedrooms"&&String(i.property.bedrooms??"—")}{row==="bathrooms"&&String(i.property.bathrooms??"—")}{row==="parking"&&String(i.property.parking??"—")}{row==="verified"&&(i.property.verificationStatus==="VERIFIED"?"✓ Verified":"—")}{row==="district"&&i.property.district}{row==="propertyType"&&i.property.propertyType}{row==="area"&&String((i.property.areaValue??"—")+" "+(i.property.areaUnit||""))}</td>)}</tr>)}</tbody></table></div>:<div className="empty"><h3>No properties selected</h3><p>Add properties from search using the compare control.</p><button className="btn" onClick={()=>router.push("/search")}>Browse properties</button></div>}
 </main>;
}