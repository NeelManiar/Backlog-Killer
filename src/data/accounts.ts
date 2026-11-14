import { migrate, snapshot, type Snapshot } from "./motivation";
import { validateProfile, type Profile } from "./profile";
import type { Chapter, Session } from "./seed";
import type { Motivation } from "./motivation";
export type StudyData = {
  histories: Record<string, Snapshot[]>;
  schema: 3;
  chapters: Chapter[];
  sessions: Session[];
  motivation: Motivation;
  profile: Profile | null;
  sync: { revision: number; dirty: boolean };
};
export function migrateAccount(raw: any): StudyData {
  if (!raw) throw Error("Invalid study document");
  if (raw.schema && raw.schema !== 3) throw Error("Unsupported account schema");
  if (!raw || !Array.isArray(raw.chapters) || !Array.isArray(raw.sessions))
    throw Error("Invalid study document");
  if (
    raw.chapters.some(
      (c: any) =>
        !c ||
        typeof c.id !== "string" ||
        typeof c.subject !== "string" ||
        typeof c.title !== "string" ||
        !["pending", "active", "done"].includes(c.status) ||
        !Number.isFinite(c.minutes) ||
        c.minutes <= 0,
    )
  )
    throw Error("Invalid chapters");
  if (
    raw.sync &&
    (!Number.isInteger(raw.sync.revision) ||
      raw.sync.revision < 0 ||
      typeof raw.sync.dirty !== "boolean")
  )
    throw Error("Invalid sync metadata");
  const old = migrate(raw);
  if (raw.profile && validateProfile(raw.profile))
    throw Error("Invalid academic profile");
  return {
    ...old,
    histories: raw.histories ?? {},
    schema: 3,
    profile: raw.profile ?? null,
    chapters: old.chapters.map((c: Chapter) => ({
      ...c,
      origin: c.origin ?? "legacy",
    })),
    sync: raw.sync ?? { revision: 0, dirty: false },
  };
}
export function accountScope(userId?: string) {
  if (!userId) return "anonymous";
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId,
    )
  )
    throw Error("Invalid account ID");
  return `user-${userId}`;
}
export function syncDecision(dirty: boolean, base: number, remote: number) {
  if (remote < base) return "conflict";
  if (!dirty) return remote > base ? "pull" : "same";
  return base === remote ? "push" : "conflict";
}
export function importAnonymous(
  local: StudyData,
  anonymous: StudyData,
): StudyData {
  // Never overwrite an account chapter/session with a same-ID anonymous record.
  const duplicates = anonymous.chapters.filter((c) =>
    local.chapters.some(
      (x) => x.id === c.id && JSON.stringify(x) !== JSON.stringify(c),
    ),
  );
  if (
    anonymous.sessions.some((s) =>
      local.sessions.some(
        (x) => x.id === s.id && JSON.stringify(x) !== JSON.stringify(s),
      ),
    )
  )
    throw Error("Import has conflicting session IDs. No records were changed.");
  if (duplicates.length)
    throw Error("Import has colliding chapter IDs. No records were changed.");
  const chapters = [
    ...local.chapters,
    ...anonymous.chapters.filter(
      (c) => !local.chapters.some((x) => x.id === c.id),
    ),
  ];
  const sessions = [
    ...local.sessions,
    ...anonymous.sessions.filter(
      (s) => !local.sessions.some((x) => x.id === s.id),
    ),
  ];
  return {
    ...local,
    chapters,
    sessions,
    motivation: {
      ...local.motivation,
      earned: [
        ...new Set([
          ...local.motivation.earned,
          ...anonymous.motivation.earned,
        ]),
      ],
      stage: Math.max(local.motivation.stage, anonymous.motivation.stage),
    },
    sync: { ...local.sync, dirty: true },
  };
}

export function historyKey(profile: Profile | null, section: string) {
  return JSON.stringify([
    profile?.grade,
    profile?.board,
    profile?.academicYear,
    profile?.examYear,
    [...(profile?.subjects ?? [])].sort(),
    [...(profile?.goals ?? [])].sort(),
    section,
  ]);
}
