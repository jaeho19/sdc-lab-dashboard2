// SDC Lab - 저자 정보 컬럼 추가 스크립트
import { createClient } from "@supabase/supabase-js";
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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("저자 정보 컬럼 추가를 시작합니다...\n");

  // SQL을 통해 컬럼 추가 (Supabase에서는 직접 SQL 실행)
  // 이미 존재하면 무시됨
  const alterTableSQL = `
    ALTER TABLE research_projects
    ADD COLUMN IF NOT EXISTS first_author TEXT,
    ADD COLUMN IF NOT EXISTS co_authors TEXT,
    ADD COLUMN IF NOT EXISTS corresponding_author TEXT;
  `;

  // Supabase의 SQL Editor를 통해 실행해야 합니다.
  // 여기서는 직접 실행이 어려우므로, 컬럼 존재 여부를 확인합니다.

  const { data, error } = await supabase
    .from("research_projects")
    .select("*")
    .limit(1);

  if (error) {
    console.error("테이블 조회 오류:", error.message);
    return;
  }

  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    console.log("현재 컬럼:", columns.join(", "));

    const hasFirstAuthor = columns.includes("first_author");
    const hasCoAuthors = columns.includes("co_authors");
    const hasCorrespondingAuthor = columns.includes("corresponding_author");

    if (hasFirstAuthor && hasCoAuthors && hasCorrespondingAuthor) {
      console.log("\n✅ 저자 정보 컬럼이 이미 존재합니다.");
    } else {
      console.log("\n⚠️  다음 SQL을 Supabase SQL Editor에서 실행해주세요:\n");
      console.log("----------------------------------------");
      console.log(`ALTER TABLE research_projects
ADD COLUMN IF NOT EXISTS first_author TEXT,
ADD COLUMN IF NOT EXISTS co_authors TEXT,
ADD COLUMN IF NOT EXISTS corresponding_author TEXT;`);
      console.log("----------------------------------------");
    }
  } else {
    console.log("데이터가 없습니다. 다음 SQL을 실행해주세요:");
    console.log("----------------------------------------");
    console.log(`ALTER TABLE research_projects
ADD COLUMN IF NOT EXISTS first_author TEXT,
ADD COLUMN IF NOT EXISTS co_authors TEXT,
ADD COLUMN IF NOT EXISTS corresponding_author TEXT;`);
    console.log("----------------------------------------");
  }
}

main().catch(console.error);
