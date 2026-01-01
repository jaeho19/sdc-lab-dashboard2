import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env.local manually
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...values] = line.split("=");
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join("=").trim();
    }
  });
} catch (e) {
  console.log("No .env.local found, using existing env vars");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestProject() {
  // 김은솔 연구원 찾기
  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id, name, email")
    .eq("name", "김은솔")
    .single();

  if (memberError || !member) {
    console.error("Member not found:", memberError);

    // 대안: jaeho19@gmail.com 사용
    const { data: altMember } = await supabase
      .from("members")
      .select("id, name, email")
      .eq("email", "jaeho19@gmail.com")
      .single();

    if (!altMember) {
      console.error("No member found for testing");
      return;
    }

    console.log("Using alternative member:", altMember.name, altMember.email);
    await createProjectForMember(altMember);
    return;
  }

  console.log("Found member:", member.name, member.email);
  await createProjectForMember(member);
}

async function createProjectForMember(member) {
  // D-1 마감일 (내일)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const targetDate = tomorrow.toISOString().split("T")[0];

  // 테스트 프로젝트 생성
  const { data: project, error: projectError } = await supabase
    .from("research_projects")
    .insert({
      title: "[테스트] 마감일 알림 테스트 프로젝트",
      description: "마감일 알림 기능 테스트용 프로젝트입니다.",
      status: "in_progress",
      target_date: targetDate,
      overall_progress: 50,
      created_by: member.id,
    })
    .select()
    .single();

  if (projectError) {
    console.error("Failed to create project:", projectError);
    return;
  }

  console.log("Created project:", project.id, project.title);
  console.log("Target date:", targetDate, "(D-1)");

  // 프로젝트 멤버 추가
  const { error: memberError } = await supabase
    .from("project_members")
    .insert({
      project_id: project.id,
      member_id: member.id,
      role: "researcher",
    });

  if (memberError) {
    console.error("Failed to add member:", memberError);
    return;
  }

  console.log("Added member to project:", member.name);
  console.log("\n✅ Test project created successfully!");
  console.log("📧 Email will be sent to:", member.email);
}

createTestProject();
