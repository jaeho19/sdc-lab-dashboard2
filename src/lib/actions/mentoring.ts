"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    .select("id")
    .eq("email", user.email)
    .single();

  if (!member) {
    return { error: "회원 정보를 찾을 수 없습니다." };
  }

  const memberData = member as { id: string };
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

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 좋아요 존재 여부 확인
  const { data: existingLike } = (await supabase
    .from("mentoring_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("member_id", user.id)
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
      member_id: user.id,
    } as never)) as { error: unknown };

    if (error) {
      console.error("Like error:", error);
      return { error: "좋아요에 실패했습니다." };
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
