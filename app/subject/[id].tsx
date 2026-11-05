import { Boss } from "../../src/components/motivation";
import { View, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Page,
  Title,
  Heading,
  Card,
  Label,
  Button,
  IconButton,
  s,
} from "../../src/components/ui";
import { useStore } from "../../src/state/store";
export default function Subject() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { chapters, update, subjects } = useStore();
  const subject = subjects.find((x) => x.id === id);
  if (!subject)
    return (
      <Page>
        <Title>Subject not found</Title>
        <Button title="Go home" onPress={() => router.replace("/")} />
      </Page>
    );
  return (
    <Page>
      <View style={s.row}>
        <IconButton
          name="arrow-back"
          label="Go back"
          onPress={() => router.back()}
        />
        <Title>{subject.name}</Title>
      </View>
      <Label>
        Tap a chapter’s status to update your progress.
      </Label>
      <Boss subject={subject.id} />
      {chapters
        .filter((c) => c.subject === id)
        .map((c) => (
          <Card key={c.id}>
            <Heading>{c.title}</Heading>
            <Label color={subject.color}>
              {c.status.toUpperCase()} · {c.minutes} min ·{" "}
              {c.origin === "custom"
                ? "Custom"
                : c.origin === "verified"
                  ? "Verified curriculum"
                  : "Saved / unverified"}
            </Label>
            <View style={{ gap: 8 }}>
              <Button
                secondary
                title={`Priority: ${["Low", "Normal", "High"][c.priority ?? 1]} · change`}
                onPress={() => {
                  void update(c.id, {
                    priority: ((c.priority ?? 1) + 1) % 3,
                  }).catch(() => {});
                }}
              />
              <Button
                title={
                  c.status === "done"
                    ? "Reopen chapter"
                    : c.status === "pending"
                      ? "Start chapter"
                      : "Mark complete"
                }
                onPress={() => {
                  void update(c.id, {
                    status:
                      c.status === "done"
                        ? "pending"
                        : c.status === "pending"
                          ? "active"
                          : "done",
                  }).catch(() => {});
                }}
              />
              <Button
                secondary
                title={
                  c.planned ? "Remove from today’s plan" : "Add to today’s plan"
                }
                onPress={() => {
                  void update(c.id, { planned: !c.planned }).catch(() => {});
                }}
              />
            </View>
          </Card>
        ))}
      <Button
        title="Add a chapter"
        onPress={() =>
          router.push({ pathname: "/add", params: { subject: id } })
        }
      />
    </Page>
  );
}
