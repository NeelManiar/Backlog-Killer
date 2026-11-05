import { supabase } from "../auth/client";
import { migrateAccount, type StudyData } from "../data/accounts";
export async function readCloud() {
  if (!supabase) throw Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("study_accounts")
    .select("revision,document")
    .maybeSingle();
  if (error)
    throw Error("Cloud is unavailable. Your device data is unchanged.");
  return data
    ? {
        revision: Number(data.revision),
        document: migrateAccount(data.document),
      }
    : null;
}
export async function writeCloud(document: StudyData, revision: number) {
  if (!supabase) throw Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("save_study", {
    expected_revision: revision,
    new_document: { ...document, sync: { revision: 0, dirty: false } },
  });
  if (error)
    throw Error(
      error.code === "40001"
        ? "Cloud changed again. Sync to review the latest version."
        : "Could not sync. Device data is safe.",
    );
  return Number(data);
}
