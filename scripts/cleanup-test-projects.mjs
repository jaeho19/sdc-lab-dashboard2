import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vkqeejqbyvcpxrqqshbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWVlanFieXZjcHhycXFzaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgxMzkyMSwiZXhwIjoyMDgyMzg5OTIxfQ.t3ks4W4XtlVzHfzPwN5rNixD3FaG8kwT-NP0x4-ESUM';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test project patterns to delete
const testPatterns = [
  'asdf',
  'test',
  'Test',
  'TEST',
  'Verify Fix',
  '테스트',
  'DeleteTest',
];

async function cleanup() {
  console.log('=== Finding test projects ===\n');

  const { data: allProjects, error } = await supabase
    .from('research_projects')
    .select('id, title, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Filter test projects
  const testProjects = allProjects.filter(p => {
    const title = p.title.toLowerCase();
    return testPatterns.some(pattern => title.includes(pattern.toLowerCase()));
  });

  console.log(`Found ${testProjects.length} test projects:\n`);
  testProjects.forEach((p, i) => {
    console.log(`[${i + 1}] ${p.title}`);
    console.log(`    ID: ${p.id}`);
    console.log(`    Status: ${p.status}`);
    console.log(`    Created: ${p.created_at}\n`);
  });

  if (testProjects.length === 0) {
    console.log('No test projects to delete.');
    return;
  }

  console.log('\n=== Deleting test projects ===\n');

  for (const p of testProjects) {
    console.log(`Deleting: ${p.title}...`);

    try {
      // Delete related data first
      await supabase.from('project_members').delete().eq('project_id', p.id);

      const { data: milestones } = await supabase
        .from('milestones')
        .select('id')
        .eq('project_id', p.id);

      if (milestones) {
        for (const m of milestones) {
          await supabase.from('checklist_items').delete().eq('milestone_id', m.id);
        }
      }

      await supabase.from('milestones').delete().eq('project_id', p.id);
      await supabase.from('weekly_goals').delete().eq('project_id', p.id);
      await supabase.from('project_authors').delete().eq('project_id', p.id);

      const { error: deleteError } = await supabase
        .from('research_projects')
        .delete()
        .eq('id', p.id);

      if (deleteError) {
        console.log(`  ERROR: ${deleteError.message}`);
      } else {
        console.log(`  OK: Deleted`);
      }
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
    }
  }

  // Verify
  console.log('\n=== Verification ===');
  const { data: remaining } = await supabase
    .from('research_projects')
    .select('id, title')
    .order('created_at', { ascending: false });

  console.log(`\nRemaining projects (${remaining.length}):`);
  remaining.forEach((p, i) => {
    console.log(`  [${i + 1}] ${p.title}`);
  });
}

cleanup();
