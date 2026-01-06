import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE environment variables");
  console.error("Run with: node --env-file=.env.local scripts/check-table.mjs");
  process.exit(1);
}

console.log("Supabase URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkResearchNotesSchema() {
  console.log("=== research_notes 테이블 스키마 확인 ===\n");

  // 모든 컬럼 조회 시도 (*)
  const { data: allData, error: allError } = await supabase
    .from("research_notes")
    .select("*")
    .limit(1);

  if (allError) {
    console.log("research_notes 전체 조회 에러:", allError.message);
  } else {
    console.log("research_notes 전체 조회 성공");
    if (allData && allData.length > 0) {
      console.log("컬럼 목록:", Object.keys(allData[0]).join(", "));
      console.log("\n첫 번째 레코드:", JSON.stringify(allData[0], null, 2));
    } else {
      console.log("데이터가 없습니다. 빈 테이블입니다.");

      // 빈 테이블이면 insert 테스트로 컬럼 확인
      console.log("\n컬럼 구조 확인을 위해 테스트 insert 시도...");
      const { error: insertError } = await supabase
        .from("research_notes")
        .insert({
          project_id: "00000000-0000-0000-0000-000000000000",
          stage: "literature_review",
          author_id: "00000000-0000-0000-0000-000000000000",
          title: "test",
          content: "test"
        });

      if (insertError) {
        console.log("Insert 테스트 에러:", insertError.message);
        if (insertError.message.includes("stage")) {
          console.log("\n[!] stage 컬럼이 없습니다.");
        } else if (insertError.message.includes("violates foreign key")) {
          console.log("\n[OK] stage 컬럼이 존재합니다! (foreign key 에러는 정상)");
        }
      }
    }
  }
}

checkResearchNotesSchema().catch(console.error);
