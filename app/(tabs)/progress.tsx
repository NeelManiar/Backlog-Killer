import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import {
  Page,
  Title,
  Heading,
  Card,
  Label,
  Bar,
  Button,
  s,
  colors,
} from "../../src/components/ui";
import { useStore } from "../../src/state/store";
import { subjects } from "../../src/data/seed";
import { coverage, streak, activity } from "../../src/data/metrics";
export default function Progress() {
  const { chapters, sessions } = useStore();
  return (
    <Page>
      <View style={s.row}>
        <Title>Progress</Title>
        <Button
          title="Will I Pass?"
          onPress={() => router.push("/prediction")}
        />
      </View>
      <View style={s.row}>
        {[
          {
            n: chapters.filter((c) => c.status === "done").length,
            label: "Chapters Done",
            color: colors.text,
          },
          {
            n: `${Math.round(subjects.reduce((sum, subject) => sum + coverage(chapters, subject.id), 0) / subjects.length)}%`,
            label: "Avg Progress",
            color: colors.purple,
          },
          { n: streak(sessions), label: "Day Streak", color: colors.green },
        ].map((x) => (
          <Card
            key={x.label}
            style={{ flex: 1, padding: 10, alignItems: "center" }}
          >
            <Text style={{ color: x.color, fontSize: 27, fontWeight: "800" }}>
              {x.n}
            </Text>
            <Text
              style={{ color: colors.dim, fontSize: 12, textAlign: "center" }}
            >
              {x.label}
            </Text>
          </Card>
        ))}
      </View>
      <Heading>Subject Breakdown</Heading>
      {subjects.map((x) => {
        const list = chapters.filter((c) => c.subject === x.id);
        return (
          <Pressable
            accessibilityRole="button"
            key={x.id}
            onPress={() => router.push(`/subject/${x.id}`)}
          >
            <Card>
              <View style={s.row}>
                <Heading>
                  <Text style={{ color: x.color }}>● </Text>
                  {x.name}
                </Heading>
                <Text
                  style={{ color: x.color, fontWeight: "700", fontSize: 20 }}
                >
                  {coverage(chapters, x.id)}%
                </Text>
              </View>
              <Bar value={coverage(chapters, x.id)} color={x.color} />
              <Label>
                {list.filter((c) => c.status === "done").length}/{list.length}{" "}
                chapters · {list.filter((c) => c.status === "pending").length}{" "}
                pending
              </Label>
            </Card>
          </Pressable>
        );
      })}
      <Heading>Activity Heatmap</Heading>
      <Label>Focus sessions over the last 28 days</Label>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
        {activity(sessions).map((x) => (
          <View
            key={x.date}
            accessible
            accessibilityLabel={`${x.date}: ${x.count} sessions`}
            style={{
              width: 28,
              height: 28,
              borderRadius: 5,
              backgroundColor: x.count ? colors.purple : "#29283d",
            }}
          />
        ))}
      </View>
      <Label>
        Less ▪ ▪ <Text style={{ color: colors.purple }}>▪</Text> More
      </Label>
    </Page>
  );
}
