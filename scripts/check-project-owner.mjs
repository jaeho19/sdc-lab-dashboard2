import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vkqeejqbyvcpxrqqshbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWVlanFieXZjcHhycXFzaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgxMzkyMSwiZXhwIjoyMDgyMzg5OTIxfQ.t3ks4W4XtlVzHfzPwN5rNixD3FaG8kwT-NP0x4-ESUM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Get Kim Eunsol's member info
  const { data: eunsol } = await supabase
    .from('members')
    .select('id, name, email')
    .eq('email', 'rdt9690@uos.ac.kr')
    .single();

  console.log('Kim Eunsol member info:');
  console.log(eunsol);

  // Get Fix Test - 194640 project
  const { data: project } = await supabase
    .from('research_projects')
    .select('id, title, created_by')
    .ilike('title', '%Fix Test%')
    .single();

  console.log('\nFix Test project info:');
  console.log(project);

  // Check if created_by matches Kim Eunsol's ID
  if (eunsol && project) {
    console.log('\nPermission check:');
    console.log(`  Kim Eunsol ID: ${eunsol.id}`);
    console.log(`  Project created_by: ${project.created_by}`);
    console.log(`  Match: ${eunsol.id === project.created_by}`);
  }

  // Also check who created this project via auth
  const { data: allProjects } = await supabase
    .from('research_projects')
    .select('id, title, created_by')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('\nRecent projects with created_by:');
  for (const p of allProjects || []) {
    console.log(`  ${p.title}: ${p.created_by || 'NULL'}`);
  }
}

check();
