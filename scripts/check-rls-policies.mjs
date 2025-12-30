import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vkqeejqbyvcpxrqqshbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWVlanFieXZjcHhycXFzaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgxMzkyMSwiZXhwIjoyMDgyMzg5OTIxfQ.t3ks4W4XtlVzHfzPwN5rNixD3FaG8kwT-NP0x4-ESUM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
  // Check RLS policies on research_projects
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'research_projects' });

  if (error) {
    // If the function doesn't exist, query pg_policies directly
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'research_projects');

    if (policyError) {
      console.log('Cannot query policies directly. Checking via SQL...');

      // Try a raw query
      const { data: rawPolicies } = await supabase.rpc('exec_sql', {
        sql: `SELECT policyname, cmd, qual, with_check
              FROM pg_policies
              WHERE tablename = 'research_projects'`
      });

      console.log('Policies:', rawPolicies);
    } else {
      console.log('Policies:', policies);
    }
  } else {
    console.log('Policies:', data);
  }
}

checkPolicies();
