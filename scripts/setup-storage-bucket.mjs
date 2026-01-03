// Research Notes Storage 버킷 설정
// 실행: node scripts/setup-storage-bucket.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const envPath = resolve(__dirname, '..', '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex);
          let value = trimmed.substring(eqIndex + 1);
          value = value.replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    }
  } catch (err) {
    console.error('Error loading .env.local:', err.message);
    process.exit(1);
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupBucket() {
  console.log('🔍 Checking research-notes storage bucket...');

  const { data, error } = await supabase.storage.getBucket('research-notes');

  if (error) {
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      console.log('📦 research-notes 버킷이 없습니다. 생성을 시도합니다...');

      const { data: createData, error: createError } = await supabase.storage.createBucket('research-notes', {
        public: true,
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.log('❌ 버킷 생성 실패:', createError.message);
        console.log('\n📋 Supabase Dashboard에서 수동으로 생성해주세요:');
        console.log('   1. Storage 메뉴로 이동');
        console.log('   2. "New bucket" 클릭');
        console.log('   3. 이름: research-notes');
        console.log('   4. Public bucket 체크');
      } else {
        console.log('✅ research-notes 버킷이 생성되었습니다!');
      }
    } else {
      console.log('Error:', error.message);
    }
  } else {
    console.log('✅ research-notes 버킷이 이미 존재합니다!');
    console.log('   Public:', data.public);
  }
}

setupBucket().catch(console.error);
