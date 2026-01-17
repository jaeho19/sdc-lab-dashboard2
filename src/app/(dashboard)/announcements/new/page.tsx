import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AnnouncementForm } from "@/components/features/announcements/announcement-form";

// Disable caching to always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewAnnouncementPage() {
  const supabase = await createClient();

  // 현재 사용자 정보 조회
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // professor 권한 확인
  const { data: member } = await supabase
    .from("members")
    .select("position")
    .eq("user_id", user.id)
    .single();

  if (member?.position !== "professor") {
    redirect("/announcements");
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back Button */}
      <Link href="/announcements">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          공지사항 목록
        </Button>
      </Link>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>새 공지사항 작성</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm />
        </CardContent>
      </Card>
    </div>
  );
}
