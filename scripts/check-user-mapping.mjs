import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read .env.local file manually
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
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
  console.error('Missing environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndFixUserMapping() {
  const targetEmail = 'jaeho19@gmail.com';

  console.log('=' .repeat(60));
  console.log('Checking user_id mapping for:', targetEmail);
  console.log('=' .repeat(60));

  // Step 1: Get member record by email
  console.log('\n1. Checking members table...');
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('*')
    .eq('email', targetEmail)
    .single();

  if (memberError) {
    console.log('   Member lookup error:', memberError.message);
    return;
  }

  if (!member) {
    console.log('   No member found with email:', targetEmail);
    return;
  }

  console.log('   Member found:');
  console.log('   - ID:', member.id);
  console.log('   - Name:', member.name);
  console.log('   - Email:', member.email);
  console.log('   - Position:', member.position);
  console.log('   - Status:', member.status);
  console.log('   - user_id:', member.user_id || '(NOT SET)');

  // Step 2: Get auth user by email
  console.log('\n2. Checking auth.users table...');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.log('   Auth lookup error:', authError.message);
    return;
  }

  const authUser = authUsers.users.find(u => u.email === targetEmail);

  if (!authUser) {
    console.log('   No auth user found with email:', targetEmail);
    console.log('   Available auth users:');
    authUsers.users.forEach(u => {
      console.log('   -', u.email, '(id:', u.id + ')');
    });
    return;
  }

  console.log('   Auth user found:');
  console.log('   - ID:', authUser.id);
  console.log('   - Email:', authUser.email);
  console.log('   - Created:', authUser.created_at);

  // Step 3: Check if user_id matches
  console.log('\n3. Comparing user_id...');
  if (member.user_id === authUser.id) {
    console.log('   ✓ user_id is correctly linked!');
    return;
  }

  if (member.user_id) {
    console.log('   ✗ user_id mismatch!');
    console.log('   - Current user_id in members:', member.user_id);
    console.log('   - Auth user ID:', authUser.id);
  } else {
    console.log('   ✗ user_id is not set in members table');
  }

  // Step 4: Fix the mapping
  console.log('\n4. Updating user_id in members table...');
  const { error: updateError } = await supabase
    .from('members')
    .update({ user_id: authUser.id })
    .eq('id', member.id);

  if (updateError) {
    console.log('   Update error:', updateError.message);
    return;
  }

  console.log('   ✓ Successfully updated user_id!');

  // Verify the update
  console.log('\n5. Verifying update...');
  const { data: updatedMember } = await supabase
    .from('members')
    .select('id, name, email, user_id')
    .eq('id', member.id)
    .single();

  console.log('   Updated member:');
  console.log('   - user_id:', updatedMember.user_id);
  console.log('   ✓ Mapping complete!');
}

// Also check all members' user_id status
async function checkAllMembers() {
  console.log('\n' + '=' .repeat(60));
  console.log('Checking all members user_id status');
  console.log('=' .repeat(60));

  const { data: members, error } = await supabase
    .from('members')
    .select('id, name, email, position, user_id')
    .order('position');

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('\nMembers status:');
  console.log('-'.repeat(80));
  console.log('Name'.padEnd(15), 'Email'.padEnd(25), 'Position'.padEnd(12), 'user_id');
  console.log('-'.repeat(80));

  for (const m of members) {
    const userIdStatus = m.user_id ? '✓ linked' : '✗ NOT LINKED';
    console.log(
      m.name.padEnd(15),
      m.email.padEnd(25),
      m.position.padEnd(12),
      userIdStatus
    );
  }
}

async function main() {
  await checkAndFixUserMapping();
  await checkAllMembers();
}

main().catch(console.error);
