import AsyncStorage from "@react-native-async-storage/async-storage";
export async function cacheJson(key:string,value:unknown){try{await AsyncStorage.setItem("imizi.cache."+key,JSON.stringify({value,at:Date.now()}));}catch{}}
export async function readCached<T>(key:string):Promise<T|undefined>{try{const raw=await AsyncStorage.getItem("imizi.cache."+key);return raw?JSON.parse(raw).value as T:undefined;}catch{return undefined;}}
