// SDC Lab - 투고 상태 및 저널 정보 업데이트 스크립트
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local 파일에서 환경 변수 로드
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
  console.error("NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("투고 상태 및 저널 정보 업데이트를 시작합니다...\n");

  // 1. CEUS -> Computers, Environment and Urban Systems 변경
  console.log("1. target_journal: CEUS -> Computers, Environment and Urban Systems 변경");
  const { data: ceusProjects, error: ceusFetchError } = await supabase
    .from("research_projects")
    .select("id, title")
    .eq("target_journal", "CEUS");

  if (ceusFetchError) {
    console.error("   ❌ 조회 실패:", ceusFetchError.message);
  } else if (ceusProjects && ceusProjects.length > 0) {
    for (const project of ceusProjects) {
      const { error: updateError } = await supabase
        .from("research_projects")
        .update({ target_journal: "Computers, Environment and Urban Systems" })
        .eq("id", project.id);

      if (updateError) {
        console.error(`   ❌ 업데이트 실패: ${project.title} - ${updateError.message}`);
      } else {
        console.log(`   ✅ 업데이트 완료: ${project.title.substring(0, 50)}...`);
      }
    }
  } else {
    console.log("   ⏭️  CEUS 저널인 프로젝트가 없습니다.");
  }

  // 2. 새 연구 추가: Beyond Proximity...
  console.log("\n2. 새 연구 추가: Beyond Proximity...");

  // 교수님(이재호) ID 조회
  const { data: professor } = await supabase
    .from("members")
    .select("id")
    .eq("position", "professor")
    .single();

  if (!professor) {
    console.error("   ❌ 교수님 ID를 찾을 수 없습니다.");
    return;
  }

  const newProject = {
    title: "Beyond Proximity: A Three-Dimensional Assessment of Urban Park Green Space Equity in Seoul",
    target_journal: "Cities",
    category: "submission",
    status: "preparing",
    overall_progress: 100,
    submission_status: "major_revision",
    project_type: "general",
    description: "1st revision 후 재투고 (Response Letter 작성 중)",
    created_by: professor.id,
  };

  // 중복 체크
  const { data: existing } = await supabase
    .from("research_projects")
    .select("id")
    .eq("title", newProject.title)
    .single();

  if (existing) {
    console.log(`   ⏭️  이미 존재: ${newProject.title.substring(0, 50)}...`);
  } else {
    const { error: insertError } = await supabase
      .from("research_projects")
      .insert(newProject);

    if (insertError) {
      console.error(`   ❌ 추가 실패: ${insertError.message}`);
    } else {
      console.log(`   ✅ 추가 완료: ${newProject.title.substring(0, 50)}...`);
    }
  }

  console.log("\n========================================");
  console.log("업데이트 완료!");
  console.log("========================================");
}

main().catch(console.error);
