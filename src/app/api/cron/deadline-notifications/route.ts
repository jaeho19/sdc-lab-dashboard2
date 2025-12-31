import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase 서비스 롤 클라이언트 (RLS 우회)
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// 마감일 알림 생성
async function createDeadlineNotification(
  supabase: ReturnType<typeof createServiceClient>,
  memberId: string,
  projectId: string,
  projectTitle: string,
  daysUntilDeadline: number
) {
  const deadlineText =
    daysUntilDeadline === 0
      ? "오늘"
      : daysUntilDeadline === 1
      ? "내일"
      : `${daysUntilDeadline}일 후`;

  const title = `마감일 알림: ${projectTitle}`;
  const message = `"${projectTitle}" 프로젝트의 마감일이 ${deadlineText}입니다.`;

  // 중복 알림 확인
  const today = new Date().toISOString().split("T")[0];
  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("member_id", memberId)
    .eq("type", "deadline")
    .eq("link", `/research/${projectId}`)
    .gte("created_at", today);

  if (existing && existing.length > 0) {
    return false; // 이미 알림 있음
  }

  const { error } = await supabase.from("notifications").insert({
    member_id: memberId,
    type: "deadline",
    title,
    message,
    link: `/research/${projectId}`,
    is_read: false,
  });

  return !error;
}

export async function GET(request: Request) {
  // CRON_SECRET으로 인증 확인
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // 현재 날짜 기준으로 D-7, D-3, D-1, D-Day 체크
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDays = [7, 3, 1, 0];
  let createdCount = 0;
  const results: string[] = [];

  for (const days of targetDays) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + days);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    // 해당 날짜가 마감일인 프로젝트 조회
    const { data: projects, error: projectError } = await supabase
      .from("research_projects")
      .select(
        `
        id,
        title,
        target_date,
        project_members (
          member_id
        )
      `
      )
      .eq("target_date", targetDateStr)
      .in("status", ["preparing", "in_progress", "under_review", "revision"]);

    if (projectError) {
      results.push(`D-${days}: Error - ${projectError.message}`);
      continue;
    }

    if (!projects || projects.length === 0) {
      results.push(`D-${days}: No projects`);
      continue;
    }

    let dayCount = 0;
    for (const project of projects) {
      const members = (project.project_members || []) as { member_id: string }[];

      for (const member of members) {
        const created = await createDeadlineNotification(
          supabase,
          member.member_id,
          project.id,
          project.title,
          days
        );
        if (created) {
          createdCount++;
          dayCount++;
        }
      }
    }
    results.push(`D-${days}: ${dayCount} notifications for ${projects.length} projects`);
  }

  return NextResponse.json({
    success: true,
    created: createdCount,
    timestamp: new Date().toISOString(),
    details: results,
  });
}

// POST도 지원 (Netlify Scheduled Functions 호환)
export async function POST(request: Request) {
  return GET(request);
}
