import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local 파일 직접 파싱
function loadEnv() {
  const envPath = join(__dirname, "..", ".env.local");
  const content = readFileSync(envPath, "utf-8");
  const env = {};
  content.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });
  return env;
}

const env = loadEnv();

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNotification() {
  console.log("=".repeat(50));
  console.log("알림 기능 테스트 (jaeho19@gmail.com)");
  console.log("=".repeat(50));

  // 1. 현재 프로젝트 목록 확인
  console.log("\n[1] 프로젝트 목록 확인...");
  const { data: projects, error: projectError } = await supabase
    .from("research_projects")
    .select("id, title, target_date, status")
    .order("target_date", { ascending: true })
    .limit(5);

  if (projectError) {
    console.error("프로젝트 조회 에러:", projectError.message);
    return;
  }

  console.log(`    - 프로젝트 ${projects.length}개 확인`);

  // 2. 대상 멤버 확인 (jaeho19@gmail.com)
  console.log("\n[2] 대상 멤버 확인...");
  const { data: members, error: memberError } = await supabase
    .from("members")
    .select("id, name, email")
    .eq("email", "jaeho19@gmail.com");

  if (memberError) {
    console.error("멤버 조회 에러:", memberError.message);
    return;
  }

  const testMember = members[0];
  if (!testMember) {
    console.log("    - jaeho19@gmail.com 멤버를 찾을 수 없습니다.");
    return;
  }

  console.log(`    - 대상 멤버: ${testMember.name} (${testMember.email})`);

  // 3. 테스트 알림 생성
  console.log("\n[3] 테스트 알림 생성...");

  const testNotifications = [
    {
      member_id: testMember.id,
      type: "deadline",
      title: "마감일 알림: 테스트 프로젝트",
      message: '"테스트 프로젝트"의 마감일이 3일 후입니다.',
      link: projects.length > 0 ? `/research/${projects[0].id}` : null,
      is_read: false,
    },
    {
      member_id: testMember.id,
      type: "comment",
      title: "새 댓글",
      message: "홍길동님이 게시물에 댓글을 남겼습니다.",
      link: "/mentoring",
      is_read: false,
    },
    {
      member_id: testMember.id,
      type: "like",
      title: "좋아요",
      message: "김철수님이 게시물을 좋아합니다.",
      link: "/mentoring",
      is_read: false,
    },
    {
      member_id: testMember.id,
      type: "project_update",
      title: "프로젝트 업데이트",
      message: '"연구 프로젝트"가 업데이트되었습니다.',
      link: projects.length > 0 ? `/research/${projects[0].id}` : null,
      is_read: false,
    },
  ];

  const { data: createdNotifications, error: insertError } = await supabase
    .from("notifications")
    .insert(testNotifications)
    .select();

  if (insertError) {
    console.error("알림 생성 에러:", insertError.message);
    return;
  }

  console.log(`    - ${createdNotifications.length}개 테스트 알림 생성 완료!`);

  // 4. 생성된 알림 확인
  console.log("\n[4] 현재 알림 목록...");
  const { data: notifications, error: notifError } = await supabase
    .from("notifications")
    .select("*")
    .eq("member_id", testMember.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (notifError) {
    console.error("알림 조회 에러:", notifError.message);
    return;
  }

  console.log(`    - ${testMember.name}님의 알림 ${notifications.length}개:`);
  notifications.forEach((n) => {
    const readStatus = n.is_read ? "✓" : "●";
    console.log(`      ${readStatus} [${n.type}] ${n.title}`);
  });

  console.log("\n" + "=".repeat(50));
  console.log("테스트 완료!");
  console.log("=".repeat(50));
  console.log(`\n브라우저에서 ${testMember.email}로 로그인하여 알림 확인하세요.`);
  console.log("URL: http://localhost:3000/notifications");
}

testNotification().catch(console.error);
