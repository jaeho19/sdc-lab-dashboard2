import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vkqeejqbyvcpxrqqshbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWVlanFieXZjcHhycXFzaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgxMzkyMSwiZXhwIjoyMDgyMzg5OTIxfQ.t3ks4W4XtlVzHfzPwN5rNixD3FaG8kwT-NP0x4-ESUM';

const supabase = createClient(supabaseUrl, supabaseKey);

// Specific titles to delete
const titlesToDelete = [
  'asfdsdf',
  'ddd',
];

async function cleanup() {
  console.log('=== Deleting specific test projects ===\n');

  for (const title of titlesToDelete) {
    const { data: projects } = await supabase
      .from('research_projects')
      .select('id, title')
      .eq('title', title);

    if (projects && projects.length > 0) {
      for (const p of projects) {
        console.log(`Deleting: ${p.title}...`);

        // Delete related data
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

        const { error } = await supabase
          .from('research_projects')
          .delete()
          .eq('id', p.id);

        console.log(error ? `  ERROR: ${error.message}` : '  OK: Deleted');
      }
    } else {
      console.log(`Not found: ${title}`);
    }
  }

  // Final list
  console.log('\n=== Final project list ===\n');
  const { data: remaining } = await supabase
    .from('research_projects')
    .select('id, title')
    .order('title', { ascending: true });

  console.log(`Total: ${remaining.length} projects\n`);
  remaining.forEach((p, i) => {
    console.log(`[${i + 1}] ${p.title}`);
  });
}

cleanup();
