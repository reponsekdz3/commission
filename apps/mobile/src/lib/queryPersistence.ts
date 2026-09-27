import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

const KEY = "imizi.react-query.v1";

export const asyncStoragePersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    await AsyncStorage.setItem(KEY, JSON.stringify(client));
  },
  restoreClient: async () => {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as PersistedClient;
    } catch {
      await AsyncStorage.removeItem(KEY);
      return undefined;
    }
  },
  removeClient: async () => {
    await AsyncStorage.removeItem(KEY);
  },
};
