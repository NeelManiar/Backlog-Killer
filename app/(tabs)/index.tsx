import { StudySections } from "../../src/components/studySections";
import { Companion, Missions } from "../../src/components/motivation";
import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  Page,
  Card,
  Title,
  Heading,
  Label,
  Bar,
  s,
  colors,
} from "../../src/components/ui";
import { useStore } from "../../src/state/store";
import { streak } from "../../src/data/metrics";
export default function Home() {
  const { chapters, sessions, subjects } = useStore();
  const focus = chapters.find((c) => c.status === "active") ?? chapters.find(c=>c.status==="pending");
  return (
    <View style={{ flex: 1 }}>
      <Page>
        <LinearGradient
          colors={["#190d35", colors.bg]}
          style={{
            margin: -16,
            marginBottom: 0,
            padding: 20,
            paddingVertical: 26,
          }}
        >
          <View style={s.row}>
            <Title>Your study space</Title>
            <View
              style={[
                s.chip,
                { backgroundColor: "#301c17", borderColor: "#71351a" },
              ]}
            >
              <Text style={{ color: "#ff801c", fontWeight: "700" }}>
                🔥 {streak(sessions)}
              </Text>
            </View>
          </View>
          <Label>Let’s fix that backlog today.</Label>
        </LinearGradient>
        <StudySections />
        <Missions />
        <Companion />
        <Heading>Today’s Focus</Heading>
        {focus ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/subject/${focus.subject}`)}
          >
            <Card>
              <View style={s.row}>
                <Label
                  color={subjects.find((x) => x.id === focus.subject)?.color}
                >
                  ● {subjects.find((x) => x.id === focus.subject)?.name}
                </Label>
                <Label>
                  Your next step
                </Label>
              </View>
              <Heading>{focus.title}</Heading>
              <Bar
                value={Math.round(
                  (chapters.filter(
                    (c) => c.subject === focus.subject && c.status === "done",
                  ).length /
                    chapters.filter((c) => c.subject === focus.subject)
                      .length) *
                    100,
                )}
                color="#3b82f6"
              />
              <Label>Continue your next chapter</Label>
            </Card>
          </Pressable>
        ) : (
          <Card>
            <Heading>{chapters.length ? "All caught up!" : "No study chapters yet"}</Heading>
            <Label>{chapters.length ? "Add a chapter to start your next goal." : "Check curriculum availability above or add a custom chapter."}</Label>
          </Card>
        )}
        <Heading>
          Backlog Collapse{" "}
          <Text style={{ color: colors.purple, fontSize: 13 }}> ✧</Text>
        </Heading>
        <Card
          style={{
            backgroundColor: "#0d0c15",
            alignItems: "center",
            paddingVertical: 22,
          }}
        >
          <View
            style={[
              s.iconButton,
              { borderColor: "#40206b", backgroundColor: "#201333" },
            ]}
          >
            <Ionicons name="lock-closed" size={29} color={colors.purple} />
          </View>
          <Heading>Backlog Collapse Calculator</Heading>
          <Label>Pro feature · Coming in a future release</Label>
        </Card>
        <View style={s.row}>
          <Heading>
            Subjects{" "}
            <Text style={s.small}>
              {" "}
              {subjects.length}/{subjects.length}
            </Text>
          </Heading>
        </View>
        {subjects.map((subject) => {
          const list = chapters.filter((c) => c.subject === subject.id);
          const done = list.filter((c) => c.status === "done").length;
          return (
            <Pressable
              key={subject.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${subject.name}`}
              onPress={() => router.push(`/subject/${subject.id}`)}
            >
              <Card
                style={{ borderLeftWidth: 4, borderLeftColor: subject.color }}
              >
                <View style={s.row}>
                  <Heading>{subject.name}</Heading>
                  <Label>Open subject ›</Label>
                </View>
                <Label>
                  <Text style={{ color: colors.green }}>{done}</Text> done ·{" "}
                  <Text style={{ color: colors.purple }}>
                    {list.filter((c) => c.status === "active").length}
                  </Text>{" "}
                  active · {list.filter((c) => c.status === "pending").length}{" "}
                  pending
                </Label>
                <Bar
                  value={Math.round((done / (list.length || 1)) * 100)}
                  color={subject.color}
                />
              </Card>
            </Pressable>
          );
        })}
      </Page>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add chapter"
        onPress={() => router.push("/add")}
        style={{
          position: "absolute",
          bottom: 18,
          right: 20,
          backgroundColor: colors.purple,
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: "center",
          justifyContent: "center",
          elevation: 5,
        }}
      >
        <Ionicons name="add" color="white" size={36} />
      </Pressable>
    </View>
  );
}
