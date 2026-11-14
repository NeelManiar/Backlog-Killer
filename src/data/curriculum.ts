import type { Profile } from "./profile";
import { subjectId } from "./profile";
import type { Chapter } from "./seed";
export type Curriculum = {
  id: string;
  kind: "school" | "entrance";
  authority: string;
  grade?: number;
  year: string;
  subject: string;
  subjectCode: string | null;
  sourceUrl: string;
  status: "verified" | "pending";
  verifiedAt: string | null;
  units: { id: string; title: string; progressKey: string }[];
};
// No guessed units: official destinations are currently denied by the environment proxy.
export const catalogs: Curriculum[] = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "English",
  "Biology",
  "Computer Science",
  "Physical Education",
].map((subject) => ({
  id: `cbse-12-2026-27-${subjectId(subject)}`,
  kind: "school",
  authority: "CBSE",
  grade: 12,
  year: "2026-27",
  subject,
  subjectCode: null,
  sourceUrl: "https://cbseacademic.nic.in/curriculum_2027.html",
  status: "pending",
  verifiedAt: null,
  units: [],
}));
export const examSources: Record<string, string> = {
  "JEE Main": "https://jeemain.nta.nic.in/",
  "JEE Advanced": "https://jeeadv.ac.in/",
  "NEET UG": "https://neet.nta.nic.in/",
  "CUET UG": "https://cuet.nta.nic.in/",
};
export function matches(
  c: Curriculum,
  p: Profile,
  kind: "school" | "entrance",
  authority?: string,
) {
  return (
    c.status === "verified" &&
    c.kind === kind &&
    c.year === (kind === "school" ? p.academicYear : String(p.examYear)) &&
    (kind === "school"
      ? c.authority === p.board &&
        c.grade === p.grade &&
        p.subjects.includes(c.subject)
      : p.goals.includes(c.authority) &&
        (!authority || c.authority === authority))
  );
}
export function curriculumChapters(p: Profile, source = catalogs): Chapter[] {
  const seen = new Set<string>();
  return source
    .filter((c) => matches(c, p, "school") || matches(c, p, "entrance"))
    .flatMap((c) =>
      c.units
        .filter((u) => !seen.has(u.progressKey) && !!seen.add(u.progressKey))
        .map((u) => ({
          id: u.progressKey,
          subject: subjectId(c.subject),
          title: u.title,
          status: "pending" as const,
          minutes: 25,
          planned: false,
          origin: "verified" as const,
          curriculumIds: source
            .filter(
              (other) =>
                (matches(other, p, "school") ||
                  matches(other, p, "entrance")) &&
                other.units.some((x) => x.progressKey === u.progressKey),
            )
            .map((x) => x.id),
        })),
    );
}
export function relevantChapters(
  chapters: Chapter[],
  p: Profile | null,
  section: string,
  source = catalogs,
) {
  if (!p || section === "archive") return chapters;
  return chapters.filter((c) => {
    if (c.origin === "custom")
      return section === "school"
        ? (!c.customSection || c.customSection === "school") &&
            p.subjects.some((s) => subjectId(s) === c.subject)
        : c.customSection === section && p.goals.includes(section);
    return (
      c.origin === "verified" &&
      c.curriculumIds?.some((id) =>
        source.some(
          (cat) =>
            cat.id === id &&
            matches(
              cat,
              p,
              section === "school" ? "school" : "entrance",
              section,
            ),
        ),
      )
    );
  });
}
