import type { Chapter, Session } from "./seed";
export function coverage(chapters: Chapter[], subject?: string) {
  const list = chapters.filter((c) => !subject || c.subject === subject);
  return list.length
    ? Math.round(
        (list.filter((c) => c.status === "done").length / list.length) * 100,
      )
    : 0;
}
const dayKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
export function streak(sessions: Session[]) {
  const days = new Set(sessions.map((s) => dayKey(new Date(s.finishedAt))));
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(dayKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
export function activity(sessions: Session[]) {
  return Array.from({ length: 28 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 27 + i);
    return {
      date: date.toLocaleDateString("en-IN"),
      count: sessions.filter(
        (s) => dayKey(new Date(s.finishedAt)) === dayKey(date),
      ).length,
    };
  });
}
