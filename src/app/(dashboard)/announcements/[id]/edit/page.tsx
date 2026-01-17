import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { AnnouncementForm } from "@/components/features/announcements/announcement-form";
import type { AnnouncementPriority } from "@/types/database.types";

// Disable caching to always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface EditAnnouncementPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAnnouncementPage({
  params,
}: EditAnnouncementPageProps) {
  const { id } = await params;
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

  // 공지사항 조회
  const { data: announcement, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !announcement) {
    notFound();
  }

  const typedAnnouncement = announcement as {
    id: string;
    title: string;
    content: string;
    priority: AnnouncementPriority;
    is_pinned: boolean;
    expires_at: string | null;
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back Button */}
      <Link href={`/announcements/${id}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          공지사항으로 돌아가기
        </Button>
      </Link>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>공지사항 수정</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm
            id={typedAnnouncement.id}
            defaultValues={{
              title: typedAnnouncement.title,
              content: typedAnnouncement.content,
              priority: typedAnnouncement.priority,
              is_pinned: typedAnnouncement.is_pinned,
              expires_at: typedAnnouncement.expires_at,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
