import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env.local manually
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
  const { data: members, error } = await supabase
    .from('members')
    .select('id, name, email, position, status')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Members in database:');
  members.forEach(m => {
    console.log(`- ${m.name} (${m.email}) - ${m.position} - status: ${m.status}`);
  });
}

checkUsers();
