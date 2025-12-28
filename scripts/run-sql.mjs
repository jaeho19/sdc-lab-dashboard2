// SDC Lab - Supabase SQL 실행 스크립트
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const envPath = resolve(__dirname, "../.env.local");
    const envContent = readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=").replace(/^["']|["']$/g, "");
        process.env[key] = value;
      }
    }
  } catch (error) {
    console.error(".env.local 파일을 찾을 수 없습니다.");
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("환경 변수가 설정되지 않았습니다.");
  process.exit(1);
}

async function runSQL(sql) {
  // Supabase REST API를 통해 SQL 실행
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseServiceKey,
      "Authorization": `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ sql_query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL 실행 실패: ${response.status} - ${text}`);
  }

  return await response.json();
}

async function main() {
  const sql = process.argv[2];

  if (!sql) {
    console.log("사용법: node scripts/run-sql.mjs \"SQL 쿼리\"");
    console.log("\n저자 컬럼 추가를 위해 Supabase Dashboard에서 다음 SQL을 실행하세요:\n");
    console.log(`ALTER TABLE research_projects
ADD COLUMN IF NOT EXISTS first_author TEXT,
ADD COLUMN IF NOT EXISTS co_authors TEXT,
ADD COLUMN IF NOT EXISTS corresponding_author TEXT;`);
    return;
  }

  try {
    const result = await runSQL(sql);
    console.log("결과:", result);
  } catch (error) {
    console.error("오류:", error.message);
    console.log("\n⚠️  Supabase Dashboard > SQL Editor에서 직접 실행해주세요.");
  }
}

main();
