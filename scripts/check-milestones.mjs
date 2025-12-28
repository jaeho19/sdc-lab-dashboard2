import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkMilestones() {
  const projectId = 'c6d33735-5a60-416c-b03e-0e1c2e9cc70f';

  const { data, error } = await supabase
    .from('milestones')
    .select('id, title, start_date, end_date, weight, order_index')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Milestones for project:');
  console.log('------------------------');
  data.forEach((m, i) => {
    console.log(`${i + 1}. ${m.title}`);
    console.log(`   start_date: ${m.start_date || 'NULL'}`);
    console.log(`   end_date: ${m.end_date || 'NULL'}`);
    console.log('');
  });
}

checkMilestones();
