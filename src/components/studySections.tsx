import { router } from "expo-router";
import { Card, Heading, Label, Button } from "./ui";
import { useStore } from "../state/store";
import { catalogs, examSources, matches } from "../data/curriculum";
export function StudySections() {
  const { profile, section, setSection } = useStore();
  return (
    <Card>
      <Heading>
        {profile
          ? `Class ${profile.grade} · ${profile.board} · ${profile.academicYear}`
          : "Personalize your studies"}
      </Heading>
      {!profile ? (
        <>
          <Label>
            Your saved v0.2 data is unchanged. Choose a profile to separate
            school curricula, entrance goals and saved chapters.
          </Label>
          <Button
            title="Set up academic profile"
            onPress={() => router.push("/onboarding")}
          />
        </>
      ) : (
        <>
          <Button
            secondary={section !== "school"}
            title="School"
            onPress={() => setSection("school")}
          />
          {profile.goals.map((goal) => (
            <Button
              key={goal}
              secondary={section !== goal}
              title={`${goal} · ${profile.examYear}`}
              onPress={() => setSection(goal)}
            />
          ))}
          <Button
            secondary={section !== "archive"}
            title="Saved chapters · all preserved data"
            onPress={() => setSection("archive")}
          />
          {section === "school" &&
            profile.subjects.map((subject) => {
              const verified = catalogs.some(
                (c) => c.subject === subject && matches(c, profile, "school"),
              );
              return (
                <Label key={subject}>
                  {subject}:{" "}
                  {verified
                    ? "Verified curriculum"
                    : "Curriculum pending verification. Only your custom chapters are shown."}
                </Label>
              );
            })}
          {section !== "school" && section !== "archive" && (
            <Label>
              {section} {profile.examYear}: syllabus unavailable pending
              official verification. Source: {examSources[section]}. No school
              topics are automatically treated as exam content.
            </Label>
          )}
          {section === "archive" && (
            <Label>
              Saved chapters include legacy/unverified topics. They are not an
              official school or entrance syllabus.
            </Label>
          )}
          <Button
            secondary
            title="Edit subjects and goals"
            onPress={() => router.push("/onboarding")}
          />
        </>
      )}
      <Button
        secondary
        title="Account and cloud sync"
        onPress={() => router.push("/account")}
      />
    </Card>
  );
}
