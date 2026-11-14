import { useState } from "react";
import { TextInput } from "react-native";
import { router } from "expo-router";
import { useStore } from "../src/state/store";
import {
  Profile,
  defaultSubjects,
  currentAcademicYear,
  streams,
  goals,
  validateProfile,
} from "../src/data/profile";
import {
  Page,
  Title,
  Heading,
  Card,
  Label,
  Button,
  Bar,
  s,
} from "../src/components/ui";
export default function Onboarding() {
  const { profile, setProfile } = useStore();
  const [p, setP] = useState<Profile>(
    profile ?? {
      grade: 12,
      board: "CBSE",
      stream: "Science PCM",
      subjects: defaultSubjects(12, "Science PCM"),
      goals: [],
      academicYear: currentAcademicYear(),
      examYear: new Date().getFullYear(),
    },
  );
  const [step, setStep] = useState(0);
  const [custom, setCustom] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const steps = [
    "Grade",
    "Board",
    "Stream",
    "School subjects",
    "Entrance goals",
    "Years",
  ];
  const patch = (next: Partial<Profile>) => setP({ ...p, ...next });
  const next = () => {
    setStep(step === 1 && p.grade < 11 ? 3 : Math.min(5, step + 1));
  };
  return (
    <Page>
      <Title>Your study space</Title>
      <Label>
        Step {p.grade < 11 && step > 2 ? step : step + 1} of{" "}
        {p.grade < 11 ? 5 : 6} · {steps[step]}
      </Label>
      <Bar
        value={
          ((p.grade < 11 && step > 2 ? step : step + 1) /
            (p.grade < 11 ? 5 : 6)) *
          100
        }
        color="#8538f5"
      />
      <Card>
        {step === 0 && (
          <>
            <Heading>Which class are you in?</Heading>
            {([9, 10, 11, 12] as const).map((grade) => (
              <Button
                key={grade}
                secondary={p.grade !== grade}
                title={`Class ${grade}`}
                onPress={() =>
                  patch({
                    grade,
                    subjects: defaultSubjects(grade, p.stream),
                    stream: grade < 11 ? "" : p.stream || "Science PCM",
                  })
                }
              />
            ))}
          </>
        )}
        {step === 1 && (
          <>
            <Heading>Your school board</Heading>
            {(["CBSE", "Custom"] as const).map((board) => (
              <Button
                key={board}
                secondary={p.board !== board}
                title={board === "Custom" ? "Other / Custom" : board}
                onPress={() => patch({ board })}
              />
            ))}
          </>
        )}
        {step === 2 && (
          <>
            <Heading>Your stream</Heading>
            {streams.map((stream) => (
              <Button
                key={stream}
                secondary={p.stream !== stream}
                title={
                  stream === "Custom" ? "Custom subject combination" : stream
                }
                onPress={() =>
                  patch({ stream, subjects: defaultSubjects(p.grade, stream) })
                }
              />
            ))}
          </>
        )}
        {step === 3 && (
          <>
            <Heading>Your actual school subjects</Heading>
            <Label>
              These are suggestions. Remove subjects you do not take and add
              your optional subjects.
            </Label>
            {p.subjects.map((subject) => (
              <Button
                key={subject}
                secondary
                title={`${subject} · Remove`}
                onPress={() =>
                  patch({ subjects: p.subjects.filter((x) => x !== subject) })
                }
              />
            ))}
            <TextInput
              style={s.input}
              accessibilityLabel="Add school subject"
              value={custom}
              onChangeText={setCustom}
              maxLength={80}
            />
            <Button
              title="Add subject"
              disabled={!custom.trim() || p.subjects.length >= 20}
              onPress={() => {
                if (
                  !p.subjects.some(
                    (x) => x.toLowerCase() === custom.trim().toLowerCase(),
                  )
                )
                  patch({ subjects: [...p.subjects, custom.trim()] });
                setCustom("");
              }}
            />
          </>
        )}
        {step === 4 && (
          <>
            <Heading>Entrance goals · optional</Heading>
            {goals.map((goal) => (
              <Button
                key={goal}
                secondary={!p.goals.includes(goal)}
                title={`${p.goals.includes(goal) ? "Selected · " : ""}${goal}`}
                onPress={() =>
                  patch({
                    goals: p.goals.includes(goal)
                      ? p.goals.filter((x) => x !== goal)
                      : [...p.goals, goal],
                  })
                }
              />
            ))}
            <Button
              secondary={!!p.goals.length}
              title="No entrance exam"
              onPress={() => patch({ goals: [] })}
            />
            <Label>
              School and entrance content are kept separate. An exam syllabus
              year is verified independently.
            </Label>
          </>
        )}
        {step === 5 && (
          <>
            <Heading>Your academic calendar</Heading>
            <Label>Academic year (for example 2026-27)</Label>
            <TextInput
              accessibilityLabel="Academic year"
              style={s.input}
              value={p.academicYear}
              onChangeText={(academicYear) => patch({ academicYear })}
            />
            <Label>Target examination year</Label>
            <TextInput
              accessibilityLabel="Target exam year"
              style={s.input}
              keyboardType="number-pad"
              value={String(p.examYear)}
              onChangeText={(value) => patch({ examYear: Number(value) })}
            />
            <Label>
              Only verified curricula matching these selections will appear.
              Unverified subjects remain pending. Existing chapters are kept in
              Saved chapters, never deleted.
            </Label>
          </>
        )}
      </Card>
      {notice ? <Label>{notice}</Label> : null}
      {step > 0 && (
        <Button
          secondary
          title="Previous"
          onPress={() => setStep(step === 3 && p.grade < 11 ? 1 : step - 1)}
        />
      )}
      {step < 5 ? (
        <Button
          title="Continue"
          disabled={step === 3 && !p.subjects.length}
          onPress={next}
        />
      ) : (
        <Button
          title="Save academic profile"
          disabled={busy}
          onPress={() => {
            const error = validateProfile(p);
            if (error) {
              setNotice(error);
              return;
            }
            setBusy(true);
            void setProfile(p)
              .then(() => router.replace("/"))
              .catch(() =>
                setNotice("Could not save. Your previous profile is safe."),
              )
              .finally(() => setBusy(false));
          }}
        />
      )}
      <Button
        secondary
        title="Back to study"
        onPress={() => router.replace("/")}
      />
    </Page>
  );
}
