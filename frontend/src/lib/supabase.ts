import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * Server-side Supabase client using the service role key.
 * Only used in API routes / Server Components — never exposed to the browser.
 */
export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
