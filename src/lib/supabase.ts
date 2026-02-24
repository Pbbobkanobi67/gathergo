import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client-side Supabase client (uses anon key)
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

// Server-side Supabase client (uses service role key for admin operations)
export const supabaseAdmin = supabaseServiceKey
  ? createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// Storage bucket names
export const STORAGE_BUCKETS = {
  TRIP_COVERS: "trip-covers",
  RECEIPTS: "receipts",
  WINE_PHOTOS: "wine-photos",
  RECIPE_PHOTOS: "recipe-photos",
  DOCUMENTS: "documents",
  TRIP_PHOTOS: "trip-photos",
  AVATARS: "avatars",
} as const;

// Helper to get a public URL for a stored file
export function getStorageUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Helper to upload a file to storage
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob,
  options?: { contentType?: string; upsert?: boolean }
): Promise<{ path: string; url: string } | { error: string }> {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: options?.contentType,
    upsert: options?.upsert ?? false,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    path: data.path,
    url: getStorageUrl(bucket, data.path),
  };
}

// Helper to delete a file from storage
export async function deleteFile(bucket: string, path: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Helper to create a signed upload URL
export async function createSignedUploadUrl(
  bucket: string,
  path: string
): Promise<{ signedUrl: string; path: string } | { error: string }> {
  if (!supabaseAdmin) {
    return { error: "Admin client not configured" };
  }

  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path);

  if (error) {
    return { error: error.message };
  }

  return {
    signedUrl: data.signedUrl,
    path: data.path,
  };
}

// Real-time subscription helper
export function subscribeToChannel(
  channelName: string,
  table: string,
  filter: string,
  callback: (payload: Record<string, unknown>) => void
) {
  return supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter,
      },
      (payload) => callback(payload as unknown as Record<string, unknown>)
    )
    .subscribe();
}

// Unsubscribe from a channel
export async function unsubscribeFromChannel(channelName: string) {
  await supabase.channel(channelName).unsubscribe();
}
