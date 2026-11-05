import { Text, View } from "react-native";
import {
  Page,
  Title,
  Heading,
  Card,
  Label,
  Button,
  s,
} from "../../src/components/ui";
import { useStore } from "../../src/state/store";
import { router } from "expo-router";
export default function Plan() {
  const { chapters, update, subjects } = useStore();
  const planned = chapters.filter((c) => c.planned);
  return (
    <Page>
      <Title>Your Study Plan</Title>
      <Label>Small steps. A lighter backlog.</Label>
      <Card>
        <Heading>Today’s goal</Heading>
        <Label>
          {planned.filter((c) => c.status === "done").length}/{planned.length}{" "}
          chapters completed ·{" "}
          {planned
            .filter((c) => c.status !== "done")
            .reduce((n, c) => n + c.minutes, 0)}{" "}
          min remaining
        </Label>
      </Card>
      {planned.length === 0 && (
        <Label>No chapters planned. Open a subject to add some.</Label>
      )}
      {planned.map((c) => (
        <Card key={c.id}>
          <Label color={subjects.find((x) => x.id === c.subject)?.color}>
            ● {subjects.find((x) => x.id === c.subject)?.name} · {c.minutes} min
          </Label>
          <Heading>{c.title}</Heading>
          <View style={s.row}>
            <Button
              title={c.status === "done" ? "Undo completion" : "Mark complete"}
              onPress={() => {
                void update(c.id, {
                  status: c.status === "done" ? "active" : "done",
                }).catch(() => {});
              }}
            />
            <Button
              secondary
              title="Remove"
              onPress={() => {
                void update(c.id, { planned: false }).catch(() => {});
              }}
            />
          </View>
        </Card>
      ))}
      <Button
        title="Start a focus session"
        onPress={() => router.push("/timer")}
      />
      <Heading>Plan another chapter</Heading>
      {subjects.map((x) => (
        <Button
          key={x.id}
          secondary
          title={x.name + "  ›"}
          onPress={() => router.push(`/subject/${x.id}`)}
        />
      ))}
    </Page>
  );
}
