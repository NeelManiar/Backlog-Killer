import React, { createContext, useContext, useEffect, useState } from "react";
import { storage } from "./storage";
import { Chapter, Session, initialChapters } from "../data/seed";
import {
  snapshot,
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
import { useAuth } from "../auth/context";
import {
  accountScope,
  migrateAccount,
  importAnonymous,
  syncDecision,
  historyKey,
  StudyData,
} from "../data/accounts";
import { Profile, subjectId, validateProfile } from "../data/profile";
import {
  curriculumChapters,
  relevantChapters,
  catalogs,
  matches,
} from "../data/curriculum";
import { readCloud, writeCloud } from "../cloud/sync";
import { subjects as legacySubjects } from "../data/seed";
type Data = StudyData;
type Store = Data & {
  allChapters: Chapter[];
  subjects: { id: string; name: string; color: string; days: number }[];
  section: string;
  setSection: (section: string) => void;
  setProfile: (profile: Profile) => Promise<void>;
  importLocal: () => Promise<void>;
  syncNow: (choice?: "device" | "cloud") => Promise<void>;
  conflict: boolean;
  syncMessage: string;
  clearCache: () => Promise<void>;
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
  const { session } = useAuth();
  const scope = accountScope(session?.user.id);
  const [section, setSection] = useState("school");
  const [conflict, setConflict] = useState(false);
  const conflictRevision = React.useRef<number | null>(null);
  const [syncMessage, setSyncMessage] = useState("");
  const [data, setData] = useState<Data>(() =>
    migrateAccount(
      migrate({
        chapters: scope === "anonymous" ? initialChapters : [],
        sessions: [],
      }),
    ),
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const adapter = React.useRef<Awaited<ReturnType<typeof storage>> | null>(
    null,
  );
  const current = React.useRef(data);
  const queue = React.useRef(Promise.resolve());
  const retired = React.useRef(false);
  useEffect(() => {
    let live = true;
    storage(scope)
      .then(async (a) => {
        const raw = await a.read();
        const d = raw ? migrateAccount(JSON.parse(raw)) : current.current;
        if (!raw || JSON.parse(raw).schema !== 3)
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
  const save = (
    change: (d: Data) => Data | Promise<Data>,
    markDirty = true,
  ) => {
    const job = queue.current
      .catch(() => {})
      .then(async () => {
        try {
          if (retired.current) throw Error("Account cache retired");
          const changed = await change(current.current);
          const key = historyKey(changed.profile, section);
          const history = changed.histories[key] ?? [
            snapshot(
              relevantChapters(
                current.current.chapters,
                changed.profile,
                section,
              ),
            ),
          ];
          const point = snapshot(
            relevantChapters(changed.chapters, changed.profile, section),
          );
          const last = history[history.length - 1];
          const next = {
            ...changed,
            histories: {
              ...changed.histories,
              [key]:
                last?.total === point.total && last?.done === point.done
                  ? history
                  : [...history, point],
            },
            sync: markDirty ? { ...changed.sync, dirty: true } : changed.sync,
          };
          if (!adapter.current) throw Error();
          await adapter.current.write(JSON.stringify(next));
          current.current = next;
          setData(next);
          setError("");
        } catch (error) {
          setError("Your change could not be saved. Please try again.");
          throw Error(error instanceof Error ? error.message : "Save failed");
        }
      });
    queue.current = job;
    return job;
  };
  const visible = relevantChapters(data.chapters, data.profile, section);
  const subjectNames =
    data.profile && section !== "archive"
      ? section === "school"
        ? data.profile.subjects
        : [
            ...new Set([
              ...catalogs
                .filter((c) => matches(c, data.profile!, "entrance", section))
                .map((c) => c.subject),
              ...data.chapters
                .filter(
                  (c) => c.origin === "custom" && c.customSection === section,
                )
                .map((c) => c.subject),
            ]),
          ]
      : [...new Set(data.chapters.map((c) => c.subject))].map(
          (id) => legacySubjects.find((x) => x.id === id)?.name ?? id,
        );
  const subjects = subjectNames.map((name) => ({
    id: subjectId(name),
    name,
    color:
      legacySubjects.find((x) => x.id === subjectId(name))?.color ?? "#b581ff",
    days: 0,
  }));
  return (
    <Context.Provider
      value={{
        ...data,
        chapters: visible,
        allChapters: data.chapters,
        sessions:
          data.profile && section !== "archive"
            ? data.sessions.filter(
                (s) => s.chapterId && visible.some((c) => c.id === s.chapterId),
              )
            : data.sessions,
        subjects,
        section,
        setSection: (next) => {
          setSection(next);
          void save((d) => {
            const key = historyKey(d.profile, next);
            const point = snapshot(
              relevantChapters(d.chapters, d.profile, next),
            );
            const history = d.histories[key] ?? [];
            const last = history[history.length - 1];
            return {
              ...d,
              histories: {
                ...d.histories,
                [key]:
                  last?.done === point.done && last?.total === point.total
                    ? history
                    : [...history, point],
              },
            };
          }).catch(() => {});
        },
        conflict,
        syncMessage,
        motivation:
          data.profile && section !== "archive"
            ? {
                ...data.motivation,
                history: data.histories[historyKey(data.profile, section)] ?? [
                  snapshot(visible),
                ],
              }
            : data.motivation,
        setProfile: (profile) =>
          save((d) => {
            const invalid = validateProfile(profile);
            if (invalid) throw Error(invalid);
            const generated = curriculumChapters(profile);
            const additions = generated.filter(
              (c) => !d.chapters.some((x) => x.id === c.id),
            );
            const linked = d.chapters.map((c) => {
              const match = generated.find((x) => x.id === c.id);
              return match && c.origin === "verified"
                ? {
                    ...c,
                    curriculumIds: [
                      ...new Set([
                        ...(c.curriculumIds ?? []),
                        ...(match.curriculumIds ?? []),
                      ]),
                    ],
                  }
                : c;
            });
            return {
              ...d,
              profile,
              chapters: [...linked, ...additions],
              motivation: d.motivation,
            };
          }),
        importLocal: () =>
          save(async (d) => {
            if (scope === "anonymous") throw Error("Sign in before importing.");
            const raw = await (await storage()).read();
            if (!raw) throw Error("No anonymous data found.");
            const source = migrateAccount(JSON.parse(raw));
            const merged = importAnonymous(d, source);
            if (!d.chapters.length && !d.sessions.length)
              return {
                ...source,
                profile: d.profile ?? source.profile,
                sync: { ...d.sync, dirty: true },
              };
            return merged;
          }),
        clearCache: async () => {
          retired.current = true;
          await queue.current.catch(() => {});
          await adapter.current?.clear();
        },
        syncNow: (choice) =>
          save(async (d) => {
            if (!session) throw Error("Sign in to sync.");
            setSyncMessage("Syncing…");
            const remote = await readCloud(session);
            const revision = remote?.revision ?? 0;
            const decision = syncDecision(
              d.sync.dirty,
              d.sync.revision,
              revision,
            );
            if (choice && conflictRevision.current !== revision) {
              conflictRevision.current = revision;
              setConflict(true);
              setSyncMessage(
                "Cloud changed since review. Sync again before choosing.",
              );
              return d;
            }
            if (decision === "conflict" && !choice) {
              conflictRevision.current = revision;
              setConflict(true);
              setSyncMessage(
                `Device: ${d.chapters.length} chapters, ${d.sessions.length} sessions. Cloud revision ${revision}: ${remote?.document.chapters.length ?? 0} chapters, ${remote?.document.sessions.length ?? 0} sessions. Choose a version; device data is backed up first.`,
              );
              return d;
            }
            if (choice === "cloud" && !remote)
              throw Error(
                "Cloud has no saved version. Keep this device or cancel.",
              );
            if (choice) {
              await (
                await storage(`${scope}-conflict-${Date.now()}`)
              ).write(JSON.stringify(d));
            }
            if (
              (choice === "cloud" || (!choice && decision === "pull")) &&
              remote
            ) {
              setConflict(false);
              setSyncMessage("Cloud version downloaded.");
              return { ...remote!.document, sync: { revision, dirty: false } };
            }
            if (choice === "device" || decision === "push" || !remote) {
              const nextRevision = await writeCloud(d, revision, session);
              setConflict(false);
              setSyncMessage("Synced.");
              return { ...d, sync: { revision: nextRevision, dirty: false } };
            }
            setSyncMessage("Up to date.");
            return d;
          }, false).catch((error) => {
            setSyncMessage(
              "Sync did not complete. Your device copy is retained.",
            );
            throw error;
          }),
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
            const chapters = [...d.chapters, { ...c, customSection: section }];
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
                missions: selectMissions(
                  relevantChapters(d.chapters, d.profile, section),
                  budget,
                ),
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
                      chapterId: chapter.id,
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
