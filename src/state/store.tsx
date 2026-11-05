import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { openDatabaseAsync } from "expo-sqlite";
import {
  Chapter,
  Session,
  initialChapters,
  initialSessions,
} from "../data/seed";
type Data = { chapters: Chapter[]; sessions: Session[] };
type Store = Data & {
  ready: boolean;
  error: string;
  update: (id: string, patch: Partial<Chapter>) => Promise<void>;
  add: (chapter: Chapter) => Promise<void>;
  log: (session: Session) => Promise<void>;
};
const Context = createContext<Store | null>(null);
async function storage() {
  if (Platform.OS === "web")
    return {
      read: async () => localStorage.getItem("bk-data"),
      write: async (s: string) => {
        localStorage.setItem("bk-data", s);
      },
    };
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
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>({
    chapters: initialChapters,
    sessions: initialSessions,
  });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const adapter = React.useRef<Awaited<ReturnType<typeof storage>> | null>(
    null,
  );
  const current = React.useRef(data);
  const queue = React.useRef(Promise.resolve());
  useEffect(() => {
    let live = true;
    storage()
      .then(async (a) => {
        const raw = await a.read();
        const d = raw ? (JSON.parse(raw) as Data) : current.current;
        if (!raw) await a.write(JSON.stringify(d));
        if (live) {
          adapter.current = a;
          current.current = d;
          setData(d);
          setReady(true);
        }
      })
      .catch(() => {
        if (live)
          setError("Could not open local storage. Restart the app to retry.");
      });
    return () => {
      live = false;
    };
  }, []);
  const save = (change: (d: Data) => Data) => {
    const job = queue.current
      .catch(() => {})
      .then(async () => {
        try {
          const next = change(current.current);
          if (!adapter.current) throw Error();
          await adapter.current.write(JSON.stringify(next));
          current.current = next;
          setData(next);
          setError("");
        } catch {
          setError("Your change could not be saved. Please try again.");
          throw Error("Save failed");
        }
      });
    queue.current = job;
    return job;
  };
  return (
    <Context.Provider
      value={{
        ...data,
        ready,
        error,
        update: (id, patch) =>
          save((d) => ({
            ...d,
            chapters: d.chapters.map((c) =>
              c.id === id ? { ...c, ...patch } : c,
            ),
          })),
        add: (c) => save((d) => ({ ...d, chapters: [...d.chapters, c] })),
        log: (s) => save((d) => ({ ...d, sessions: [s, ...d.sessions] })),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw Error("Missing StoreProvider");
  return value;
}
