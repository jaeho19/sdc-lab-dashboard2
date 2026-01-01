import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase 서비스 롤 클라이언트 (RLS 우회)
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// 마감일 인앱 알림 생성
async function createDeadlineNotification(
  supabase: ReturnType<typeof createServiceClient>,
  memberId: string,
  projectId: string,
  projectTitle: string,
  daysUntilDeadline: number
): Promise<boolean> {
  const deadlineText =
    daysUntilDeadline === 1 ? "내일" : `${daysUntilDeadline}일 후`;

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

  // 인앱 알림 생성
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

  // 현재 날짜 기준으로 D-3, D-1 체크
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDays = [3, 1];
  let notificationCount = 0;
  const results: string[] = [];

  for (const days of targetDays) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + days);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    // 해당 날짜가 마감일인 프로젝트 조회 (멤버 정보 포함)
    const { data: projects, error: projectError } = await supabase
      .from("research_projects")
      .select(
        `
        id,
        title,
        target_date,
        project_members (
          member_id,
          members (
            id
          )
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

    let dayNotifCount = 0;

    for (const project of projects) {
      type ProjectMember = {
        member_id: string;
        members: { id: string } | { id: string }[] | null;
      };

      const projectMembers = (project.project_members || []) as ProjectMember[];

      for (const pm of projectMembers) {
        if (!pm.members) continue;

        // Supabase에서 단일 객체 또는 배열로 반환될 수 있음
        const member = Array.isArray(pm.members) ? pm.members[0] : pm.members;
        if (!member) continue;

        const created = await createDeadlineNotification(
          supabase,
          member.id,
          project.id,
          project.title,
          days
        );

        if (created) {
          notificationCount++;
          dayNotifCount++;
        }
      }
    }

    results.push(
      `D-${days}: ${dayNotifCount} notifications for ${projects.length} projects`
    );
  }

  return NextResponse.json({
    success: true,
    notifications: notificationCount,
    timestamp: new Date().toISOString(),
    details: results,
  });
}

// POST도 지원 (Netlify Scheduled Functions 호환)
export async function POST(request: Request) {
  return GET(request);
}
