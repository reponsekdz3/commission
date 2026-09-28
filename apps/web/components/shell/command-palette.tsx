"use client";
import{useEffect,useState}from"react";
import{useRouter}from"next/navigation";
import{useQuery}from"@tanstack/react-query";
import{Command,CommandInput,CommandList,CommandEmpty,CommandGroup,CommandItem}from"../ui";
import{Search,Map,Heart,MessageCircle,LayoutDashboard,GitCompareArrows,Building2}from"lucide-react";
import{api}from"../../lib/api";
type SearchResult={listing:{id:string};property:{id:string;title:string;district?:string;province?:string}};
const actions=[["Search properties","/search",Search],["Open map","/map",Map],["Saved properties","/favorites",Heart],["Messages","/messages",MessageCircle],["Dashboard","/dashboard",LayoutDashboard],["Compare homes","/compare",GitCompareArrows],["List a property","/manage",Building2]] as const;
export function CommandPalette(){
  const[open,setOpen]=useState(false),[q,setQ]=useState("");
  const router=useRouter();
  const{data}=useQuery<SearchResult[]>({queryKey:["command-search",q],enabled:open&&q.trim().length>1,staleTime:60000,queryFn:async()=>{const r=await api<{items:SearchResult[]}>("/search?q="+encodeURIComponent(q)+"&limit=6");return r.items||[]}});
  useEffect(()=>{const f=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setOpen(true)}if(e.key==="Escape")setOpen(false)};addEventListener("keydown",f);return()=>removeEventListener("keydown",f)},[]);
  return <>{<button className="icon-button" aria-label="Open command palette" onClick={()=>setOpen(true)}><Search size={18}/></button>}{open&&<div className="fixed inset-0 z-[100] bg-[var(--color-scrim)] p-4 pt-[15vh]" onClick={()=>setOpen(false)}><div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-4)]" onClick={e=>e.stopPropagation()}><Command loop><CommandInput autoFocus value={q} onValueChange={setQ} placeholder="Search properties, districts, actions…"/><CommandList className="max-h-[70vh] overflow-auto p-2"><CommandEmpty>No matching properties or actions.</CommandEmpty><CommandGroup heading="Actions">{actions.map(([label,path,Icon])=><CommandItem key={path} value={label} onSelect={()=>{setOpen(false);router.push(path)}} className="cursor-pointer rounded px-3 py-3"><Icon size={16}/>{label}<span className="ml-auto text-xs text-[var(--color-fg-subtle)]">{path}</span></CommandItem>)}</CommandGroup>{data?.length?<CommandGroup heading="Live properties">{data.map(x=><CommandItem key={x.property.id} value={x.property.title} onSelect={()=>{setOpen(false);router.push("/properties/"+x.property.id)}} className="cursor-pointer rounded px-3 py-3"><span className="min-w-0 flex-1"><b className="block truncate">{x.property.title}</b><small className="text-[var(--color-fg-muted)]">{[x.property.district,x.property.province].filter(Boolean).join(" · ")}</small></span><span className="text-xs text-[var(--color-primary)]">Open</span></CommandItem>)}</CommandGroup>:null}</CommandList></Command></div></div>}</>
}