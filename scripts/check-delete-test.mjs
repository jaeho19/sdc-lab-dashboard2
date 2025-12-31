import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vkqeejqbyvcpxrqqshbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWVlanFieXZjcHhycXFzaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgxMzkyMSwiZXhwIjoyMDgyMzg5OTIxfQ.t3ks4W4XtlVzHfzPwN5rNixD3FaG8kwT-NP0x4-ESUM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('=== Checking DeleteTest projects in database ===\n');

  const { data: projects, error } = await supabase
    .from('research_projects')
    .select('id, title, status, created_at')
    .ilike('title', '%DeleteTest%')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${projects.length} DeleteTest projects:\n`);
  projects.forEach((p, i) => {
    console.log(`[${i + 1}] ${p.title}`);
    console.log(`    ID: ${p.id}`);
    console.log(`    Status: ${p.status}`);
    console.log(`    Created: ${p.created_at}\n`);
  });

  if (projects.length > 0) {
    console.log('\n=== Deleting all DeleteTest projects ===\n');

    for (const p of projects) {
      console.log(`Deleting: ${p.title}...`);

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
    }
  }

  // Check again
  console.log('\n=== Verifying ===');
  const { data: remaining } = await supabase
    .from('research_projects')
    .select('id, title')
    .ilike('title', '%DeleteTest%');

  console.log(`Remaining DeleteTest projects: ${remaining?.length || 0}`);
}

check();
