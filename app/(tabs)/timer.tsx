import { useEffect, useRef, useState } from "react";
import { AppState, Text, TextInput, View } from "react-native";
import {
  Page,
  Title,
  Heading,
  Card,
  Label,
  Button,
  s,
  colors,
} from "../../src/components/ui";
import { Celebration } from "../../src/components/motivation";
import { useStore } from "../../src/state/store";
import { remainingSeconds } from "../../src/data/motivation";
export default function Timer() {
  const { chapters, sessions, motivation, focusAction } = useStore();
  const focus = motivation.focus;
  const [chapterId, setChapterId] = useState(
    chapters.find((c) => c.status !== "done")?.id ?? chapters[0]?.id ?? "",
  );
  const [minutes, setMinutes] = useState("25");
  const [mode, setMode] = useState<"work" | "break">("work");
  const [now, setNow] = useState(Date.now());
  const [notice, setNotice] = useState("");
  const [celebrated, setCelebrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const finishing = useRef(false);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, 500);
    const sub = AppState.addEventListener("change", tick);
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);
  const remaining = focus
    ? remainingSeconds(focus, now)
    : Math.max(0, (+minutes || 0) * 60);
  useEffect(() => {
    if (!focus || remaining > 0 || finishing.current) return;
    finishing.current = true;
    void focusAction("finish")
      .then(() => {
        setNotice(
          focus.mode === "work"
            ? "Focus session saved. Mark your chapter complete only when the work is done."
            : "Break complete.",
        );
        setCelebrated(true);
      })
      .catch(() => setNotice("Could not save. Tap Finish to retry."))
      .finally(() => {
        finishing.current = false;
      });
  }, [focus?.id, remaining]);
  const act = (action: "start" | "pause" | "resume" | "end" | "finish") => {
    setBusy(true);
    setCelebrated(false);
    void focusAction(action, chapterId, +minutes, mode)
      .then(() => {
        setNow(Date.now());
        setNotice(
          action === "end"
            ? "Session ended. Elapsed study time saved; chapter status unchanged."
            : "",
        );
      })
      .catch(() => setNotice("Could not save. Please retry."))
      .finally(() => setBusy(false));
  };
  return (
    <Page>
      <Title>Focus Timer</Title>
      <Label>
        Select a chapter. Timers survive backgrounding and restarts; chapters
        are completed separately.
      </Label>
      {!focus && (
        <>
          <View style={s.row}>
            <Button
              title="Work"
              secondary={mode !== "work"}
              onPress={() => {
                setMode("work");
                setMinutes("25");
              }}
            />
            <Button
              title="Break"
              secondary={mode !== "break"}
              onPress={() => {
                setMode("break");
                setMinutes("5");
              }}
            />
          </View>
          <Label>Duration in minutes (1–180)</Label>
          <TextInput
            style={s.input}
            accessibilityLabel="Focus duration in minutes"
            keyboardType="number-pad"
            value={minutes}
            onChangeText={setMinutes}
          />
          <Heading>Study chapter</Heading>
          {chapters
            .filter((c) => c.status !== "done")
            .map((c) => (
              <Button
                key={c.id}
                secondary={c.id !== chapterId}
                title={`${c.title}${c.id === chapterId ? " · Selected" : ""}`}
                onPress={() => setChapterId(c.id)}
              />
            ))}
        </>
      )}
      <Card>
        <Label>
          {focus
            ? chapters.find((c) => c.id === focus.chapterId)?.title
            : chapters.find((c) => c.id === chapterId)?.title}
        </Label>
        <Text
          style={{
            color: colors.text,
            fontSize: 54,
            fontWeight: "800",
            textAlign: "center",
            fontVariant: ["tabular-nums"],
          }}
          accessibilityLabel={`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds`}
        >
          {String(Math.floor(remaining / 60)).padStart(2, "0")}:
          {String(remaining % 60).padStart(2, "0")}
        </Text>
        <Label>
          {focus
            ? `${focus.mode} · ${focus.end === null ? "Paused" : remaining === 0 ? "Complete" : "Running"}`
            : mode}
        </Label>
        {!focus ? (
          <Button
            title="Start session"
            disabled={
              busy ||
              !chapterId ||
              !/^\d+$/.test(minutes) ||
              +minutes < 1 ||
              +minutes > 180
            }
            onPress={() => act("start")}
          />
        ) : (
          <>
            <Button
              title={
                remaining === 0
                  ? "Finish"
                  : focus.end === null
                    ? "Resume"
                    : "Pause"
              }
              disabled={busy}
              onPress={() =>
                act(
                  remaining === 0
                    ? "finish"
                    : focus.end === null
                      ? "resume"
                      : "pause",
                )
              }
            />
            <Button
              secondary
              title="End session"
              disabled={busy}
              onPress={() => act("end")}
            />
          </>
        )}
      </Card>
      {notice ? <Label>{notice}</Label> : null}
      {celebrated && (
        <Celebration text="A useful step forward. Take a breath." />
      )}
      <Heading>Recent sessions</Heading>
      {sessions.slice(0, 10).map((session) => (
        <Card key={session.id}>
          <Heading>{session.title}</Heading>
          <Label>
            {session.minutes} minutes ·{" "}
            {session.id.startsWith("demo-")
              ? "Demo session"
              : new Date(session.finishedAt).toLocaleString()}
          </Label>
        </Card>
      ))}
    </Page>
  );
}
