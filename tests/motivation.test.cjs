const { test } = require("node:test");
const assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
const fs = require("node:fs");
const vm = require("node:vm");
const names = [
  "dayKey",
  "snapshot",
  "bossProgress",
  "selectMissions",
  "evolve",
  "remainingSeconds",
  "pauseFocus",
  "resumeFocus",
  "migrate",
  "recordChapters",
  "story",
  "studiedMinutes",
];
let source = stripTypeScriptTypes(
  fs.readFileSync("src/data/motivation.ts", "utf8"),
)
  .replaceAll("export function", "function")
  .replaceAll("export const", "const");
const context = { exports: {}, Date, Set };
vm.runInNewContext(
  source + "\n" + names.map((n) => `exports.${n} = ${n};`).join("\n"),
  context,
);
const m = context.exports;
const chapter = (id, minutes = 25, patch = {}) => ({
  id,
  minutes,
  subject: "physics",
  status: "pending",
  planned: false,
  title: id,
  ...patch,
});
test("migration preserves chapters, sessions, unknown fields and existing v2 progress", () => {
  const old = {
    chapters: [chapter("old", 20, { status: "done" })],
    sessions: [{ id: "saved" }],
    future: "retained",
  };
  const result = m.migrate(old, new Date("2026-11-05T00:00:00Z"));
  assert.equal(result.chapters, old.chapters);
  assert.equal(result.sessions, old.sessions);
  assert.equal(result.future, "retained");
  assert.equal(result.motivation.history[0].done, 1);
  assert.equal(result.motivation.earned.length, 0);
  assert.equal(m.migrate(result).motivation, result.motivation);
  assert.throws(() => m.migrate({ chapters: null, sessions: [] }));
  assert.throws(() => m.migrate({ ...old, motivation: { version: 3 } }));
});
test("missions respect availability, priority, pending work and limit", () => {
  const chapters = [
    chapter("done", 1, { status: "done" }),
    chapter("low", 10, { priority: 0 }),
    chapter("high", 30, { priority: 2 }),
    chapter("active", 15, { status: "active" }),
    chapter("short", 5),
    chapter("huge", 200),
  ];
  const selected = m.selectMissions(chapters, 45);
  assert.equal(selected.length, 2);
  assert.equal(selected[0].chapterId, "high");
  assert.equal(selected[1].chapterId, "active");
  for (let budget = 0; budget < 200; budget++) {
    const plan = m.selectMissions(chapters, budget);
    assert.ok(plan.length <= 3);
    assert.ok(plan.reduce((s, x) => s + x.minutes, 0) <= budget);
    assert.ok(plan.every((x) => x.chapterId !== "done"));
  }
  assert.equal(m.selectMissions(chapters, 0).length, 0);
  assert.equal(m.selectMissions([chapter("invalid", NaN)], 60).length, 0);
});
test("boss strength derives only from actual chapter status", () => {
  const result = m.bossProgress(
    [
      chapter("a"),
      chapter("b", 25, { status: "done" }),
      chapter("other", 10, { subject: "maths" }),
    ],
    "physics",
  );
  assert.equal(result.strength, 50);
  assert.equal(result.remaining, 1);
  assert.equal(result.total, 2);
  assert.equal(m.bossProgress([], "physics").strength, 0);
});
test("evolution is permanent, based on unique completions and never rewards reopening", () => {
  let state = m.migrate({ chapters: [], sessions: [] }).motivation;
  for (let i = 0; i < 3; i++)
    state = m.recordChapters(
      state,
      [chapter("x", 25, { status: "done" })],
      `c${i}`,
    );
  assert.equal(state.stage, 1);
  state = m.recordChapters(state, [], "c0");
  assert.equal(state.earned.length, 3);
  state = m.recordChapters(state, []);
  assert.equal(state.stage, 1);
  for (let i = 3; i < 10; i++) state = m.recordChapters(state, [], `c${i}`);
  assert.equal(state.stage, 2);
  assert.equal(m.evolve(2, []), 2);
});
test("focus survives serialized restart, pauses precisely, resumes, clamps at zero", () => {
  const focus = {
    id: "f",
    chapterId: "c",
    duration: 1500,
    remaining: 1500,
    end: 1501000,
    mode: "work",
  };
  const restored = JSON.parse(JSON.stringify(focus));
  assert.equal(m.remainingSeconds(restored, 601000), 900);
  const paused = m.pauseFocus(restored, 601000);
  assert.equal(paused.end, null);
  assert.equal(m.remainingSeconds(paused, 99999999), 900);
  const resumed = m.resumeFocus(paused, 9000000);
  assert.equal(m.remainingSeconds(resumed, 9300000), 600);
  assert.equal(m.remainingSeconds(resumed, 99999999), 0);
  assert.equal(restored.chapterId, "c");
});
test("story handles added and reopened chapters without invented completion dates", () => {
  const history = [
    { total: 10, done: 2 },
    { total: 10, done: 5 },
    { total: 14, done: 4 },
  ];
  assert.equal(m.story(history).reduction, -2);
  assert.equal(m.story(history).completedSince, 2);
  assert.equal(m.story([]).reduction, 0);
  assert.equal(
    m.studiedMinutes([
      { id: "demo-1", minutes: 25 },
      { id: "real", minutes: 12.5 },
    ]),
    12.5,
  );
});
test("chapter records sync mission completion and only add history for changed totals", () => {
  const chapters = [chapter("a")];
  let state = m.migrate({ chapters, sessions: [] }).motivation;
  state.missions = [{ chapterId: "a", minutes: 25, status: "pending" }];
  const completed = m.recordChapters(
    state,
    [{ ...chapters[0], status: "done" }],
    "a",
  );
  assert.equal(completed.missions[0].status, "done");
  assert.equal(completed.history.length, 2);
  assert.equal(
    m.recordChapters(completed, [{ ...chapters[0], status: "done" }]).history
      .length,
    2,
  );
});
