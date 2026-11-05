export type Profile = {
  grade: 9 | 10 | 11 | 12;
  board: "CBSE" | "Custom";
  stream: string;
  subjects: string[];
  goals: string[];
  academicYear: string;
  examYear: number;
};
export const goals = ["JEE Main", "JEE Advanced", "NEET UG", "CUET UG"];
export const streams = [
  "Science PCM",
  "Science PCB",
  "Science PCMB",
  "Commerce",
  "Humanities",
  "Custom",
];
export function currentAcademicYear(date = new Date()) {
  const start =
    date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}
export function defaultSubjects(grade: number, stream: string): string[] {
  if (grade < 11)
    return ["English", "Mathematics", "Science", "Social Science"];
  if (stream === "Science PCM")
    return ["Physics", "Chemistry", "Mathematics", "English"];
  if (stream === "Science PCB")
    return ["Physics", "Chemistry", "Biology", "English"];
  if (stream === "Science PCMB")
    return ["Physics", "Chemistry", "Mathematics", "Biology", "English"];
  if (stream === "Commerce")
    return ["Accountancy", "Business Studies", "Economics", "English"];
  if (stream === "Humanities")
    return ["History", "Political Science", "English"];
  return ["English"];
}
export function validateProfile(p: Profile): string | null {
  if (![9, 10, 11, 12].includes(p.grade))
    return "Choose Class 9, 10, 11 or 12.";
  if (!["CBSE", "Custom"].includes(p.board)) return "Choose a board.";
  if (p.grade >= 11 && !streams.includes(p.stream)) return "Choose a stream.";
  if (
    !Array.isArray(p.subjects) ||
    !p.subjects.length ||
    p.subjects.length > 20 ||
    p.subjects.some((s) => !s.trim() || s.length > 80) ||
    new Set(p.subjects.map((s) => s.trim().toLowerCase())).size !==
      p.subjects.length
  )
    return "Choose 1–20 distinct school subjects.";
  if (new Set(p.subjects.map(subjectId)).size !== p.subjects.length)
    return "Use distinct subject names without ambiguous punctuation.";
  if (
    !/^\d{4}-\d{2}$/.test(p.academicYear) ||
    +p.academicYear.slice(5) !== (+p.academicYear.slice(0, 4) + 1) % 100
  )
    return "Use an academic year such as 2026-27.";
  if (!Number.isInteger(p.examYear) || p.examYear < 2020 || p.examYear > 2100)
    return "Enter a target exam year between 2020 and 2100.";
  if (!Array.isArray(p.goals) || p.goals.some((x) => !goals.includes(x)))
    return "Choose supported entrance goals.";
  return null;
}
export function subjectId(name: string) {
  return name.toLowerCase() === "mathematics"
    ? "maths"
    : name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
}
