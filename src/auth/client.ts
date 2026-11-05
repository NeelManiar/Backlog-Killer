import { createClient, processLock } from "@supabase/supabase-js";
import { tokenStorage } from "./tokenStorage";
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
function configuredClient() {
  if (!url || !key) return null;
  // Only the public publishable/legacy anon key belongs here. Configuration is
  // bundled by Expo: never put a service-role key in EXPO_PUBLIC variables.
  try {
    if (
      !url.startsWith("https://") &&
      !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url)
    )
      return null;
    return createClient(url, key, {
      auth: {
        storage: tokenStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    });
  } catch {
    return null;
  }
}
export const supabase = configuredClient();
