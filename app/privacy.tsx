import { router } from "expo-router";
import {
  Page,
  Title,
  Heading,
  Label,
  Card,
  Button,
} from "../src/components/ui";
export default function Privacy() {
  return (
    <Page>
      <Title>Your data</Title>
      <Card>
        <Heading>Study with less personal data</Heading>
        <Label>
          Offline study needs no account. An optional account uses an email
          address, academic settings, chapter progress and study sessions. We do
          not request your date of birth, location or school identity. There are
          no public profiles, advertising identifiers or marketing features.
        </Label>
        <Label>
          Local study data stays on this device until you explicitly import and
          sync it. Account caches are separated. Supabase handles email
          authentication; the deployed service’s hosting region, email provider,
          retention and operator contact must be disclosed before public
          release.
        </Label>
        <Label>
          You can edit your academic profile, log out, or request account
          deletion from Your account. Anonymous copies and other offline devices
          must be erased separately. Device backups may retain copies under your
          OS settings.
        </Label>
        <Heading>Before public release</Heading>
        <Label>
          Privacy and age-appropriate consent requirements, guardian consent
          where applicable, retention, data export/access processes, hosting
          agreements and jurisdiction-specific obligations require review. This
          development foundation is not a claim of legal compliance.
        </Label>
      </Card>
      <Button title="Back" onPress={() => router.back()} />
    </Page>
  );
}
