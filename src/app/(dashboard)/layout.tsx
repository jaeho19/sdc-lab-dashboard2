import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";
import type { Database } from "@/types/database.types";

type Member = Database["public"]["Tables"]["members"]["Row"];

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 멤버 조회 + 알림 개수를 병렬 실행 (순차 3 RTT → 병렬 1 RTT)
  const [{ data: memberData }, notificationCount] = await Promise.all([
    supabase
      .from("members")
      .select("*")
      .eq("id", user.id)
      .single(),
    getUnreadNotificationCount(user.id),
  ]);

  const member = memberData as Member | null;

  if (!member) {
    redirect("/login");
  }

  if (member.status === "pending") {
    redirect("/pending-approval");
  }

  return (
    <DashboardLayout member={member} notificationCount={notificationCount}>
      {children}
    </DashboardLayout>
  );
}
