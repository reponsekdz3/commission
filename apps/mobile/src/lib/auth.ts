
import * as SecureStore from "expo-secure-store";

const ACCESS = "imizi.access";
const REFRESH = "imizi.refresh";

export const getAccessToken = () => SecureStore.getItemAsync(ACCESS);
export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH);

export async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(ACCESS, accessToken);
  await SecureStore.setItemAsync(REFRESH, refreshToken);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS);
  await SecureStore.deleteItemAsync(REFRESH);
}
