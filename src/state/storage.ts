import { openDatabaseAsync } from "expo-sqlite";
export async function storage(scope = "anonymous") {
  const db = await openDatabaseAsync("bk.db");
  await db.execAsync(
    "CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL)",
  );
  await db.execAsync(
    "CREATE TABLE IF NOT EXISTS app_scopes (scope TEXT PRIMARY KEY, data TEXT NOT NULL)",
  );
  if (scope !== "anonymous")
    return {
      read: async () =>
        (
          await db.getFirstAsync<{ data: string }>(
            "SELECT data FROM app_scopes WHERE scope=?",
            scope,
          )
        )?.data,
      write: async (s: string) => {
        await db.runAsync(
          "INSERT OR REPLACE INTO app_scopes(scope,data) VALUES (?,?)",
          scope,
          s,
        );
      },
      clear: async () => {
        await db.runAsync(
          "DELETE FROM app_scopes WHERE scope=? OR substr(scope,1,?)=?",
          scope,
          scope.length + 10,
          `${scope}-conflict-`,
        );
      },
    };
  return {
    clear: async () => {
      await db.runAsync("DELETE FROM app_state WHERE id=1");
    },
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
