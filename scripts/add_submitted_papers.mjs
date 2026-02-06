import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vkqeejqbyvcpxrqqshbu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWVlanFieXZjcHhycXFzaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgxMzkyMSwiZXhwIjoyMDgyMzg5OTIxfQ.t3ks4W4XtlVzHfzPwN5rNixD3FaG8kwT-NP0x4-ESUM';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  // 1. Find the professor member
  const { data: professors, error: profError } = await supabase
    .from('members')
    .select('id, name, position')
    .eq('position', 'professor');

  console.log('Professors found:', professors);

  if (profError || !professors || professors.length === 0) {
    // Fallback: get all members to see positions
    const { data: allMembers } = await supabase
      .from('members')
      .select('id, name, position')
      .limit(20);
    console.log('All members:', allMembers);
    console.error('Professor not found:', profError?.message);
    return;
  }

  const professor = professors[0];
  console.log('Professor found:', professor.name, professor.id);

  // 2. Check existing submitted projects
  const { data: existingProjects } = await supabase
    .from('research_projects')
    .select('id, title, submission_status, target_journal')
    .neq('submission_status', 'not_submitted');

  console.log('\nExisting submitted projects:');
  existingProjects?.forEach(p => {
    console.log(`  - [${p.submission_status}] ${p.title} (${p.target_journal})`);
  });

  // 3. Check if these papers already exist
  const paper1Title = 'Does Urban Redevelopment Improve Green Space Accessibility? A PSM-DID Analysis of Park and Nonpark Green Spaces';
  const paper2Title = 'Green Space Patterns and Urban Heat: Assessing Cooling Effects in Seoul, South Korea Using Landscape Metrics and IoT Sensor Networks';

  const { data: existing1 } = await supabase
    .from('research_projects')
    .select('id')
    .eq('title', paper1Title);

  const { data: existing2 } = await supabase
    .from('research_projects')
    .select('id')
    .eq('title', paper2Title);

  if (existing1?.length > 0) {
    console.log('\nPaper 1 already exists, skipping.');
  } else {
    const { data: p1, error: e1 } = await supabase
      .from('research_projects')
      .insert({
        title: paper1Title,
        category: 'submission',
        project_type: 'general',
        target_journal: 'Urban Forestry and Urban Greening',
        status: 'under_review',
        submission_status: 'submitted',
        submitted_at: new Date().toISOString(),
        overall_progress: 100,
        created_by: professor.id,
      })
      .select()
      .single();

    if (e1) {
      console.error('\nPaper 1 insert error:', e1.message);
    } else {
      console.log('\nPaper 1 added:', p1.id);
      await supabase.from('project_members').insert({
        project_id: p1.id,
        member_id: professor.id,
        role: 'first_author',
      });
    }
  }

  if (existing2?.length > 0) {
    console.log('Paper 2 already exists, skipping.');
  } else {
    const { data: p2, error: e2 } = await supabase
      .from('research_projects')
      .insert({
        title: paper2Title,
        category: 'submission',
        project_type: 'general',
        target_journal: 'Urban Forestry and Urban Greening',
        status: 'under_review',
        submission_status: 'submitted',
        submitted_at: new Date().toISOString(),
        overall_progress: 100,
        created_by: professor.id,
      })
      .select()
      .single();

    if (e2) {
      console.error('\nPaper 2 insert error:', e2.message);
    } else {
      console.log('Paper 2 added:', p2.id);
      await supabase.from('project_members').insert({
        project_id: p2.id,
        member_id: professor.id,
        role: 'first_author',
      });
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
