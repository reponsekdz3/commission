import * as SecureStore from "expo-secure-store";

export const API=process.env.EXPO_PUBLIC_API_URL||"http://localhost:4000/api/v1";
export type SearchItem={listing:{id:string;listingType:string;priceMinor:number;currency:string;availableFrom?:string;status?:string};property:{id:string;title:string;district:string;province:string;sector?:string;latitude:number;longitude:number;bedrooms?:number;bathrooms?:number;parking?:number;media?:{url:string}[];verificationStatus?:string;propertyType?:string;amenities?:string[]}};
const ACCESS="imizi.access",REFRESH="imizi.refresh",LEGACY_ACCESS="imizi_token",LEGACY_REFRESH="imizi_refresh";
let refreshPromise:Promise<string|null>|null=null;

export async function token(){return(await SecureStore.getItemAsync(ACCESS))??(await SecureStore.getItemAsync(LEGACY_ACCESS))}

async function refresh(){
 if(refreshPromise)return refreshPromise;
 refreshPromise=(async()=>{
  const r=await SecureStore.getItemAsync(REFRESH)??await SecureStore.getItemAsync(LEGACY_REFRESH);
  if(!r)return null;
  const res=await fetch(API+"/auth/refresh",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({refreshToken:r})});
  if(!res.ok){
   await Promise.all([ACCESS,REFRESH,LEGACY_ACCESS,LEGACY_REFRESH].map(k=>SecureStore.deleteItemAsync(k)));
   return null;
  }
  const d=await res.json();
  await SecureStore.setItemAsync(ACCESS,d.accessToken);
  await SecureStore.setItemAsync(REFRESH,d.refreshToken);
  await SecureStore.setItemAsync("imizi_user",JSON.stringify(d.user||{}));
  await SecureStore.deleteItemAsync(LEGACY_ACCESS);
  await SecureStore.deleteItemAsync(LEGACY_REFRESH);
  return d.accessToken as string;
 })().finally(()=>{refreshPromise=null});
 return refreshPromise;
}

function isRetryableMethod(method:string){return method==="GET"||method==="HEAD"||method==="OPTIONS";}
function sleep(ms:number){return new Promise(resolve=>setTimeout(resolve,ms));}

export async function api<T>(path:string,init:RequestInit={},auth=false,retry=true){
 const method=(init.method||"GET").toUpperCase();
 const headers:Record<string,string>={"content-type":"application/json",...(init.headers as Record<string,string>||{})};
 const t=auth?await token():null;
 if(t)headers.authorization="Bearer "+t;
 let lastError:any;
 for(let attempt=0;attempt<3;attempt++){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  try{
   const r=await fetch(API+(path.startsWith("/")?path:"/"+path),{...init,headers,signal:init.signal??controller.signal});
   const tx=await r.text();
   let d:any;try{d=tx?JSON.parse(tx):null}catch{d=tx}
   if(r.status===401&&auth&&retry){
    const next=await refresh();
    if(next){
      headers.authorization="Bearer "+next;
      return api<T>(path,{...init,headers},true,false);
    }
   }
   if(!r.ok){
    const error=Object.assign(new Error(d?.message||d?.error||("API "+r.status)),{status:r.status,data:d});
    if(isRetryableMethod(method)&&(r.status===429||r.status>=500)&&attempt<2){
      const retryAfter=Number(r.headers.get("retry-after")||"");
      await sleep(Number.isFinite(retryAfter)&&retryAfter>0?Math.min(retryAfter*1000,4000):350*(attempt+1));
      continue;
    }
    throw error;
   }
   return d as T;
  }catch(e:any){
   lastError=e;
   if(e?.name==="AbortError"){lastError=new Error("Request timed out. Check your connection and try again.");break;}
   if(isRetryableMethod(method)&&attempt<2&&!e?.status){
    await sleep(350*(attempt+1));
    continue;
   }
   break;
  }finally{clearTimeout(timer)}
 }
 throw lastError instanceof Error?lastError:new Error("Network request failed");
}

export function money(n:number){return new Intl.NumberFormat("en-RW",{style:"currency",currency:"RWF",maximumFractionDigits:0}).format(Number(n||0))}
