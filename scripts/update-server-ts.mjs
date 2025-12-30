import fs from 'fs';

const path = 'C:/dev/sdclab-dashboard/src/lib/supabase/server.ts';
let content = fs.readFileSync(path, 'utf8');

const oldImport = `import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {`;

const newImport = `import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// Service role client that bypasses RLS - use only for admin operations
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function createClient() {`;

if (content.includes('createServiceRoleClient')) {
  console.log('Service role client already added');
} else if (content.includes(oldImport)) {
  content = content.replace(oldImport, newImport);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully added createServiceRoleClient function');
} else {
  console.log('Could not find the code to replace');
  console.log('Current file start:');
  console.log(content.substring(0, 300));
}
