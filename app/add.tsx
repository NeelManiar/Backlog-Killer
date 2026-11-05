import { useState } from "react";
import {
  TextInput,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Page,
  Title,
  Label,
  Button,
  IconButton,
  s,
  colors,
} from "../src/components/ui";
import { subjects } from "../src/data/seed";
import { useStore } from "../src/state/store";
export default function Add() {
  const params = useLocalSearchParams<{ subject?: string }>();
  const [subject, setSubject] = useState(
    subjects.some((s) => s.id === params.subject) ? params.subject! : "physics",
  );
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("25");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { add } = useStore();
  async function submit() {
    const duration = Number(minutes);
    if (
      !title.trim() ||
      !Number.isInteger(duration) ||
      duration < 5 ||
      duration > 240
    ) {
      setError(
        "Enter a chapter name and a whole duration from 5 to 240 minutes.",
      );
      return;
    }
    setBusy(true);
    try {
      await add({
        id: `chapter-${Date.now()}`,
        subject,
        title: title.trim(),
        minutes: duration,
        status: "pending",
        planned: true,
      });
      router.back();
    } catch {
      setError("Could not save this chapter. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Page>
        <View style={s.row}>
          <IconButton
            name="close"
            label="Cancel adding chapter"
            onPress={() => router.back()}
          />
          <Title>Add Chapter</Title>
        </View>
        <Label>Subject</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {subjects.map((x) => (
            <Pressable
              key={x.id}
              accessibilityRole="button"
              accessibilityState={{ selected: subject === x.id }}
              onPress={() => setSubject(x.id)}
              style={[s.chip, subject === x.id && { borderColor: x.color }]}
            >
              <Text style={{ color: x.color }}>{x.name}</Text>
            </Pressable>
          ))}
        </View>
        <Label>Chapter name</Label>
        <TextInput
          accessibilityLabel="Chapter name"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          placeholder="e.g. Applications of Derivatives"
          placeholderTextColor={colors.dim}
          style={s.input}
        />
        <Label>Planned study time (minutes)</Label>
        <TextInput
          accessibilityLabel="Study duration in minutes"
          keyboardType="number-pad"
          value={minutes}
          onChangeText={setMinutes}
          maxLength={3}
          style={s.input}
        />
        {error ? (
          <Text accessibilityRole="alert" style={{ color: "#ff9292" }}>
            {error}
          </Text>
        ) : null}
        <Button
          disabled={busy}
          title={busy ? "Saving…" : "Save to today’s plan"}
          onPress={() => {
            void submit();
          }}
        />
      </Page>
    </KeyboardAvoidingView>
  );
}
