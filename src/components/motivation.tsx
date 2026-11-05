import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  AppState,
  View,
  Text,
  TextInput,
} from "react-native";
import { Card, Heading, Label, Bar, Button, colors, s } from "./ui";
import { useStore } from "../state/store";
import {
  bossProgress,
  dayKey,
  story,
  studiedMinutes,
} from "../data/motivation";

// Original geometric paper sculptures: no external character assets.
export function Character({
  kind,
  stage = 0,
}: {
  kind: string;
  stage?: number;
}) {
  const color =
    kind === "physics"
      ? "#3b82f6"
      : kind === "chemistry"
        ? "#f5a000"
        : kind === "maths"
          ? "#10b981"
          : "#b581ff";
  const pieces =
    kind === "physics"
      ? 3
      : kind === "chemistry"
        ? 5
        : kind === "maths"
          ? 4
          : stage + 2;
  return (
    <View
      accessible
      accessibilityLabel={
        kind === "companion"
          ? `Vellum, stage ${stage + 1}`
          : `${kind} folded backlog sculpture`
      }
      style={{
        height: 80,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 4,
      }}
    >
      {Array.from({ length: pieces }, (_, i) => (
        <View
          key={i}
          style={{
            width: kind === "maths" ? 22 : 15 + i * 5,
            height: 24 + (i % 3) * 14 + stage * 5,
            backgroundColor: color,
            borderRadius: kind === "chemistry" ? 20 : 3,
            transform: [
              {
                rotate: `${kind === "physics" ? i * 20 - 20 : kind === "companion" ? (i % 2 ? 18 : -18) : 0}deg`,
              },
            ],
            borderWidth: 2,
            borderColor: "#e4dbff",
          }}
        />
      ))}
    </View>
  );
}
export function Celebration({ text }: { text: string }) {
  const { motivation } = useStore();
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => sub.remove();
  }, []);
  // Static and dismissible, including with reduced motion: no flashing or looping motion.
  const [dismissed, setDismissed] = useState(false);
  if (!motivation.celebrations || dismissed) return null;
  return (
    <Card>
      <Text
        accessibilityLiveRegion="polite"
        style={{ color: colors.green, fontSize: 18 }}
      >
        {reduced ? "✓" : "✧"} {text}
      </Text>
      <Button secondary title="Continue" onPress={() => setDismissed(true)} />
    </Card>
  );
}
export function Boss({ subject }: { subject: string }) {
  const { chapters } = useStore();
  const b = bossProgress(chapters, subject);
  const [previous, setPrevious] = useState(b.remaining);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (previous > 0 && b.remaining === 0) setCelebrate(true);
    if (b.remaining > 0) setCelebrate(false);
    setPrevious(b.remaining);
  }, [b.remaining, previous]);
  const name =
    subject === "physics"
      ? "Torque Cairn"
      : subject === "chemistry"
        ? "Mottle Stack"
        : "Lattice Fold";
  return (
    <>
      <Card>
        <Heading>{name}</Heading>
        <Character kind={subject} />
        <Label>
          {b.total
            ? `${b.remaining} of ${b.total} chapters remain · ${b.strength}% backlog strength`
            : "Add chapters to shape this backlog."}
        </Label>
        <Bar value={b.strength} color={colors.purple} />
        <Label>
          {b.total > 0 && b.remaining === 0
            ? "Subject complete. Space for your next goal."
            : "Every completed chapter makes this backlog lighter."}
        </Label>
      </Card>
      {celebrate && <Celebration text="Subject complete. You did the work!" />}
    </>
  );
}
export function Companion() {
  const { motivation } = useStore();
  const names = ["Fold", "Fan", "Canopy"];
  return (
    <Card>
      <Heading>Vellum · {names[motivation.stage]}</Heading>
      <Character kind="companion" stage={motivation.stage} />
      <Label>
        {motivation.earned.length} unique chapters completed since v0.2 tracking
        began.
      </Label>
      <Label>
        {motivation.stage === 2
          ? "Canopy reached. Your progress stays with you."
          : `${motivation.stage === 0 ? 3 : 10} unique chapter completions grow the next form. No daily upkeep.`}
      </Label>
    </Card>
  );
}
export function Missions() {
  const store = useStore();
  const { motivation: m, chapters } = store;
  const [availability, setAvailability] = useState(String(m.availability));
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [today, setToday] = useState(dayKey());
  useEffect(() => {
    const tick = () => setToday(dayKey());
    const timer = setInterval(tick, 30000);
    const sub = AppState.addEventListener("change", tick);
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);
  const act = (job: Promise<void>) => {
    void job
      .then(() => setNotice("Saved."))
      .catch(() =>
        setNotice("Could not save. Check your available time and retry."),
      );
  };
  const current = m.missionDay === today;
  return (
    <Card>
      <Heading>Daily missions</Heading>
      <Label>
        Available study minutes today (0–1440). Suggestions use whole chapter
        estimates and priorities. No missed-day penalties.
      </Label>
      <TextInput
        accessibilityLabel="Available study minutes"
        keyboardType="number-pad"
        style={s.input}
        value={availability}
        onChangeText={setAvailability}
      />
      <Button
        title={
          current ? "Replace today’s suggestions" : "Suggest today’s missions"
        }
        disabled={!/^\d+$/.test(availability) || +availability > 1440}
        onPress={() => {
          setEditing(null);
          act(store.planMissions(+availability));
        }}
      />
      {current && (
        <Label>
          {m.missions
            .filter((x) => x.status !== "skipped")
            .reduce((n, x) => n + x.minutes, 0)}{" "}
          / {m.availability} minutes planned
        </Label>
      )}
      {current && !m.missions.length && (
        <Label>
          No whole chapter fits. Adjust your availability or chapter estimate; a
          short focus session is also useful.
        </Label>
      )}
      {current &&
        m.missions.map((mission, i) => {
          const chapter = chapters.find((c) => c.id === mission.chapterId);
          const used = m.missions.reduce(
            (sum, x, j) =>
              sum + (j !== i && x.status !== "skipped" ? x.minutes : 0),
            0,
          );
          return (
            <View
              key={`${i}-${mission.chapterId}`}
              style={{
                gap: 8,
                borderTopWidth: 1,
                borderColor: colors.border,
                paddingTop: 12,
              }}
            >
              <Label color={colors.text}>
                {chapter?.title ?? "Chapter unavailable"} · {mission.minutes}m ·{" "}
                {mission.status}
              </Label>
              {mission.status === "pending" && (
                <>
                  <Button
                    title="Mark chapter complete"
                    onPress={() => act(store.mission(i, "done"))}
                  />
                  <Button
                    secondary
                    title="Skip mission"
                    onPress={() => act(store.mission(i, "skipped"))}
                  />
                </>
              )}
              {mission.status !== "done" && (
                <Button
                  secondary
                  title={
                    editing === i
                      ? "Close adjustment"
                      : "Choose another chapter"
                  }
                  onPress={() => setEditing(editing === i ? null : i)}
                />
              )}
              {editing === i &&
                chapters
                  .filter(
                    (c) =>
                      c.status !== "done" &&
                      c.minutes + used <= m.availability &&
                      !m.missions.some(
                        (x, j) => j !== i && x.chapterId === c.id,
                      ),
                  )
                  .map((c) => (
                    <Button
                      key={c.id}
                      secondary
                      title={`${c.title} · ${c.minutes}m`}
                      onPress={() => {
                        act(store.mission(i, c.id));
                        setEditing(null);
                      }}
                    />
                  ))}
            </View>
          );
        })}
      <Label>{notice}</Label>
    </Card>
  );
}
export function ComebackStory() {
  const { motivation: m, sessions, chapters } = useStore();
  const totals = story(m.history);
  return (
    <Card>
      <Heading>Your comeback story</Heading>
      <Label>
        History starts {new Date(m.history[0].at).toLocaleDateString()}. Earlier
        completion dates are unknown.
      </Label>
      <Label>
        {totals.reduction >= 0
          ? `${totals.reduction} fewer pending chapters`
          : `${-totals.reduction} more pending chapters`}{" "}
        since baseline (includes added/reopened chapters).
      </Label>
      <Label>
        {chapters.filter((c) => c.status === "done").length} chapters currently
        complete · {m.earned.length} unique chapters completed since tracking
        began.
      </Label>
      <Label>
        {studiedMinutes(sessions).toFixed(1)} minutes recorded in focus
        sessions. Time studied does not imply chapter completion. Demo sessions
        excluded.
      </Label>
      {m.history.slice(-7).map((point, i) => (
        <View key={`${point.at}-${i}`} style={{ gap: 6 }}>
          <Label>
            {new Date(point.at).toLocaleString()} · {point.total - point.done}{" "}
            pending · {point.done} complete / {point.total}
          </Label>
          <Bar
            value={point.total ? (point.done / point.total) * 100 : 0}
            color={colors.green}
          />
        </View>
      ))}
      <Label>
        Milestones:{" "}
        {m.earned.length >= 3
          ? "3 unique completions reached"
          : `${m.earned.length}/3 unique completions`}
        {m.earned.length >= 10 ? " · 10 unique completions reached" : ""}.
        Evolution stays earned even if chapters reopen.
      </Label>
    </Card>
  );
}
