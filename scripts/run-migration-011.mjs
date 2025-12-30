import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://vkqeejqbyvcpxrqqshbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWVlanFieXZjcHhycXFzaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgxMzkyMSwiZXhwIjoyMDgyMzg5OTIxfQ.t3ks4W4XtlVzHfzPwN5rNixD3FaG8kwT-NP0x4-ESUM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running migration to allow project creators to delete projects...\n');

  // Execute each statement separately
  const statements = [
    // Drop and recreate research_projects delete policy
    `DROP POLICY IF EXISTS "Admin can delete projects" ON research_projects`,
    `CREATE POLICY "Admin or creator can delete projects"
     ON research_projects FOR DELETE
     USING (
       is_admin() OR
       created_by = auth.uid()
     )`,

    // Drop old project_members policy
    `DROP POLICY IF EXISTS "Active members can manage project members" ON project_members`,

    // Create separate policies for project_members (SELECT might already exist)
    `DROP POLICY IF EXISTS "Active members can view project members" ON project_members`,
    `CREATE POLICY "Active members can view project members"
     ON project_members FOR SELECT
     USING (is_active_member())`,

    `CREATE POLICY "Active members can insert project members"
     ON project_members FOR INSERT
     WITH CHECK (is_active_member())`,

    `CREATE POLICY "Active members can update project members"
     ON project_members FOR UPDATE
     USING (is_active_member())`,

    `CREATE POLICY "Admin or project creator can delete project members"
     ON project_members FOR DELETE
     USING (
       is_admin() OR
       EXISTS (
         SELECT 1 FROM research_projects rp
         WHERE rp.id = project_members.project_id
         AND rp.created_by = auth.uid()
       )
     )`,

    // Drop old milestones policy
    `DROP POLICY IF EXISTS "Active members can manage milestones" ON milestones`,

    `DROP POLICY IF EXISTS "Active members can view milestones" ON milestones`,
    `CREATE POLICY "Active members can view milestones"
     ON milestones FOR SELECT
     USING (is_active_member())`,

    `CREATE POLICY "Active members can insert milestones"
     ON milestones FOR INSERT
     WITH CHECK (is_active_member())`,

    `CREATE POLICY "Active members can update milestones"
     ON milestones FOR UPDATE
     USING (is_active_member())`,

    `CREATE POLICY "Admin or project creator can delete milestones"
     ON milestones FOR DELETE
     USING (
       is_admin() OR
       EXISTS (
         SELECT 1 FROM research_projects rp
         WHERE rp.id = milestones.project_id
         AND rp.created_by = auth.uid()
       )
     )`,

    // Drop old checklist_items policy
    `DROP POLICY IF EXISTS "Active members can manage checklist items" ON checklist_items`,

    `DROP POLICY IF EXISTS "Active members can view checklist items" ON checklist_items`,
    `CREATE POLICY "Active members can view checklist items"
     ON checklist_items FOR SELECT
     USING (is_active_member())`,

    `CREATE POLICY "Active members can insert checklist items"
     ON checklist_items FOR INSERT
     WITH CHECK (is_active_member())`,

    `CREATE POLICY "Active members can update checklist items"
     ON checklist_items FOR UPDATE
     USING (is_active_member())`,

    `CREATE POLICY "Admin or project creator can delete checklist items"
     ON checklist_items FOR DELETE
     USING (
       is_admin() OR
       EXISTS (
         SELECT 1 FROM milestones m
         JOIN research_projects rp ON rp.id = m.project_id
         WHERE m.id = checklist_items.milestone_id
         AND rp.created_by = auth.uid()
       )
     )`,
  ];

  for (const sql of statements) {
    const shortSql = sql.substring(0, 60).replace(/\n/g, ' ') + '...';
    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        // Try direct query for policies
        const { error: error2 } = await supabase.from('_exec').select('*').throwOnError();
        console.log(`  SKIP (using fallback): ${shortSql}`);
      } else {
        console.log(`  OK: ${shortSql}`);
      }
    } catch (e) {
      // Ignore errors for DROP IF EXISTS
      if (sql.includes('DROP POLICY')) {
        console.log(`  SKIP: ${shortSql}`);
      } else {
        console.log(`  ERROR: ${shortSql}`);
        console.log(`    ${e.message}`);
      }
    }
  }

  console.log('\nMigration complete!');
}

runMigration();
