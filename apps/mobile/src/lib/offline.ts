import { cacheJson, readCached } from "./cache";
import { api } from "./api";

export async function getWithCache<T>(path:string,key:string,maxAgeMs=24*60*60*1000,auth=false){
  try{
    const fresh=await api<T>(path,{},auth);
    await cacheJson(key,fresh);
    return {data:fresh,offline:false};
  }catch(error){
    const cached=await readCached<T>(key,maxAgeMs);
    if(cached!==undefined)return {data:cached,offline:true};
    throw error;
  }
}