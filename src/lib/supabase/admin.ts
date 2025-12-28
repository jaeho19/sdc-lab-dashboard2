import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Service Role Key를 사용하는 Admin 클라이언트 (RLS 우회)
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
