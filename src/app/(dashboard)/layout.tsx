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

  const { data: memberData } = await supabase
    .from("members")
    .select("*")
    .eq("id", user.id)
    .single();

  const member = memberData as Member | null;

  if (!member) {
    redirect("/login");
  }

  if (member.status === "pending") {
    redirect("/pending-approval");
  }

  // 미읽은 알림 개수 가져오기
  const notificationCount = await getUnreadNotificationCount();

  return (
    <DashboardLayout member={member} notificationCount={notificationCount}>
      {children}
    </DashboardLayout>
  );
}
