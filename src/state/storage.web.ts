// Keep SQLite and its WASM worker out of browser bundles; preserve the v1 key.
export async function storage(scope = "anonymous") {
  const key = scope === "anonymous" ? "bk-data" : `bk-data:${scope}`;
  return {
    clear: async () => {
      Object.keys(localStorage)
        .filter((k) => k === key || k.startsWith(`${key}-conflict-`))
        .forEach((k) => localStorage.removeItem(k));
    },
    read: async () => localStorage.getItem(key),
    write: async (data: string) => {
      localStorage.setItem(key, data);
    },
  };
}
