import { useEffect, useState } from "react";
import { TextInput } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../src/auth/context";
import { supabase } from "../src/auth/client";
import { requestCode, verifyCode } from "../src/auth/flows";
import { useStore } from "../src/state/store";
import {
  Page,
  Title,
  Heading,
  Card,
  Label,
  Button,
  s,
} from "../src/components/ui";
export default function Account() {
  const { session, configured, error } = useAuth();
  const store = useStore();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [register, setRegister] = useState(false);
  const [next, setNext] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page>
      <Title>Your account</Title>
      <Button
        secondary
        title="Back to study"
        onPress={() => router.replace("/")}
      />
      {error ? <Label>{error}</Label> : null}
      {!configured ? (
        <Card>
          <Heading>Accounts are not connected yet</Heading>
          <Label>
            Email sign-in and cloud sync are unavailable in this build. You can keep studying offline.
          </Label>
        </Card>
      ) : null}
      {session ? (
        <>
          <Card>
            <Heading>Signed in</Heading>
            <Label>{session.user.email}</Label>
            <Button
              title="Edit academic profile"
              onPress={() => router.push("/onboarding")}
            />
            <Button
              secondary
              disabled={busy}
              title="Log out"
              onPress={() =>
                void run(async () => {
                  const { error } = await supabase!.auth.signOut();
                  if (error)
                    throw Error(
                      "Could not sign out. Check your connection and retry.",
                    );
                  router.replace("/");
                })
              }
            />
          </Card>
          {!store.profile && (
            <Card>
              <Heading>Set up your study space</Heading>
              <Button
                title="Choose grade and subjects"
                onPress={() => router.push("/onboarding")}
              />
            </Card>
          )}
          <Card>
            <Heading>Import local study data</Heading>
            <Label>
              This explicitly copies anonymous chapters, sessions and earned
              progress into this account. It never uploads automatically or
              deletes the anonymous copy. Existing account records are
              preserved; conflicting IDs stop the import.
            </Label>
            <Button
              title="Copy anonymous data into this account"
              disabled={busy}
              onPress={() =>
                void run(async () => {
                  await store.importLocal();
                  setNotice(
                    "Imported on this device. Review it, then sync when ready.",
                  );
                })
              }
            />
          </Card>
          <Card>
            <Heading>Cloud sync</Heading>
            <Label>
              Sync is explicit. Your device works offline; competing changes
              require a choice.
            </Label>
            <Label>{store.syncMessage}</Label>
            <Button
              title="Sync now"
              disabled={busy}
              onPress={() => void run(() => store.syncNow())}
            />
            {store.conflict && (
              <>
                <Button
                  secondary
                  disabled={busy}
                  title="Use device version in cloud"
                  onPress={() => void run(() => store.syncNow("device"))}
                />
                <Button
                  secondary
                  disabled={busy}
                  title="Use cloud version on device"
                  onPress={() => void run(() => store.syncNow("cloud"))}
                />
              </>
            )}
          </Card>
          <Card>
            <Heading>Delete account</Heading>
            <Label>
              Sign in again with an email code first. Deletion removes your
              cloud record and Auth identity, then this account’s local cache on
              this device. Anonymous copies and other devices need separate
              cleanup.
            </Label>
            <Button
              secondary
              title="Confirm account deletion…"
              disabled={busy}
              onPress={() => setDeleting(!deleting)}
            />
            {deleting && (
              <Button
                title="Permanently delete my account"
                disabled={busy}
                onPress={() =>
                  void run(async () => {
                    const { error } = await supabase!.rpc("delete_my_account");
                    if (error)
                      throw Error(
                        "Deletion could not complete. Sign in again within ten minutes and retry online.",
                      );
                    await store.clearCache();
                    await supabase!.auth.signOut({ scope: "local" });
                    router.replace("/");
                  })
                }
              />
            )}
          </Card>
        </>
      ) : null}
      {configured && (
        <Card>
          <Heading>
            {session
              ? "Verify again before deletion"
              : register
                ? "Create your account"
                : "Sign in with an email code"}
          </Heading>
          <Label>
            Only your email is needed for an account. No birth date, school
            identity or location is collected. Review the privacy information
            before signing up.
          </Label>
          <Button
            secondary
            title="Privacy information"
            onPress={() => router.push("/privacy")}
          />
          {!session && (
            <Button
              secondary
              title={
                register ? "Use existing account" : "Register a new account"
              }
              onPress={() => {
                setRegister(!register);
                setCode("");
              }}
            />
          )}
          <TextInput
            style={s.input}
            accessibilityLabel="Email address"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!busy}
          />
          <Button
            disabled={busy || now < next}
            title={
              now < next
                ? `Resend in ${Math.ceil((next - now) / 1000)}s`
                : "Send email code"
            }
            onPress={() =>
              void run(async () => {
                const result = await requestCode(
                  supabase!.auth,
                  email,
                  session ? false : register,
                  Date.now(),
                  next,
                );
                setNext(result.nextAllowed);
                setNotice(result.message);
              })
            }
          />
          <TextInput
            style={s.input}
            accessibilityLabel="Email verification code"
            autoComplete="one-time-code"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            secureTextEntry
            editable={!busy}
          />
          <Button
            disabled={busy || !code.trim()}
            title="Verify code"
            onPress={() =>
              void run(async () => {
                if (
                  session &&
                  email.trim().toLowerCase() !==
                    session.user.email?.toLowerCase()
                )
                  throw Error("Use the email address of your current account.");
                await verifyCode(supabase!.auth, email, code);
                setCode("");
                router.replace("/onboarding");
              })
            }
          />
        </Card>
      )}
      {notice ? <Label>{notice}</Label> : null}
    </Page>
  );
}
