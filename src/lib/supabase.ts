import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://cwoomtujnorhekuwwdsk.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3b29tdHVqbm9yaGVrdXd3ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NzI2MjcsImV4cCI6MjA5NjE0ODYyN30.hSQviG329tPSeulq78nuH7eG4teyQgcLurxIxqDLRs8";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing Supabase environment variables. Auth and DB features will not work correctly.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
