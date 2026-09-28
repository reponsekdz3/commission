"use client";
import{useEffect,useMemo,useState}from"react";
import{BellRing,Bookmark}from"lucide-react";
import{useSearchParams}from"next/navigation";
import{useQueryClient}from"@tanstack/react-query";
import{useProperties}from"../hooks/use-properties";
import{authApi}from"../lib/api";
import{toast}from"sonner";

export function SavedSearchChip(){
  const params=useSearchParams(),query=params.toString(),queryClient=useQueryClient();
  const key=useMemo(()=>"imizi:saved-search:"+(query||"all"),[query]);
  const{data}=useProperties(query);
  const[count,setCount]=useState<number|null>(null),[newMatch,setNewMatch]=useState(false),[saving,setSaving]=useState(false);
  useEffect(()=>{if(!data)return;const ids=(data.items??[]).map(x=>x.listing.id).join(",");const k=key+":ids";const prev=localStorage.getItem(k);if(prev&&prev!==ids)setNewMatch(true);localStorage.setItem(k,ids);setCount(data.items?.length??0)},[data,key]);
  useEffect(()=>{const id=window.setInterval(()=>void queryClient.invalidateQueries({queryKey:["properties",query]}),60000);return()=>clearInterval(id)},[query,queryClient]);
  async function save(){
    if(saving)return;
    setSaving(true);
    try{
      await authApi("/saved-searches",{method:"POST",body:JSON.stringify({name:query||"All Rwanda properties",criteria:Object.fromEntries(params.entries())})});
      localStorage.setItem(key,JSON.stringify({query,createdAt:new Date().toISOString(),count}));
      setNewMatch(false);toast("Search saved to your account");
    }catch(e){toast(e instanceof Error?e.message:"Sign in to save searches")}finally{setSaving(false)}
  }
  return <button type="button" onClick={()=>void save()} disabled={saving} className={"chip "+(newMatch?"animate-pulse border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/30":"")} aria-label="Save current search">
    <span>{newMatch?<BellRing size={15}/>:<Bookmark size={15}/>} {saving?"Saving…":newMatch?"New listings match":"Save search"}{count!==null?" · "+count:""}</span>
  </button>;
}