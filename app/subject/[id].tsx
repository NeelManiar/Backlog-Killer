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
import { subjects } from "../../src/data/seed";
export default function Subject() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subject = subjects.find((x) => x.id === id);
  const { chapters, update } = useStore();
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
        {subject.days} days to your target · Tap a chapter’s status to update
        it.
      </Label>
      {chapters
        .filter((c) => c.subject === id)
        .map((c) => (
          <Card key={c.id}>
            <Heading>{c.title}</Heading>
            <Label color={subject.color}>
              {c.status.toUpperCase()} · {c.minutes} min
            </Label>
            <View style={{ gap: 8 }}>
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
