const { test } = require("node:test");
const assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
const fs = require("node:fs");
const vm = require("node:vm");
const output =
  stripTypeScriptTypes(
    fs.readFileSync("src/data/metrics.ts", "utf8"),
  ).replaceAll("export function", "function") +
  "\nexports.coverage = coverage; exports.streak = streak; exports.activity = activity;";
const context = { exports: {}, Date, Set };
vm.runInNewContext(output, context);
const { coverage, streak, activity } = context.exports;
test("coverage handles empty subjects and filters by subject", () => {
  assert.equal(coverage([]), 0);
  const chapters = [
    { subject: "a", status: "done" },
    { subject: "a", status: "pending" },
    { subject: "b", status: "done" },
  ];
  assert.equal(coverage(chapters, "a"), 50);
  assert.equal(coverage(chapters, "b"), 100);
  assert.equal(coverage(chapters), 67);
});
test("streak deduplicates sessions and stops at a missing day", () => {
  const date = new Date();
  const today = date.toISOString();
  date.setDate(date.getDate() - 1);
  const yesterday = date.toISOString();
  date.setDate(date.getDate() - 2);
  assert.equal(
    streak([
      { finishedAt: today },
      { finishedAt: today },
      { finishedAt: yesterday },
      { finishedAt: date.toISOString() },
    ]),
    2,
  );
  assert.equal(streak([]), 0);
});
test("activity includes 28 days and counts current sessions", () => {
  const cells = activity([{ finishedAt: new Date().toISOString() }]);
  assert.equal(cells.length, 28);
  assert.equal(cells[27].count, 1);
  assert.equal(
    cells.slice(0, 27).reduce((n, c) => n + c.count, 0),
    0,
  );
});
