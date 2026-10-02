const configuredApi=process.env.NEXT_PUBLIC_API_URL?.trim();
const API=configuredApi || (process.env.NODE_ENV==="development" ? "http://localhost:4000/api/v1" : "");
function apiBase(){if(!API)throw new Error("NEXT_PUBLIC_API_URL is required outside development");return API;}
let refreshPromise:Promise<string|null>|null=null;
let accessToken:string|null=null;

export function apiUrl(path:string){return apiBase()+(path.startsWith("/")?path:"/"+path)}
async function parse<T>(r:Response){const text=await r.text();let data:any;try{data=text?JSON.parse(text):null}catch{data=text}if(!r.ok)throw Object.assign(new Error(data?.message||data?.error||("API "+r.status)),{status:r.status,data});return data as T}
async function request<T>(path:string,init:RequestInit,headers:Record<string,string>){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  try{return await parse<T>(await fetch(apiUrl(path),{...init,headers,cache:"no-store",credentials:"include",signal:init.signal??controller.signal}))}
  catch(e:any){if(e?.name==="AbortError")throw new Error("Request timed out. Check your connection and try again.");throw e}
  finally{clearTimeout(timer)}
}
export async function api<T>(path:string,init:RequestInit={}){return request<T>(path,init,{"content-type":"application/json",...(init.headers as Record<string,string>||{})})}

export async function restoreSession(){
  if(typeof window==="undefined")return null;
  if(refreshPromise)return refreshPromise;
  refreshPromise=request<{accessToken?:string;user?:unknown}>(
    "/auth/refresh",
    {method:"POST",body:"{}"},
    {"content-type":"application/json","X-Imizi-Client":"web"},
  ).then(next=>{
    accessToken=next.accessToken??null;
    if(next.user){try{sessionStorage.setItem("imizi_user",JSON.stringify(next.user));}catch{}}
    return accessToken;
  }).catch(()=>null).finally(()=>{refreshPromise=null});
  return refreshPromise;
}

export async function authApi<T>(path:string,init:RequestInit={},retry=true){
  if(typeof window==="undefined")throw new Error("Browser authentication required");
  let token=accessToken;
  if(!token)token=await restoreSession();
  const headers:Record<string,string>={
    ...(init.headers as Record<string,string>||{}),
    "content-type":"application/json",
    "X-Imizi-Client":"web",
    ...(token?{authorization:"Bearer "+token}:{}),
  };
  try{return await request<T>(path,init,headers)}
  catch(e:any){
    if(e.status===401&&retry){
      const next=await restoreSession();
      if(next){
        return request<T>(path,init,{...headers,authorization:"Bearer "+next});
      }
    }
    if(e.status===401){
      accessToken=null;
      try{
        sessionStorage.removeItem("imizi_user");
      }catch{}
    }
    throw e
  }
}

export async function signInSession(access:string,user:unknown){
  accessToken=access;
  try{
    sessionStorage.setItem("imizi_user",JSON.stringify(user));
  }catch{}
}

export async function signOut(){
  try{await api("/auth/logout",{method:"POST",body:"{}"});}catch{}
  accessToken=null;
  try{
    sessionStorage.removeItem("imizi_user");
  }catch{}
}

export function formatRwf(n:number){return new Intl.NumberFormat("en-RW",{style:"currency",currency:"RWF",maximumFractionDigits:0}).format(Number(n||0))}
export function shortDate(v:string){return v?new Intl.DateTimeFormat("en-RW",{dateStyle:"medium"}).format(new Date(v)):"—"}
