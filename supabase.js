import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

let supabase;

try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE');
  }
  
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE,
    {
      auth: {
        persistSession: false,
      },
    }
  );
  console.log('✅ Supabase client created successfully');
} catch (error) {
  console.error('❌ Supabase client creation failed:', error.message);
  // Create a dummy client so app doesn't crash
  supabase = null;
}

export { supabase };
