import { View, Text } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Page,
  Title,
  Heading,
  Card,
  Label,
  Bar,
  IconButton,
  s,
  colors,
} from "../src/components/ui";
import { useStore } from "../src/state/store";
import { coverage } from "../src/data/metrics";
export default function Prediction() {
  const { chapters, subjects } = useStore();
  const safe = subjects.filter((x) => coverage(chapters, x.id) >= 70).length;
  return (
    <Page>
      <View style={s.row}>
        <IconButton
          name="close"
          label="Close coverage estimate"
          onPress={() => router.back()}
        />
        <Title>Will I Pass?</Title>
        <View style={{ width: 20 }} />
      </View>
      <LinearGradient
        colors={["#10281d", "#1b1b30"]}
        style={[s.card, { paddingVertical: 24 }]}
      >
        <Heading>
          {safe >= 2
            ? "Your coverage is looking good"
            : "Let’s build your coverage"}
        </Heading>
        <Label>
          {safe}/{subjects.length} subjects have at least 70% chapter
          completion. Keep going!
        </Label>
      </LinearGradient>
      <Text
        style={{
          color: "#a363ff",
          textAlign: "center",
          fontStyle: "italic",
          lineHeight: 22,
        }}
      >
        Local chapter-coverage estimate · Not an exam prediction
      </Text>
      {subjects.map((x) => {
        const value = coverage(chapters, x.id);
        const color =
          value < 40 ? "#ed2525" : value < 70 ? "#f5a000" : colors.green;
        const next = chapters.find(
          (c) => c.subject === x.id && c.status !== "done",
        );
        return (
          <Card key={x.id}>
            <View style={s.row}>
              <Heading>
                <Text style={{ color: x.color }}>● </Text>
                {x.name}
              </Heading>
              <Text
                style={{
                  color,
                  backgroundColor: `${color}18`,
                  padding: 8,
                  borderRadius: 20,
                  fontWeight: "700",
                }}
              >
                {value < 40 ? "Danger" : value < 70 ? "Risky" : "Safe"}
              </Text>
            </View>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Bar value={value} color={color} />
              </View>
              <Text style={{ color, fontSize: 22, fontWeight: "800" }}>
                {value}%
              </Text>
            </View>
            <Card
              style={{
                padding: 13,
                backgroundColor: "#231c39",
                borderColor: "#38245c",
              }}
            >
              <Label>
                <Text style={{ color: colors.purple }}>♧ </Text>
                {next
                  ? `Focus on ${next.title} next. Plan one chapter at a time and revise completed topics regularly.`
                  : "All chapters complete. Keep revising and practise past papers."}
              </Label>
            </Card>
          </Card>
        );
      })}
      <Label>
        Labels use completion only: Danger below 40%, Risky 40–69%, Safe 70%+.
        They do not account for marks, chapter weightage, or exam performance.
      </Label>
    </Page>
  );
}
