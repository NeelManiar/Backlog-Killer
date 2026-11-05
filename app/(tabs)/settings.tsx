import { Page, Title, Heading, Label, Card } from "../../src/components/ui";
export default function Settings() {
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
        <Heading>Focus routine</Heading>
        <Label>
          25-minute work sessions · 5-minute breaks. Select a subject before
          starting the timer.
        </Label>
      </Card>
      <Card>
        <Heading>About Backlog Killer</Heading>
        <Label>Version 1.0.0 · First implementation</Label>
        <Label>Built for small steps and consistent progress.</Label>
      </Card>
    </Page>
  );
}
