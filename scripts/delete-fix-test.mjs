import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vkqeejqbyvcpxrqqshbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWVlanFieXZjcHhycXFzaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgxMzkyMSwiZXhwIjoyMDgyMzg5OTIxfQ.t3ks4W4XtlVzHfzPwN5rNixD3FaG8kwT-NP0x4-ESUM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteProject() {
  const projectId = 'e58a5724-e76c-4592-8fb9-17677ac039f3';

  console.log('Attempting to delete Fix Test - 194640...');

  // First delete related records
  console.log('\n1. Deleting project_members...');
  const { error: memberError } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId);

  if (memberError) {
    console.log('  Error:', memberError.message);
  } else {
    console.log('  Success');
  }

  console.log('\n2. Deleting milestones and checklist_items...');
  // Get milestones first
  const { data: milestones } = await supabase
    .from('milestones')
    .select('id')
    .eq('project_id', projectId);

  if (milestones && milestones.length > 0) {
    for (const milestone of milestones) {
      await supabase
        .from('checklist_items')
        .delete()
        .eq('milestone_id', milestone.id);
    }
    console.log('  Deleted checklist items');

    await supabase
      .from('milestones')
      .delete()
      .eq('project_id', projectId);
    console.log('  Deleted milestones');
  } else {
    console.log('  No milestones found');
  }

  console.log('\n3. Deleting the project itself...');
  const { error: projectError } = await supabase
    .from('research_projects')
    .delete()
    .eq('id', projectId);

  if (projectError) {
    console.log('  Error:', projectError.message);
  } else {
    console.log('  Success!');
  }

  // Verify deletion
  const { data: check } = await supabase
    .from('research_projects')
    .select('id, title')
    .eq('id', projectId)
    .single();

  if (check) {
    console.log('\n❌ Project still exists:', check);
  } else {
    console.log('\n✅ Project deleted successfully!');
  }
}

deleteProject();
