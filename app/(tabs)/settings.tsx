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
        <Heading>Aryan’s Study Space</Heading>
        <Label>Class 12 · PCM · Demonstration profile</Label>
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
        <Label>BK v0.2 · Motivating Study Experience</Label>
        <Label>Built for small steps and consistent progress.</Label>
      </Card>
    </Page>
  );
}
