"use client";
import{useQuery,useMutation,useQueryClient}from"@tanstack/react-query";
import{Bell,Check}from"lucide-react";
import{Popover,PopoverTrigger,PopoverContent,Button}from"../ui";
import{authApi}from"../../lib/api";
type Notification={id:string;title:string;body:string;read_at?:string|null;created_at:string};
export function NotificationsBell(){
  const q=useQueryClient();
  const{data=[]}=useQuery<Notification[]>({queryKey:["notifications"],queryFn:()=>authApi<Notification[]>("/notifications"),staleTime:30000});
  const read=useMutation({mutationFn:()=>authApi("/notifications/read-all",{method:"PATCH"}),onSuccess:()=>q.invalidateQueries({queryKey:["notifications"]})});
  const unread=data.filter(x=>!x.read_at).length;
  return <Popover>
    <PopoverTrigger asChild><button className="icon-button relative" aria-label={unread?unread+" unread notifications":"Notifications"}><Bell size={18}/>{unread>0&&<span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-black">{Math.min(unread,99)}</span>}</button></PopoverTrigger>
    <PopoverContent align="end" className="w-96">
      <div className="flex items-center justify-between gap-3"><b>Notifications</b><Button size="sm" variant="ghost" onClick={()=>read.mutate()} disabled={!unread||read.isPending}><Check size={15}/>Mark all read</Button></div>
      <div className="mt-3 max-h-80 space-y-2 overflow-auto">{data.slice(0,8).map(n=><div key={n.id} className={"rounded-xl border border-[var(--color-border)] p-3 "+(!n.read_at?"bg-[var(--color-primary-soft)]":"")}><div className="font-semibold">{n.title}</div><div className="mt-1 text-sm text-[var(--color-fg-muted)]">{n.body}</div><div className="mt-1 text-[10px] text-[var(--color-fg-subtle)]">{new Date(n.created_at).toLocaleString()}</div></div>)}{!data.length&&<div className="py-8 text-center text-sm text-[var(--color-fg-muted)]">No notifications yet.</div>}</div>
    </PopoverContent>
  </Popover>;
}