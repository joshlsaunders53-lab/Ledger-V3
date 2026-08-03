import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "trade-screenshots";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour — plenty for a single viewing session

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type === "image/png" ? "png" : "jpg";
}

/** Uploads (or overwrites) one screenshot slot for a trade. Returns the
 * storage path to save on the trade row — never a public URL. */
export async function uploadTradeScreenshot(
  supabase: SupabaseClient,
  userId: string,
  tradeId: string,
  kind: "before" | "during" | "after" | "markup",
  file: File
): Promise<string> {
  const path = `${userId}/${tradeId}-${kind}.${extensionFor(file)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    cacheControl: "3600",
  });
  if (error) throw error;
  return path;
}

/** Resolves a stored path to a short-lived signed URL for display.
 * Returns null if the path is empty or the object no longer exists. */
export async function getSignedScreenshotUrl(
  supabase: SupabaseClient,
  path: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function deleteTradeScreenshot(supabase: SupabaseClient, path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
