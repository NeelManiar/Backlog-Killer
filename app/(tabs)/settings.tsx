import { router } from "expo-router";
import { useStore } from "../../src/state/store";
import {
  Page,
  Title,
  Heading,
  Label,
  Card,
  Button,
} from "../../src/components/ui";
export default function Settings() {
  const { motivation, configure } = useStore();
  return (
    <Page>
      <Title>Settings</Title>
      <Card>
        <Heading>Your Study Space</Heading>
        <Label>Choose the subjects and goals that fit your studies.</Label>
        <Button
          title="Your account and sync"
          onPress={() => router.push("/account")}
        />
        <Button
          secondary
          title="Edit academic profile"
          onPress={() => router.push("/onboarding")}
        />
        <Button
          secondary
          title="Privacy information"
          onPress={() => router.push("/privacy")}
        />
      </Card>
      <Card>
        <Heading>Offline by design</Heading>
        <Label>
          Your chapters, daily plan, and focus sessions stay on this device. No
          account or internet connection is needed after installation.
        </Label>
      </Card>
      <Card>
        <Heading>Celebrations</Heading>
        <Label>
          Static, optional completion messages. System reduced-motion
          preferences are respected.
        </Label>
        <Button
          title={
            motivation.celebrations
              ? "Celebrations on · turn off"
              : "Celebrations off · turn on"
          }
          onPress={() => {
            void configure({ celebrations: !motivation.celebrations }).catch(
              () => {},
            );
          }}
        />
      </Card>
      <Card>
        <Heading>Focus routine</Heading>
        <Label>
          Configurable work and break sessions. Select a chapter before
          starting. Paused and running timers survive app restarts.
        </Label>
      </Card>
      <Card>
        <Heading>About Backlog Killer</Heading>
        <Label>BK v0.3 · Personalized study</Label>
        <Label>Built for small steps and consistent progress.</Label>
      </Card>
    </Page>
  );
}
