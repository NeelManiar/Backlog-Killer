import { useEffect, useState } from "react";
import {
  AppState,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Page,
  Title,
  Heading,
  Card,
  Label,
  IconButton,
  s,
  colors,
} from "../../src/components/ui";
import { useStore } from "../../src/state/store";
import { subjects } from "../../src/data/seed";
export default function Timer() {
  const { chapters, sessions, log } = useStore();
  const [mode, setMode] = useState<"work" | "break">("work");
  const [remaining, setRemaining] = useState(1500);
  const [end, setEnd] = useState<number | null>(null);
  const [subject, setSubject] = useState("physics");
  const [notice, setNotice] = useState("");
  const size = Math.min(useWindowDimensions().width - 64, 290);
  useEffect(() => {
    if (!end) return;
    const tick = () =>
      setRemaining(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    const listener = AppState.addEventListener("change", tick);
    return () => {
      clearInterval(id);
      listener.remove();
    };
  }, [end]);
  useEffect(() => {
    if (end && remaining === 0) {
      setEnd(null);
      if (mode === "work") {
        const chapter = chapters.find(
          (c) => c.subject === subject && c.status === "active",
        );
        void log({
          id: `session-${Date.now()}`,
          subject,
          title: chapter?.title ?? "Focused study",
          minutes: 25,
          finishedAt: new Date().toISOString(),
        })
          .then(() => setNotice("Great work! Your 25-minute session is saved."))
          .catch(() =>
            setNotice("Session could not be saved. Please try again."),
          );
      } else setNotice("Break complete. Ready for another chapter?");
    }
  }, [remaining, end, mode, subject, chapters, log]);
  function reset(next = mode) {
    setEnd(null);
    setRemaining(next === "work" ? 1500 : 300);
    setMode(next);
    setNotice("");
  }
  return (
    <Page>
      <Title>Focus Timer</Title>
      <View style={s.row}>
        {(["work", "break"] as const).map((m) => (
          <Pressable
            key={m}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === m }}
            onPress={() => reset(m)}
            style={[
              s.chip,
              {
                flex: 1,
                alignItems: "center",
                borderRadius: 14,
                borderColor: mode === m ? colors.purple : colors.border,
                backgroundColor: mode === m ? "#1a1030" : colors.card,
              },
            ]}
          >
            <Text
              style={{
                color: mode === m ? "#a363ff" : colors.muted,
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              {m === "work" ? "Work 25m" : "Break 5m"}
            </Text>
          </Pressable>
        ))}
      </View>
      <LinearGradient
        colors={["#211337", "#1b1b30"]}
        style={{
          alignSelf: "center",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: "#301a50",
          alignItems: "center",
          justifyContent: "center",
          marginVertical: 8,
        }}
      >
        <Text
          accessibilityLabel={`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds`}
          style={{
            color: colors.text,
            fontWeight: "800",
            fontSize: size * 0.22,
            fontVariant: ["tabular-nums"],
          }}
        >
          {String(Math.floor(remaining / 60)).padStart(2, "0")}:
          {String(remaining % 60).padStart(2, "0")}
        </Text>
        <Label>{mode === "work" ? "Focus" : "Breathe"}</Label>
      </LinearGradient>
      <View style={[s.row, { justifyContent: "center", gap: 24 }]}>
        <IconButton
          name="refresh"
          label="Reset timer"
          onPress={() => reset()}
        />
        <IconButton
          primary
          name={end ? "pause" : "play"}
          label={end ? "Pause timer" : "Start timer"}
          onPress={() => {
            if (end) {
              setRemaining(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
              setEnd(null);
            } else {
              const seconds = remaining || (mode === "work" ? 1500 : 300);
              setRemaining(seconds);
              setEnd(Date.now() + seconds * 1000);
            }
          }}
        />
        <IconButton
          name="play-skip-forward"
          label="Skip to next mode without recording a session"
          onPress={() => reset(mode === "work" ? "break" : "work")}
        />
      </View>
      {notice ? <Label>{notice}</Label> : null}
      <Label>STUDYING</Label>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {subjects.map((x) => (
          <Pressable
            key={x.id}
            disabled={!!end}
            accessibilityRole="button"
            accessibilityState={{ selected: subject === x.id, disabled: !!end }}
            onPress={() => setSubject(x.id)}
            style={[
              s.chip,
              subject === x.id && {
                borderColor: x.color,
                backgroundColor: "#101a2d",
              },
              !!end && { opacity: 0.6 },
            ]}
          >
            <Text
              style={{
                color: subject === x.id ? x.color : colors.muted,
                fontWeight: "600",
              }}
            >
              ● {x.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Heading>Recent Sessions</Heading>
      {sessions.slice(0, 10).map((session) => (
        <Card key={session.id}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Heading>
                <Text
                  style={{
                    color: subjects.find((x) => x.id === session.subject)
                      ?.color,
                  }}
                >
                  ●{" "}
                </Text>
                {subjects.find((x) => x.id === session.subject)?.name}
              </Heading>
              <Label>{session.title}</Label>
            </View>
            <Label>
              {session.minutes}m <Text style={{ color: colors.green }}> ✓</Text>
            </Label>
          </View>
        </Card>
      ))}
    </Page>
  );
}
