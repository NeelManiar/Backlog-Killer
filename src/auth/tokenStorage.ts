import * as SecureStore from "expo-secure-store";
// Chunked native storage supports large refresh sessions without plaintext fallback.
export const tokenStorage = {
  async getItem(key: string) {
    const meta = await SecureStore.getItemAsync(key);
    if (!meta) return null;
    const { generation, count } = JSON.parse(meta);
    if (!Number.isInteger(count) || count < 1 || count > 1000)
      throw Error("Invalid secure session");
    const parts = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        SecureStore.getItemAsync(`${key}.${generation}.${i}`),
      ),
    );
    if (parts.some((p) => p === null)) throw Error("Incomplete secure session");
    return parts.join("");
  },
  async setItem(key: string, value: string) {
    const old = await SecureStore.getItemAsync(key);
    const generation = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const parts = value.match(/[\s\S]{1,400}/g) ?? [""];
    await Promise.all(
      parts.map((part, i) =>
        SecureStore.setItemAsync(`${key}.${generation}.${i}`, part),
      ),
    );
    await SecureStore.setItemAsync(
      key,
      JSON.stringify({ generation, count: parts.length }),
    );
    if (old) {
      const m = JSON.parse(old);
      await Promise.all(
        Array.from({ length: m.count }, (_, i) =>
          SecureStore.deleteItemAsync(`${key}.${m.generation}.${i}`),
        ),
      );
    }
  },
  async removeItem(key: string) {
    const old = await SecureStore.getItemAsync(key);
    await SecureStore.deleteItemAsync(key);
    if (old) {
      const m = JSON.parse(old);
      await Promise.all(
        Array.from({ length: m.count }, (_, i) =>
          SecureStore.deleteItemAsync(`${key}.${m.generation}.${i}`),
        ),
      );
    }
  },
};
