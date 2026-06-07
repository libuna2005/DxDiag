import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://sqchpdrnycvpwvufleqk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxY2hwZHJueWN2cHd2dWZsZXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MTA2NjUsImV4cCI6MjA4ODk4NjY2NX0.LXEyBWjy1oGbJ3CwtN1hcJQBBRbekNF6AwYBy1hqGHw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);