const { test } = require("node:test");
const assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
const fs = require("node:fs");
const vm = require("node:vm");
function load(path, deps = {}) {
  const original = fs.readFileSync(path, "utf8");
  const names = [
    ...original.matchAll(/export (?:async )?(?:function|const) (\w+)/g),
  ].map((x) => x[1]);
  const source = stripTypeScriptTypes(original)
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replaceAll("export async function", "async function")
    .replaceAll("export function", "function")
    .replaceAll("export const", "const");
  const ctx = { exports: {}, ...deps };
  vm.runInNewContext(
    source + "\n" + names.map((n) => `exports.${n}=${n};`).join("\n"),
    ctx,
  );
  return ctx.exports;
}
const profile = load("src/data/profile.ts");
const motivation = load("src/data/motivation.ts");
const accounts = load("src/data/accounts.ts", { ...profile, ...motivation });
const catalog = load("src/data/curriculum.ts", profile);
const flows = load("src/auth/flows.ts");
const p = {
  grade: 12,
  board: "CBSE",
  stream: "Science PCM",
  subjects: ["Physics", "Chemistry", "Mathematics"],
  goals: ["JEE Main"],
  academicYear: "2026-27",
  examYear: 2027,
};
const chapter = {
  id: "old",
  subject: "physics",
  title: "Saved chapter",
  status: "active",
  minutes: 25,
  planned: true,
};
const data = () =>
  accounts.migrateAccount(
    motivation.migrate({ chapters: [chapter], sessions: [] }),
  );
test("OTP uses provider registration/login and normalizes request errors", async () => {
  const calls = [];
  const auth = {
    signInWithOtp: async (x) => {
      calls.push(x);
      return { error: { message: "email does not exist" } };
    },
    verifyOtp: async (x) => {
      calls.push(x);
      return { error: null };
    },
  };
  const result = await flows.requestCode(
    auth,
    "student@example.com",
    true,
    1000,
    0,
  );
  assert.equal(result.message, flows.REQUEST_MESSAGE);
  assert.equal(calls[0].options.shouldCreateUser, true);
  await flows.requestCode(auth, "student@example.com", false, 70000, 61000);
  assert.equal(calls[1].options.shouldCreateUser, false);
  await flows.verifyCode(auth, "student@example.com", "provider-code");
  assert.equal(calls[2].token, "provider-code");
  assert.equal(calls[2].type, "email");
  await assert.rejects(
    () => flows.requestCode(auth, "student@example.com", false, 1000, 61000),
    /wait/,
  );
  await assert.rejects(
    () =>
      flows.verifyCode(
        { ...auth, verifyOtp: async () => ({ error: {} }) },
        "student@example.com",
        "bad",
      ),
    /could not be verified/,
  );
});
test("onboarding supports grades, PCM PCB PCMB and optional subjects", () => {
  assert.equal(profile.validateProfile(p), null);
  assert.ok(profile.defaultSubjects(12, "Science PCM").includes("Mathematics"));
  assert.ok(!profile.defaultSubjects(12, "Science PCM").includes("Biology"));
  assert.ok(profile.defaultSubjects(11, "Science PCB").includes("Biology"));
  assert.ok(
    !profile.defaultSubjects(11, "Science PCB").includes("Mathematics"),
  );
  assert.ok(
    profile.defaultSubjects(12, "Science PCMB").includes("Mathematics"),
  );
  assert.ok(profile.defaultSubjects(12, "Science PCMB").includes("Biology"));
  assert.equal(
    profile.validateProfile({
      ...p,
      subjects: [...p.subjects, "Computer Science"],
    }),
    null,
  );
  assert.ok(profile.validateProfile({ ...p, subjects: [] }));
  assert.ok(profile.validateProfile({ ...p, academicYear: "2026-28" }));
  assert.equal(profile.currentAcademicYear(new Date(2026, 10, 5)), "2026-27");
});
test("verified catalogs strictly isolate grade, year, board and entrance authority", () => {
  const school = {
    id: "school",
    kind: "school",
    authority: "CBSE",
    grade: 12,
    year: "2026-27",
    subject: "Physics",
    status: "verified",
    units: [{ id: "unit", title: "Fixture only", progressKey: "shared-topic" }],
  };
  assert.ok(catalog.matches(school, p, "school"));
  for (const patch of [
    { grade: 11 },
    { year: "2025-26" },
    { authority: "Custom" },
    { status: "pending" },
    { kind: "entrance" },
  ])
    assert.ok(!catalog.matches({ ...school, ...patch }, p, "school"));
  const exam = {
    ...school,
    id: "exam",
    kind: "entrance",
    authority: "JEE Main",
    year: "2027",
  };
  assert.ok(catalog.matches(exam, p, "entrance", "JEE Main"));
  assert.ok(!catalog.matches(exam, p, "school"));
  assert.ok(!catalog.matches({ ...exam, year: "2026" }, p, "entrance"));
  assert.equal(catalog.curriculumChapters(p, [school, exam]).length, 1);
  assert.equal(
    catalog.curriculumChapters(p, [school, exam])[0].curriculumIds.length,
    2,
  );
  assert.equal(
    catalog.curriculumChapters(p).length,
    0,
    "Unverified production catalog must not invent chapters",
  );
});
test("profile changes hide legacy topics without deleting progress; custom labels stay explicit", () => {
  const chapters = [
    chapter,
    { ...chapter, id: "custom", origin: "custom" },
    {
      ...chapter,
      id: "verified",
      origin: "verified",
      curriculumIds: ["no-match"],
    },
  ];
  assert.equal(catalog.relevantChapters(chapters, p, "school").length, 1);
  assert.equal(catalog.relevantChapters(chapters, p, "archive").length, 3);
  assert.equal(
    catalog.relevantChapters(
      chapters,
      { ...p, subjects: ["Biology"] },
      "school",
    ).length,
    0,
  );
  assert.equal(chapters.length, 3);
});
test("v2 migration preserves all chapter fields, sessions, earned evolution and unknown metadata", () => {
  const old = motivation.migrate({
    chapters: [chapter],
    sessions: [{ id: "session", minutes: 25 }],
  });
  old.motivation.stage = 2;
  old.extra = "retain";
  const next = accounts.migrateAccount(old);
  assert.equal(next.schema, 3);
  assert.equal(next.extra, "retain");
  assert.equal(next.chapters[0].id, chapter.id);
  assert.equal(next.chapters[0].status, "active");
  assert.equal(next.motivation.stage, 2);
  assert.equal(next.sessions, old.sessions);
  assert.throws(() => accounts.migrateAccount({ ...old, schema: 4 }));
});
test("anonymous import never overwrites collisions and is idempotent", () => {
  const empty = accounts.migrateAccount(
    motivation.migrate({ chapters: [], sessions: [] }),
  );
  const local = data();
  const imported = accounts.importAnonymous(empty, local);
  assert.equal(imported.chapters.length, 1);
  assert.ok(imported.sync.dirty);
  assert.equal(accounts.importAnonymous(imported, local).chapters.length, 1);
  assert.throws(
    () =>
      accounts.importAnonymous(imported, {
        ...local,
        chapters: [
          { ...chapter, title: "Conflicting change", origin: "legacy" },
        ],
      }),
    /colliding/,
  );
  assert.equal(local.chapters[0].title, "Saved chapter");
});
test("sync decisions detect divergent and deleted cloud revisions", () => {
  assert.equal(accounts.syncDecision(true, 1, 1), "push");
  assert.equal(accounts.syncDecision(false, 1, 2), "pull");
  assert.equal(accounts.syncDecision(true, 1, 2), "conflict");
  assert.equal(accounts.syncDecision(false, 2, 0), "conflict");
  assert.equal(accounts.syncDecision(false, 2, 2), "same");
});
test("account storage separates A/B/anonymous and deletes only one account and its backups", async () => {
  const map = new Map();
  const localStorage = {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
      localStorage[k] = v;
    },
    removeItem: (k) => {
      map.delete(k);
      delete localStorage[k];
    },
  };
  const { storage } = load("src/state/storage.web.ts", { localStorage });
  const a = accounts.accountScope("11111111-1111-1111-1111-111111111111");
  const b = accounts.accountScope("22222222-2222-2222-2222-222222222222");
  const anon = await storage();
  const aa = await storage(a);
  const bb = await storage(b);
  const backup = await storage(`${a}-conflict-1`);
  await anon.write("anonymous");
  await aa.write("A");
  await bb.write("B");
  await backup.write("backup");
  assert.equal(await aa.read(), "A");
  assert.equal(await bb.read(), "B");
  assert.equal(await anon.read(), "anonymous");
  await aa.clear();
  assert.equal(await aa.read(), null);
  assert.equal(await backup.read(), null);
  assert.equal(await bb.read(), "B");
  assert.equal(await anon.read(), "anonymous");
  assert.throws(() => accounts.accountScope("../other"));
});
test("native session persistence uses only SecureStore, supports large values and deletes chunks", async () => {
  const values = new Map();
  const SecureStore = {
    getItemAsync: async (k) => values.get(k) ?? null,
    setItemAsync: async (k, v) => {
      values.set(k, v);
    },
    deleteItemAsync: async (k) => {
      values.delete(k);
    },
  };
  const { tokenStorage } = load("src/auth/tokenStorage.ts", { SecureStore });
  const synthetic = "test-session-".repeat(600);
  await tokenStorage.setItem("test-auth", synthetic);
  assert.equal(await tokenStorage.getItem("test-auth"), synthetic);
  assert.ok([...values.values()].every((v) => v.length <= 400));
  await tokenStorage.setItem("test-auth", "replacement");
  assert.equal(await tokenStorage.getItem("test-auth"), "replacement");
  await tokenStorage.removeItem("test-auth");
  assert.equal(values.size, 0);
  assert.equal(await tokenStorage.getItem("test-auth"), null);
});

test("delayed sync keeps the initiating JWT after another account signs in", async () => {
  const { createClient } = require("@supabase/supabase-js");
  const requests = [];
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const { studyClient } = load("src/auth/client.ts", {
    process: { env: {
      EXPO_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_fixture_only",
    } },
    tokenStorage: {},
    processLock: async (_name, _timeout, fn) => fn(),
    createClient: (url, key, options) => !options.accessToken ? {} : createClient(url, key, {
      ...options,
      global: { fetch: async (url, options) => {
        requests.push({ url: String(url), authorization: new Headers(options.headers).get("authorization") });
        if (requests.length === 1) await pending;
        return new Response(JSON.stringify(String(url).includes("save_study") ? 1 : null), {
          status: 200, headers: { "content-type": "application/json" },
        });
      } },
    }),
  });
  const sync = load("src/cloud/sync.ts", { studyClient, migrateAccount: accounts.migrateAccount });
  let currentSession = { access_token: "account-a-test-token" };
  const initiatingSession = currentSession;
  const read = sync.readCloud(initiatingSession);
  currentSession = { access_token: "account-b-test-token" };
  release();
  await read;
  await sync.writeCloud(data(), 0, initiatingSession);
  assert.equal(requests.length, 2);
  assert.ok(requests.every(r => r.authorization === "Bearer account-a-test-token"));
  assert.notEqual(initiatingSession.access_token, currentSession.access_token);
});
