import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "CRITICAL: Missing Supabase environment variables! The app will likely fail to fetch or authenticate.",
  );
}

// Ensure the client is created even with empty strings to avoid 'undefined' crashes elsewhere,
// although Supabase calls will fail. This prevents the module from crashing on load.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
);
