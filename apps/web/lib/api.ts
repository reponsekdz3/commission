const API=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000/api/v1";
export function apiUrl(path:string){return `${API}${path.startsWith("/")?path:"/"+path}`;}
async function parse<T>(r:Response){const text=await r.text();let data:any;try{data=text?JSON.parse(text):null}catch{data=text}if(!r.ok)throw Object.assign(new Error(data?.message||data?.error||`API ${r.status}`),{status:r.status,data});return data as T;}
export async function api<T>(path:string,init:RequestInit={}){return parse<T>(await fetch(apiUrl(path),{...init,headers:{"content-type":"application/json",...(init.headers||{})},cache:"no-store"}));}
export async function authApi<T>(path:string,init:RequestInit={},retry=true){
 if(typeof window==="undefined")throw new Error("Browser authentication required");
 let token=localStorage.getItem("imizi_token");
 const headers:Record<string,string>={...(init.headers as Record<string,string>||{})}; if(token)headers.authorization=`Bearer ${token}`;
 try{return await parse<T>(await fetch(apiUrl(path),{...init,headers:{...headers,"content-type":"application/json"},cache:"no-store"}));}
 catch(e:any){if(e.status===401&&retry){const refresh=localStorage.getItem("imizi_refresh");if(refresh){try{const next=await api<any>("/auth/refresh",{method:"POST",body:JSON.stringify({refreshToken:refresh})});localStorage.setItem("imizi_token",next.accessToken);localStorage.setItem("imizi_refresh",next.refreshToken);localStorage.setItem("imizi_user",JSON.stringify(next.user));return authApi<T>(path,init,false)}catch{localStorage.removeItem("imizi_token");localStorage.removeItem("imizi_refresh");localStorage.removeItem("imizi_user");}}}throw e}
}
export function formatRwf(n:number){return new Intl.NumberFormat("en-RW",{style:"currency",currency:"RWF",maximumFractionDigits:0}).format(Number(n||0));}
export function shortDate(v:string){return v?new Intl.DateTimeFormat("en-RW",{dateStyle:"medium"}).format(new Date(v)):"—";}
