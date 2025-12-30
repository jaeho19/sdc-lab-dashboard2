import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env.local manually
const envContent = readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running migration: 00009_fix_weekly_goals_rls.sql');

  // Drop existing policy
  const { error: dropError } = await supabase.rpc('exec_sql', {
    sql: `DROP POLICY IF EXISTS "Project members can manage weekly goals" ON weekly_goals;`
  });

  if (dropError) {
    // Try direct SQL approach
    console.log('Using direct SQL approach...');
  }

  // Run migration SQL statements one by one
  const statements = [
    `DROP POLICY IF EXISTS "Project members can manage weekly goals" ON weekly_goals`,
    `DROP POLICY IF EXISTS "Weekly goals are viewable by authenticated users" ON weekly_goals`,
    `DROP POLICY IF EXISTS "Active members can create weekly goals" ON weekly_goals`,
    `DROP POLICY IF EXISTS "Project members can update weekly goals" ON weekly_goals`,
    `DROP POLICY IF EXISTS "Project members can delete weekly goals" ON weekly_goals`,
    `CREATE POLICY "Weekly goals are viewable by authenticated users"
        ON weekly_goals FOR SELECT
        TO authenticated
        USING (true)`,
    `CREATE POLICY "Active members can create weekly goals"
        ON weekly_goals FOR INSERT
        TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM members
                WHERE id = auth.uid() AND status = 'active'
            )
        )`,
    `CREATE POLICY "Project members can update weekly goals"
        ON weekly_goals FOR UPDATE
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = weekly_goals.project_id AND pm.member_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM research_projects rp
                WHERE rp.id = weekly_goals.project_id AND rp.created_by = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM members
                WHERE id = auth.uid() AND position = 'professor'
            )
        )`,
    `CREATE POLICY "Project members can delete weekly goals"
        ON weekly_goals FOR DELETE
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = weekly_goals.project_id AND pm.member_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM research_projects rp
                WHERE rp.id = weekly_goals.project_id AND rp.created_by = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM members
                WHERE id = auth.uid() AND position = 'professor'
            )
        )`
  ];

  // Use the Supabase Management API via fetch
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  if (!projectRef) {
    console.error('Could not extract project ref from URL');
    process.exit(1);
  }

  console.log('Project ref:', projectRef);
  console.log('Executing SQL via Supabase SQL endpoint...');

  const fullSql = statements.join(';\n') + ';';

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ sql: fullSql })
  });

  if (!response.ok) {
    // exec_sql RPC might not exist, try alternative approach
    console.log('exec_sql RPC not available, using pg_query approach...');

    // Direct query via postgREST won't work for DDL
    // We need to use the Supabase Dashboard SQL Editor or supabase CLI
    console.log('\n========================================');
    console.log('Please run the following SQL in Supabase Dashboard:');
    console.log('========================================\n');
    console.log(fullSql);
    console.log('\n========================================');
    console.log('Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('========================================\n');
    process.exit(0);
  }

  console.log('Migration completed successfully!');
}

runMigration().catch(console.error);
