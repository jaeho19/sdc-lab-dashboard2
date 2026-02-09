"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyAdmins } from "@/lib/actions/notifications";

export interface MentoringFormState {
  error?: string;
  success?: boolean;
}

export async function createMentoringPost(
  prevState: MentoringFormState,
  formData: FormData
): Promise<MentoringFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const meetingDate = formData.get("meeting_date") as string;
  const content = formData.get("content") as string;
  const nextStepsStr = formData.get("next_steps") as string;

  if (!meetingDate || !content) {
    return { error: "미팅 날짜와 내용을 입력해주세요." };
  }

  const nextSteps = nextStepsStr
    ? nextStepsStr.split("\n").filter((s) => s.trim())
    : null;

  const { data: post, error } = (await supabase
    .from("mentoring_posts")
    .insert({
      author_id: user.id,
      meeting_date: meetingDate,
      content,
      next_steps: nextSteps,
    } as never)
    .select()
    .single()) as { data: { id: string } | null; error: unknown };

  if (error || !post) {
    console.error("Create mentoring post error:", error);
    return { error: "멘토링 기록 생성에 실패했습니다." };
  }

  // 관리자 알림
  const { data: actorMember } = await supabase
    .from("members")
    .select("name")
    .eq("id", user.id)
    .single();
  const actorName = (actorMember as { name: string } | null)?.name || "멤버";

  await notifyAdmins({
    actorId: user.id,
    actorName,
    title: "멘토링 기록 등록",
    message: `${actorName}님이 멘토링 기록을 등록했습니다 (${meetingDate})`,
    link: `/mentoring/${post.id}`,
  });

  revalidatePath("/mentoring");
  redirect(`/mentoring/${post.id}`);
}

export async function updateMentoringPost(
  postId: string,
  prevState: MentoringFormState,
  formData: FormData
): Promise<MentoringFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const meetingDate = formData.get("meeting_date") as string;
  const content = formData.get("content") as string;
  const nextStepsStr = formData.get("next_steps") as string;
  const professorComment = formData.get("professor_comment") as string;

  if (!meetingDate || !content) {
    return { error: "미팅 날짜와 내용을 입력해주세요." };
  }

  const nextSteps = nextStepsStr
    ? nextStepsStr.split("\n").filter((s) => s.trim())
    : null;

  const { error } = (await supabase
    .from("mentoring_posts")
    .update({
      meeting_date: meetingDate,
      content,
      next_steps: nextSteps,
      professor_comment: professorComment || null,
    } as never)
    .eq("id", postId)) as { error: unknown };

  if (error) {
    console.error("Update mentoring post error:", error);
    return { error: "멘토링 기록 수정에 실패했습니다." };
  }

  // 관리자 알림
  const { data: actorMember } = await supabase
    .from("members")
    .select("name")
    .eq("id", user.id)
    .single();
  const actorName = (actorMember as { name: string } | null)?.name || "멤버";

  await notifyAdmins({
    actorId: user.id,
    actorName,
    title: "멘토링 기록 수정",
    message: `${actorName}님이 멘토링 기록을 수정했습니다 (${meetingDate})`,
    link: `/mentoring/${postId}`,
  });

  revalidatePath("/mentoring");
  revalidatePath(`/mentoring/${postId}`);
  redirect(`/mentoring/${postId}`);
}

export async function deleteMentoringPost(
  postId: string
): Promise<MentoringFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = (await supabase
    .from("mentoring_posts")
    .delete()
    .eq("id", postId)) as { error: unknown };

  if (error) {
    console.error("Delete mentoring post error:", error);
    return { error: "멘토링 기록 삭제에 실패했습니다." };
  }

  revalidatePath("/mentoring");
  redirect("/mentoring");
}

export async function addComment(
  postId: string,
  formData: FormData
): Promise<MentoringFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: "로그인이 필요합니다." };
  }

  // user email로 member id 찾기
  const { data: member } = await supabase
    .from("members")
    .select("id, name")
    .eq("email", user.email)
    .single();

  if (!member) {
    return { error: "회원 정보를 찾을 수 없습니다." };
  }

  const memberData = member as { id: string; name: string };
  const content = formData.get("content") as string;

  if (!content) {
    return { error: "댓글 내용을 입력해주세요." };
  }

  const { error } = (await supabase.from("mentoring_comments").insert({
    post_id: postId,
    author_id: memberData.id,
    content,
  } as never)) as { error: unknown };

  if (error) {
    console.error("Add comment error:", error);
    return { error: "댓글 작성에 실패했습니다." };
  }

  // 게시물 작성자에게 인앱 알림 발송
  try {
    const { data: post } = await supabase
      .from("mentoring_posts")
      .select("id, author_id")
      .eq("id", postId)
      .single();

    if (post) {
      const postData = post as { id: string; author_id: string };

      // 본인 게시물에 댓글 달면 알림 안 보냄
      if (postData.author_id !== memberData.id) {
        await supabase.from("notifications").insert({
          member_id: postData.author_id,
          type: "comment",
          title: "새 댓글",
          message: `${memberData.name}님이 회원님의 게시물에 댓글을 남겼습니다.`,
          link: `/mentoring/${postId}`,
          is_read: false,
        } as never);
      }
    }
  } catch (notifError) {
    console.error("Comment notification error:", notifError);
  }

  revalidatePath(`/mentoring/${postId}`);
  return { success: true };
}

export async function deleteComment(
  commentId: string,
  postId: string
): Promise<MentoringFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = (await supabase
    .from("mentoring_comments")
    .delete()
    .eq("id", commentId)) as { error: unknown };

  if (error) {
    console.error("Delete comment error:", error);
    return { error: "댓글 삭제에 실패했습니다." };
  }

  revalidatePath(`/mentoring/${postId}`);
  return { success: true };
}

export async function toggleLike(postId: string): Promise<MentoringFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: "로그인이 필요합니다." };
  }

  // 현재 사용자 정보 가져오기
  const { data: currentMember } = await supabase
    .from("members")
    .select("id, name")
    .eq("email", user.email)
    .single();

  if (!currentMember) {
    return { error: "회원 정보를 찾을 수 없습니다." };
  }

  const currentMemberData = currentMember as { id: string; name: string };

  // 좋아요 존재 여부 확인
  const { data: existingLike } = (await supabase
    .from("mentoring_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("member_id", currentMemberData.id)
    .single()) as { data: { id: string } | null; error: unknown };

  if (existingLike) {
    // 좋아요 취소
    const { error } = (await supabase
      .from("mentoring_likes")
      .delete()
      .eq("id", existingLike.id)) as { error: unknown };

    if (error) {
      console.error("Unlike error:", error);
      return { error: "좋아요 취소에 실패했습니다." };
    }
  } else {
    // 좋아요 추가
    const { error } = (await supabase.from("mentoring_likes").insert({
      post_id: postId,
      member_id: currentMemberData.id,
    } as never)) as { error: unknown };

    if (error) {
      console.error("Like error:", error);
      return { error: "좋아요에 실패했습니다." };
    }

    // 게시물 작성자에게 인앱 알림 발송 (좋아요 추가 시에만)
    try {
      const { data: post } = await supabase
        .from("mentoring_posts")
        .select("id, author_id")
        .eq("id", postId)
        .single();

      if (post) {
        const postData = post as { id: string; author_id: string };

        // 본인 게시물에 좋아요하면 알림 안 보냄
        if (postData.author_id !== currentMemberData.id) {
          await supabase.from("notifications").insert({
            member_id: postData.author_id,
            type: "like",
            title: "좋아요",
            message: `${currentMemberData.name}님이 회원님의 게시물을 좋아합니다.`,
            link: `/mentoring/${postId}`,
            is_read: false,
          } as never);
        }
      }
    } catch (notifError) {
      console.error("Like notification error:", notifError);
    }
  }

  revalidatePath(`/mentoring/${postId}`);
  revalidatePath("/mentoring");
  return { success: true };
}

export async function addProfessorComment(
  postId: string,
  comment: string
): Promise<MentoringFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = (await supabase
    .from("mentoring_posts")
    .update({
      professor_comment: comment,
    } as never)
    .eq("id", postId)) as { error: unknown };

  if (error) {
    console.error("Add professor comment error:", error);
    return { error: "교수 코멘트 작성에 실패했습니다." };
  }

  revalidatePath(`/mentoring/${postId}`);
  return { success: true };
}

export async function uploadMentoringFile(
  postId: string,
  formData: FormData
): Promise<MentoringFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: "로그인이 필요합니다." };
  }

  // Check if user is professor
  const { data: member } = await supabase
    .from("members")
    .select("id, position")
    .eq("email", user.email)
    .single();

  if (!member) {
    return { error: "회원 정보를 찾을 수 없습니다." };
  }

  const memberData = member as { id: string; position: string };

  // Check if post exists
  const { data: post } = await supabase
    .from("mentoring_posts")
    .select("id, author_id")
    .eq("id", postId)
    .single();

  if (!post) {
    return { error: "멘토링 기록을 찾을 수 없습니다." };
  }

  const postData = post as { id: string; author_id: string };
  const isAuthor = memberData.id === postData.author_id;
  const isAdmin = memberData.position === "professor";

  // Only author or professor can upload files
  if (!isAuthor && !isAdmin) {
    return { error: "파일 업로드 권한이 없습니다." };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "파일을 선택해주세요." };
  }

  // Validate file type
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/png",
    "image/jpeg",
  ];

  if (!allowedTypes.includes(file.type)) {
    return { error: "허용되지 않는 파일 형식입니다. (PDF, DOCX, XLSX, PPTX, PNG, JPG만 허용)" };
  }

  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { error: "파일 크기는 10MB를 초과할 수 없습니다." };
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split(".").pop();
  const filename = `${postId}/${timestamp}_${randomStr}.${ext}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("mentoring-files")
    .upload(filename, file);

  if (uploadError) {
    console.error("File upload error:", uploadError);
    return { error: "파일 업로드에 실패했습니다." };
  }

  // Save file metadata
  const { error: dbError } = (await supabase.from("files").insert({
    filename: filename,
    original_filename: file.name,
    storage_path: filename,
    mime_type: file.type,
    file_size: file.size,
    entity_type: "mentoring",
    entity_id: postId,
    uploaded_by: memberData.id,
  } as never)) as { error: unknown };

  if (dbError) {
    console.error("File metadata save error:", dbError);
    // Try to delete uploaded file
    await supabase.storage.from("mentoring-files").remove([filename]);
    return { error: "파일 정보 저장에 실패했습니다." };
  }

  revalidatePath(`/mentoring/${postId}`);
  return { success: true };
}
