import type { Chapter, Session } from "./seed";
export type Mission = {
  chapterId: string;
  minutes: number;
  status: "pending" | "done" | "skipped";
};
export type Focus = {
  id: string;
  chapterId: string;
  duration: number;
  remaining: number;
  end: number | null;
  mode: "work" | "break";
};
export type Snapshot = { at: string; total: number; done: number };
export type Motivation = {
  version: 2;
  availability: number;
  missionDay: string;
  missions: Mission[];
  focus: Focus | null;
  earned: string[];
  stage: number;
  history: Snapshot[];
  celebrations: boolean;
};
export const dayKey = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
export function snapshot(chapters: Chapter[], now = new Date()): Snapshot {
  return {
    at: now.toISOString(),
    total: chapters.length,
    done: chapters.filter((c) => c.status === "done").length,
  };
}
export function bossProgress(chapters: Chapter[], subject: string) {
  const list = chapters.filter((c) => c.subject === subject);
  const remaining = list.filter((c) => c.status !== "done").length;
  return {
    remaining,
    total: list.length,
    strength: list.length ? Math.round((remaining / list.length) * 100) : 0,
  };
}
export function selectMissions(
  chapters: Chapter[],
  availability: number,
): Mission[] {
  let budget = Math.max(0, Math.floor(availability));
  const selected: Mission[] = [];
  const score = (c: Chapter) =>
    (c.priority ?? 1) * 10 +
    (c.planned ? 3 : 0) +
    (c.status === "active" ? 2 : 0);
  for (const c of chapters
    .filter((c) => c.status !== "done")
    .sort(
      (a, b) =>
        score(b) - score(a) ||
        a.minutes - b.minutes ||
        a.id.localeCompare(b.id),
    )) {
    if (selected.length === 3) break;
    if (!Number.isFinite(c.minutes) || c.minutes <= 0 || c.minutes > budget)
      continue;
    selected.push({ chapterId: c.id, minutes: c.minutes, status: "pending" });
    budget -= c.minutes;
  }
  return selected;
}
export function evolve(previous: number, earned: string[]) {
  return Math.max(
    previous,
    earned.length >= 10 ? 2 : earned.length >= 3 ? 1 : 0,
  );
}
export function remainingSeconds(focus: Focus, now = Date.now()) {
  return focus.end === null
    ? focus.remaining
    : Math.max(0, Math.ceil((focus.end - now) / 1000));
}
export function pauseFocus(focus: Focus, now = Date.now()): Focus {
  return { ...focus, remaining: remainingSeconds(focus, now), end: null };
}
export function resumeFocus(focus: Focus, now = Date.now()): Focus {
  return { ...focus, end: now + focus.remaining * 1000 };
}
export function migrate(
  data: { chapters: Chapter[]; sessions: Session[]; motivation?: Motivation },
  now = new Date(),
) {
  if (!Array.isArray(data.chapters) || !Array.isArray(data.sessions))
    throw Error("Invalid stored data");
  if (data.motivation && data.motivation.version !== 2)
    throw Error("Unsupported data version");
  return {
    ...data,
    motivation: data.motivation ?? {
      version: 2 as const,
      availability: 60,
      missionDay: "",
      missions: [],
      focus: null,
      earned: [],
      stage: 0,
      history: [snapshot(data.chapters, now)],
      celebrations: true,
    },
  };
}
export function recordChapters(
  m: Motivation,
  chapters: Chapter[],
  completedId?: string,
): Motivation {
  const earned = completedId
    ? [...new Set([...m.earned, completedId])]
    : m.earned;
  const next = snapshot(chapters);
  const last = m.history[m.history.length - 1];
  return {
    ...m,
    earned,
    stage: evolve(m.stage, earned),
    missions: m.missions.map((x) =>
      chapters.find((c) => c.id === x.chapterId)?.status === "done"
        ? { ...x, status: "done" }
        : x,
    ),
    history:
      last?.total === next.total && last?.done === next.done
        ? m.history
        : [...m.history, next],
  };
}
export function story(history: Snapshot[]) {
  const first = history[0],
    last = history[history.length - 1];
  return {
    reduction:
      first && last ? first.total - first.done - (last.total - last.done) : 0,
    completedSince: first && last ? last.done - first.done : 0,
  };
}
export function studiedMinutes(sessions: Session[]) {
  return sessions
    .filter((s) => !s.id.startsWith("demo-"))
    .reduce((sum, s) => sum + s.minutes, 0);
}
