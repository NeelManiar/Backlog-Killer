import { openDatabaseAsync } from "expo-sqlite";
export async function storage() {
  const db = await openDatabaseAsync("bk.db");
  await db.execAsync(
    "CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL)",
  );
  return {
    read: async () =>
      (
        await db.getFirstAsync<{ data: string }>(
          "SELECT data FROM app_state WHERE id=1",
        )
      )?.data,
    write: async (s: string) => {
      await db.runAsync(
        "INSERT OR REPLACE INTO app_state (id,data) VALUES (1,?)",
        s,
      );
    },
  };
}
