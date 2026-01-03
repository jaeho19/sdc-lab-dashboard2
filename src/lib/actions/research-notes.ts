"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MilestoneStage } from "@/types/database.types";

// Types
interface CreateNoteData {
  projectId: string;
  stage: MilestoneStage;
  milestoneId?: string;
  title: string;
  content: string;
  keywords: string[];
}

interface UpdateNoteData {
  title: string;
  content: string;
  keywords: string[];
  stage: MilestoneStage;
  milestoneId?: string;
}

// =====================
// 연구노트 CRUD
// =====================

export async function createResearchNote(data: CreateNoteData) {
  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 멤버 ID 조회
  const { data: memberData } = await supabase
    .from("members")
    .select("id")
    .eq("id", user.id)
    .single();

  const member = memberData as { id: string } | null;
  if (!member) {
    return { error: "멤버 정보를 찾을 수 없습니다." };
  }

  // 노트 생성
  const { data: noteData, error } = await supabase
    .from("research_notes")
    .insert({
      project_id: data.projectId,
      stage: data.stage,
      milestone_id: data.milestoneId || null,
      author_id: member.id,
      title: data.title,
      content: data.content,
      keywords: data.keywords,
    } as any)
    .select()
    .single();

  if (error) {
    console.error("Error creating research note:", error);
    return { error: "연구노트 생성에 실패했습니다." };
  }

  revalidatePath(`/research/${data.projectId}`);
  return { data: noteData };
}

export async function updateResearchNote(noteId: string, data: UpdateNoteData) {
  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 노트 조회 (권한 확인용)
  const { data: existingNoteData } = await supabase
    .from("research_notes")
    .select("author_id, project_id")
    .eq("id", noteId)
    .single();

  const existingNote = existingNoteData as { author_id: string; project_id: string } | null;
  if (!existingNote) {
    return { error: "노트를 찾을 수 없습니다." };
  }

  // 권한 확인 (작성자 또는 교수)
  const { data: currentMemberData } = await supabase
    .from("members")
    .select("id, position")
    .eq("id", user.id)
    .single();

  const currentMember = currentMemberData as { id: string; position: string } | null;
  const isAuthor = currentMember?.id === existingNote.author_id;
  const isAdmin = currentMember?.position === "professor";

  if (!isAuthor && !isAdmin) {
    return { error: "수정 권한이 없습니다." };
  }

  // 노트 수정
  const updateData = {
    title: data.title,
    content: data.content,
    keywords: data.keywords,
    stage: data.stage,
    milestone_id: data.milestoneId || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await (supabase as any)
    .from("research_notes")
    .update(updateData)
    .eq("id", noteId);

  if (error) {
    console.error("Error updating research note:", error);
    return { error: "연구노트 수정에 실패했습니다." };
  }

  revalidatePath(`/research/${existingNote.project_id}`);
  return { success: true };
}

export async function deleteResearchNote(noteId: string) {
  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 노트 조회 (권한 확인용)
  const { data: existingNoteData } = await supabase
    .from("research_notes")
    .select("author_id, project_id")
    .eq("id", noteId)
    .single();

  const existingNote = existingNoteData as { author_id: string; project_id: string } | null;
  if (!existingNote) {
    return { error: "노트를 찾을 수 없습니다." };
  }

  // 권한 확인 (작성자 또는 교수)
  const { data: currentMemberData } = await supabase
    .from("members")
    .select("id, position")
    .eq("id", user.id)
    .single();

  const currentMember = currentMemberData as { id: string; position: string } | null;
  const isAuthor = currentMember?.id === existingNote.author_id;
  const isAdmin = currentMember?.position === "professor";

  if (!isAuthor && !isAdmin) {
    return { error: "삭제 권한이 없습니다." };
  }

  // 관련 파일 삭제 (storage)
  const { data: filesData } = await supabase
    .from("files")
    .select("file_path")
    .eq("entity_type", "research_note")
    .eq("entity_id", noteId);

  const files = (filesData || []) as Array<{ file_path: string }>;
  if (files.length > 0) {
    const filePaths = files.map(f => f.file_path);
    await supabase.storage.from("research-notes").remove(filePaths);
  }

  // 파일 메타데이터 삭제
  await supabase
    .from("files")
    .delete()
    .eq("entity_type", "research_note")
    .eq("entity_id", noteId);

  // 노트 삭제 (댓글은 CASCADE로 자동 삭제)
  const { error } = await supabase
    .from("research_notes")
    .delete()
    .eq("id", noteId);

  if (error) {
    console.error("Error deleting research note:", error);
    return { error: "연구노트 삭제에 실패했습니다." };
  }

  revalidatePath(`/research/${existingNote.project_id}`);
  return { success: true };
}

// =====================
// 코멘트 CRUD
// =====================

export async function addNoteComment(noteId: string, content: string) {
  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 멤버 정보 조회
  const { data: memberData } = await supabase
    .from("members")
    .select("id, name")
    .eq("id", user.id)
    .single();

  const member = memberData as { id: string; name: string } | null;
  if (!member) {
    return { error: "멤버 정보를 찾을 수 없습니다." };
  }

  // 노트 정보 조회 (알림용)
  const { data: noteData } = await supabase
    .from("research_notes")
    .select("id, title, author_id, project_id")
    .eq("id", noteId)
    .single();

  const note = noteData as { id: string; title: string; author_id: string; project_id: string } | null;
  if (!note) {
    return { error: "노트를 찾을 수 없습니다." };
  }

  // 코멘트 추가
  const { data: commentData, error } = await supabase
    .from("research_note_comments")
    .insert({
      note_id: noteId,
      author_id: member.id,
      content,
    } as any)
    .select()
    .single();

  if (error) {
    console.error("Error adding comment:", error);
    return { error: "코멘트 추가에 실패했습니다." };
  }

  // 알림 생성 (자신의 노트가 아닌 경우)
  if (note.author_id !== member.id) {
    await supabase.from("notifications").insert({
      member_id: note.author_id,
      type: "research_note_comment",
      title: "연구노트에 새 코멘트",
      message: `${member.name}님이 "${note.title}"에 코멘트를 남겼습니다.`,
      entity_link: `/research/${note.project_id}`,
    } as any);
  }

  revalidatePath(`/research/${note.project_id}`);
  return { data: commentData };
}

export async function deleteNoteComment(commentId: string, projectId: string) {
  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 코멘트 조회 (권한 확인용)
  const { data: commentData } = await supabase
    .from("research_note_comments")
    .select("author_id")
    .eq("id", commentId)
    .single();

  const comment = commentData as { author_id: string } | null;
  if (!comment) {
    return { error: "코멘트를 찾을 수 없습니다." };
  }

  // 권한 확인 (작성자 또는 교수)
  const { data: currentMemberData } = await supabase
    .from("members")
    .select("id, position")
    .eq("id", user.id)
    .single();

  const currentMember = currentMemberData as { id: string; position: string } | null;
  const isAuthor = currentMember?.id === comment.author_id;
  const isAdmin = currentMember?.position === "professor";

  if (!isAuthor && !isAdmin) {
    return { error: "삭제 권한이 없습니다." };
  }

  // 코멘트 삭제
  const { error } = await supabase
    .from("research_note_comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error("Error deleting comment:", error);
    return { error: "코멘트 삭제에 실패했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}

// =====================
// 파일 업로드
// =====================

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadNoteFile(noteId: string, formData: FormData) {
  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 노트 조회 (권한 확인용)
  const { data: noteData } = await supabase
    .from("research_notes")
    .select("author_id, project_id")
    .eq("id", noteId)
    .single();

  const note = noteData as { author_id: string; project_id: string } | null;
  if (!note) {
    return { error: "노트를 찾을 수 없습니다." };
  }

  // 권한 확인 (작성자 또는 교수)
  const { data: currentMemberData } = await supabase
    .from("members")
    .select("id, position")
    .eq("id", user.id)
    .single();

  const currentMember = currentMemberData as { id: string; position: string } | null;
  const isAuthor = currentMember?.id === note.author_id;
  const isAdmin = currentMember?.position === "professor";

  if (!isAuthor && !isAdmin) {
    return { error: "업로드 권한이 없습니다." };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "파일이 없습니다." };
  }

  // 파일 유효성 검사
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { error: "허용되지 않는 파일 형식입니다." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "파일 크기는 10MB를 초과할 수 없습니다." };
  }

  // 파일명 생성
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split(".").pop();
  const filename = `${noteId}/${timestamp}_${randomStr}.${ext}`;

  // 파일 업로드
  const { error: uploadError } = await supabase.storage
    .from("research-notes")
    .upload(filename, file);

  if (uploadError) {
    console.error("Error uploading file:", uploadError);
    return { error: "파일 업로드에 실패했습니다." };
  }

  // 파일 메타데이터 저장
  const { data: fileData, error: dbError } = await supabase
    .from("files")
    .insert({
      filename,
      original_filename: file.name,
      file_path: filename,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: currentMember?.id,
      entity_type: "research_note",
      entity_id: noteId,
    } as any)
    .select()
    .single();

  if (dbError) {
    // 업로드 롤백
    await supabase.storage.from("research-notes").remove([filename]);
    console.error("Error saving file metadata:", dbError);
    return { error: "파일 정보 저장에 실패했습니다." };
  }

  revalidatePath(`/research/${note.project_id}`);
  return { data: fileData };
}

export async function deleteNoteFile(fileId: string, projectId: string) {
  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 파일 정보 조회
  const { data: fileData } = await supabase
    .from("files")
    .select("file_path, uploaded_by")
    .eq("id", fileId)
    .single();

  const file = fileData as { file_path: string; uploaded_by: string } | null;
  if (!file) {
    return { error: "파일을 찾을 수 없습니다." };
  }

  // 권한 확인 (업로더 또는 교수)
  const { data: currentMemberData } = await supabase
    .from("members")
    .select("id, position")
    .eq("id", user.id)
    .single();

  const currentMember = currentMemberData as { id: string; position: string } | null;
  const isUploader = currentMember?.id === file.uploaded_by;
  const isAdmin = currentMember?.position === "professor";

  if (!isUploader && !isAdmin) {
    return { error: "삭제 권한이 없습니다." };
  }

  // 스토리지에서 파일 삭제
  await supabase.storage.from("research-notes").remove([file.file_path]);

  // 메타데이터 삭제
  const { error } = await supabase
    .from("files")
    .delete()
    .eq("id", fileId);

  if (error) {
    console.error("Error deleting file:", error);
    return { error: "파일 삭제에 실패했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}

// =====================
// 전체 연구노트 조회
// =====================

export async function getAllResearchNotes(filters?: {
  authorId?: string;
  stage?: string;
  startDate?: string;
  endDate?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("research_notes")
    .select(`
      id,
      title,
      content,
      stage,
      keywords,
      created_at,
      updated_at,
      project:research_projects!research_notes_project_id_fkey (
        id,
        title
      ),
      author:members!research_notes_author_id_fkey (
        id,
        name,
        avatar_url,
        position
      )
    `)
    .order("created_at", { ascending: false });

  // 필터 적용
  if (filters?.authorId) {
    query = query.eq("author_id", filters.authorId);
  }
  if (filters?.stage) {
    query = query.eq("stage", filters.stage);
  }
  if (filters?.startDate) {
    query = query.gte("created_at", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching research notes:", error);
    return { error: "연구노트 조회에 실패했습니다." };
  }

  return { data };
}
