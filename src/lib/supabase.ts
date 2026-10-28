import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Temporary debug check to see if it's loading properly
console.log("Supabase URL:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
