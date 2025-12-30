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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addUserIdColumnAndLink() {
  console.log('=' .repeat(60));
  console.log('Adding user_id column to members table');
  console.log('=' .repeat(60));

  // Step 1: Add user_id column using raw SQL
  console.log('\n1. Adding user_id column...');

  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE members
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

      CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
    `
  });

  if (alterError) {
    // Try alternative approach - direct SQL via Supabase REST API might not support ALTER
    console.log('   Note: Cannot execute ALTER via RPC, trying alternative...');
    console.log('   Error:', alterError.message);
    console.log('\n   Please run this SQL in Supabase Dashboard:');
    console.log('   ------------------------------------------');
    console.log('   ALTER TABLE members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);');
    console.log('   CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);');
    console.log('   ------------------------------------------');

    // Check if column already exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('members')
      .select('id, user_id')
      .limit(1);

    if (testError && testError.message.includes('user_id')) {
      console.log('\n   Column does not exist yet. Please add it via Supabase Dashboard.');
      return false;
    } else if (!testError) {
      console.log('\n   ✓ Column already exists! Proceeding with linking...');
    }
  } else {
    console.log('   ✓ Column added successfully!');
  }

  // Step 2: Get all members and auth users
  console.log('\n2. Fetching members and auth users...');

  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, name, email');

  if (membersError) {
    console.log('   Error fetching members:', membersError.message);
    return false;
  }

  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.log('   Error fetching auth users:', authError.message);
    return false;
  }

  const authUsers = authData.users;
  console.log(`   Found ${members.length} members and ${authUsers.length} auth users`);

  // Step 3: Link members to auth users by email
  console.log('\n3. Linking members to auth users...');

  let linkedCount = 0;
  let notFoundCount = 0;

  for (const member of members) {
    const authUser = authUsers.find(u => u.email === member.email);

    if (authUser) {
      const { error: updateError } = await supabase
        .from('members')
        .update({ user_id: authUser.id })
        .eq('id', member.id);

      if (updateError) {
        console.log(`   ✗ Error updating ${member.name}: ${updateError.message}`);
      } else {
        console.log(`   ✓ Linked: ${member.name} (${member.email})`);
        linkedCount++;
      }
    } else {
      console.log(`   - No auth user for: ${member.name} (${member.email})`);
      notFoundCount++;
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('Summary');
  console.log('=' .repeat(60));
  console.log(`   Linked: ${linkedCount}`);
  console.log(`   No auth user: ${notFoundCount}`);

  return true;
}

// Verify the results
async function verifyResults() {
  console.log('\n' + '=' .repeat(60));
  console.log('Verifying results');
  console.log('=' .repeat(60));

  const { data: members, error } = await supabase
    .from('members')
    .select('id, name, email, position, user_id')
    .order('position');

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('\nMembers with user_id:');
  console.log('-'.repeat(90));
  console.log('Name'.padEnd(15), 'Email'.padEnd(25), 'Position'.padEnd(12), 'user_id');
  console.log('-'.repeat(90));

  for (const m of members) {
    const userIdStatus = m.user_id ? `✓ ${m.user_id.substring(0, 8)}...` : '✗ NOT SET';
    console.log(
      (m.name || '').padEnd(15),
      (m.email || '').padEnd(25),
      (m.position || '').padEnd(12),
      userIdStatus
    );
  }
}

async function main() {
  const success = await addUserIdColumnAndLink();
  if (success !== false) {
    await verifyResults();
  }
}

main().catch(console.error);
