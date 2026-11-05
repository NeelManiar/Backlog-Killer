// Keep SQLite and its WASM worker out of browser bundles; preserve the v1 key.
export async function storage() {
  return {
    read: async () => localStorage.getItem("bk-data"),
    write: async (data: string) => {
      localStorage.setItem("bk-data", data);
    },
  };
}
