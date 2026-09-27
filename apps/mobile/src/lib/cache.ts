import AsyncStorage from "@react-native-async-storage/async-storage";
const PREFIX="imizi.cache.";
export async function cacheJson(key:string,value:unknown){try{await AsyncStorage.setItem(PREFIX+key,JSON.stringify({value,at:Date.now()}));}catch{}}
export async function readCached<T>(key:string,maxAgeMs=86400000):Promise<T|undefined>{try{const raw=await AsyncStorage.getItem(PREFIX+key);if(!raw)return;const x=JSON.parse(raw);if(Date.now()-x.at>maxAgeMs)return;return x.value as T;}catch{return undefined;}}
export async function clearCache(){try{const keys=await AsyncStorage.getAllKeys();await AsyncStorage.multiRemove(keys.filter(k=>k.startsWith(PREFIX)));}catch{}}
