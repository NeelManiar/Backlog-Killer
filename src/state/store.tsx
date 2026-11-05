import React, { createContext, useContext, useEffect, useState } from "react";
import { storage } from "./storage";
import { Chapter, Session, initialChapters } from "../data/seed";
import {
  Motivation,
  Focus,
  migrate,
  recordChapters,
  selectMissions,
  dayKey,
  remainingSeconds,
  pauseFocus,
  resumeFocus,
} from "../data/motivation";
type Data = {
  chapters: Chapter[];
  sessions: Session[];
  motivation: Motivation;
};
type Store = Data & {
  configure: (
    patch: Partial<Pick<Motivation, "availability" | "celebrations">>,
  ) => Promise<void>;
  planMissions: (availability: number) => Promise<void>;
  mission: (
    index: number,
    action: "done" | "skipped" | string,
  ) => Promise<void>;
  focusAction: (
    action: "start" | "pause" | "resume" | "end" | "finish",
    chapterId?: string,
    minutes?: number,
    mode?: "work" | "break",
  ) => Promise<void>;
  ready: boolean;
  error: string;
  update: (id: string, patch: Partial<Chapter>) => Promise<void>;
  add: (chapter: Chapter) => Promise<void>;
  log: (session: Session) => Promise<void>;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>(() =>
    migrate({ chapters: initialChapters, sessions: [] }),
  );
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
        const d = raw ? migrate(JSON.parse(raw)) : current.current;
        if (!raw || !JSON.parse(raw).motivation)
          await a.write(JSON.stringify(d));
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
          save((d) => {
            const chapters = d.chapters.map((c) =>
              c.id === id ? { ...c, ...patch } : c,
            );
            const completed =
              patch.status === "done" &&
              d.chapters.find((c) => c.id === id)?.status !== "done";
            return {
              ...d,
              chapters,
              motivation: recordChapters(
                d.motivation,
                chapters,
                completed ? id : undefined,
              ),
            };
          }),
        add: (c) =>
          save((d) => {
            const chapters = [...d.chapters, c];
            return {
              ...d,
              chapters,
              motivation: recordChapters(d.motivation, chapters),
            };
          }),
        configure: (patch) =>
          save((d) => ({ ...d, motivation: { ...d.motivation, ...patch } })),
        planMissions: (availability) =>
          save((d) => {
            const budget = Math.min(
              1440,
              Math.max(0, Math.floor(availability)),
            );
            if (!Number.isFinite(budget)) throw Error();
            return {
              ...d,
              motivation: {
                ...d.motivation,
                availability: budget,
                missionDay: dayKey(),
                missions: selectMissions(d.chapters, budget),
              },
            };
          }),
        mission: (index, action) =>
          save((d) => {
            const m = d.motivation;
            if (m.missionDay !== dayKey() || !m.missions[index]) return d;
            const item = m.missions[index];
            if (action === "done") {
              const chapters = d.chapters.map((c) =>
                c.id === item.chapterId ? { ...c, status: "done" as const } : c,
              );
              return {
                ...d,
                chapters,
                motivation: recordChapters(m, chapters, item.chapterId),
              };
            }
            const chapter = d.chapters.find(
              (c) => c.id === action && c.status !== "done",
            );
            const used = m.missions.reduce(
              (sum, x, i) =>
                sum + (i !== index && x.status !== "skipped" ? x.minutes : 0),
              0,
            );
            if (
              action !== "skipped" &&
              (!chapter ||
                chapter.minutes + used > m.availability ||
                m.missions.some(
                  (x, i) => i !== index && x.chapterId === action,
                ))
            )
              throw Error();
            return {
              ...d,
              motivation: {
                ...m,
                missions: m.missions.map((x, i) =>
                  i !== index
                    ? x
                    : action === "skipped"
                      ? { ...x, status: "skipped" }
                      : {
                          chapterId: action,
                          minutes: chapter!.minutes,
                          status: "pending",
                        },
                ),
              },
            };
          }),
        focusAction: (action, chapterId, minutes = 25, mode = "work") =>
          save((d) => {
            const f = d.motivation.focus;
            let focus: Focus | null = f;
            let sessions = d.sessions;
            if (action === "start") {
              if (
                f ||
                !d.chapters.some((c) => c.id === chapterId) ||
                !Number.isFinite(minutes) ||
                minutes < 1 ||
                minutes > 180
              )
                throw Error();
              focus = {
                id: `focus-${Date.now()}`,
                chapterId: chapterId!,
                duration: minutes * 60,
                remaining: minutes * 60,
                end: Date.now() + minutes * 60000,
                mode,
              };
            } else if (f) {
              if (action === "pause") focus = pauseFocus(f);
              if (action === "resume") focus = resumeFocus(f);
              if (
                action === "end" ||
                (action === "finish" && remainingSeconds(f) === 0)
              ) {
                const elapsed =
                  action === "finish"
                    ? f.duration
                    : f.duration - remainingSeconds(f);
                const chapter = d.chapters.find((c) => c.id === f.chapterId);
                if (
                  f.mode === "work" &&
                  elapsed > 0 &&
                  chapter &&
                  !sessions.some((s) => s.id === f.id)
                )
                  sessions = [
                    {
                      id: f.id,
                      subject: chapter.subject,
                      title: chapter.title,
                      minutes: Math.round((elapsed / 60) * 100) / 100,
                      finishedAt: new Date().toISOString(),
                    },
                    ...sessions,
                  ];
                focus = null;
              }
            }
            return { ...d, sessions, motivation: { ...d.motivation, focus } };
          }),
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
