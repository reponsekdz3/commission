import * as SecureStore from "expo-secure-store";
const ACCESS="imizi.access",REFRESH="imizi.refresh",USER="imizi_user",LEGACY_ACCESS="imizi_token",LEGACY_REFRESH="imizi_refresh";
export async function saveSession(d:any){await SecureStore.setItemAsync(ACCESS,d.accessToken);if(d.refreshToken)await SecureStore.setItemAsync(REFRESH,d.refreshToken);await SecureStore.setItemAsync(USER,JSON.stringify(d.user||{}));await SecureStore.deleteItemAsync(LEGACY_ACCESS);await SecureStore.deleteItemAsync(LEGACY_REFRESH);}
export async function user(){const x=await SecureStore.getItemAsync(USER);return x?JSON.parse(x):null}
export async function clearSession(){await Promise.all([ACCESS,REFRESH,USER,LEGACY_ACCESS,LEGACY_REFRESH].map(k=>SecureStore.deleteItemAsync(k)))}
export async function isSignedIn(){return !!((await SecureStore.getItemAsync(ACCESS))??(await SecureStore.getItemAsync(LEGACY_ACCESS)))}
