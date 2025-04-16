// [todo]: requires direct expo prebuild
// import { MMKV } from "react-native-mmkv";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

// import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
// export const QueryStore = new MMKV({
//   id: "QueryStorePresistor",
// });

// const clientStorage = {
//   setItem: (key: string, value: any) => {
//     QueryStore.set(key, value);
//   },
//   getItem: (key: string) => {
//     const value = QueryStore.getString(key);
//     return value === undefined ? null : value;
//   },
//   removeItem: (key: string) => {
//     QueryStore.delete(key);
//   },
// };

// export const queryStorePresistor = createSyncStoragePersister({
//   storage: clientStorage,
// });

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});
