"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, X, Paperclip, Upload, File, User } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface TargetMember {
  id: string;
  name: string;
  avatar_url: string | null;
}

export default function NewMentoringPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetMemberId = searchParams.get("target");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [content, setContent] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [professorComments, setProfessorComments] = useState("");
  const [nextSteps, setNextSteps] = useState<string[]>([]);
  const [newStep, setNewStep] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [targetMember, setTargetMember] = useState<TargetMember | null>(null);

  // target 멤버 정보 조회
  useEffect(() => {
    async function fetchTargetMember() {
      if (!targetMemberId) return;

      const supabase = createClient();
      const { data } = await supabase
        .from("members")
        .select("id, name, avatar_url")
        .eq("id", targetMemberId)
        .single();

      if (data) {
        setTargetMember(data as TargetMember);
      }
    }

    fetchTargetMember();
  }, [targetMemberId]);

  function addNextStep() {
    if (newStep.trim()) {
      setNextSteps([...nextSteps, newStep.trim()]);
      setNewStep("");
    }
  }

  function removeNextStep(index: number) {
    setNextSteps(nextSteps.filter((_, i) => i !== index));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);

    for (const file of selectedFiles) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setError("허용되지 않는 파일 형식입니다. (pdf, docx, xlsx, pptx, png, jpg만 가능)");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("파일 크기가 10MB를 초과합니다.");
        return;
      }
    }

    setFiles([...files, ...selectedFiles]);
    setError(null);
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    // 현재 사용자의 member_id 가져오기
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      setError("로그인이 필요합니다.");
      setIsLoading(false);
      return;
    }

    // user.id 대신 email로 member 찾기
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("email", user.email)
      .single();

    if (!member) {
      setError("회원 정보를 찾을 수 없습니다. 관리자에게 문의하세요.");
      setIsLoading(false);
      return;
    }

    const memberData = member as { id: string };

    // 멘토링 포스트 생성 (meeting_date는 필수)
    if (!meetingDate) {
      setError("미팅 날짜를 선택해주세요.");
      setIsLoading(false);
      return;
    }

    const { data: post, error: insertError } = await supabase
      .from("mentoring_posts")
      .insert({
        author_id: memberData.id,
        target_member_id: targetMemberId || memberData.id,  // target이 없으면 작성자 본인
        content,
        meeting_date: meetingDate,
        professor_comment: professorComments || null,
        next_steps: nextSteps.length > 0 ? nextSteps : null,
      } as never)
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      setError("기록 생성 중 오류가 발생했습니다.");
      setIsLoading(false);
      return;
    }

    const postData = post as { id: string };

    // 파일 업로드
    if (files.length > 0) {
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${postData.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("mentoring-files")
          .upload(fileName, file);

        if (uploadError) {
          console.error("File upload error:", uploadError);
          continue;
        }

        // 파일 메타데이터 저장
        await supabase.from("files").insert({
          name: file.name,
          storage_path: fileName,
          mime_type: file.type,
          size: file.size,
          entity_type: "mentoring",
          entity_id: postData.id,
          uploaded_by: memberData.id,
        } as never);
      }
    }

    router.push(`/mentoring/${postData.id}`);
  }

  const backUrl = targetMemberId ? `/members/${targetMemberId}` : "/mentoring";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={backUrl}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            새 멘토링 기록 작성
          </h1>
          <p className="text-muted-foreground">
            {targetMember ? `${targetMember.name}님에 대한 ` : ""}멘토링 내용을 공유하세요
          </p>
        </div>
      </div>

      {/* 대상 멤버 표시 */}
      {targetMember && (
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">대상 연구원:</span>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={targetMember.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(targetMember.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{targetMember.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>기록 작성</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="meetingDate">미팅 날짜 *</Label>
              <Input
                id="meetingDate"
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                disabled={isLoading}
                className="w-full md:w-64"
              />
              <p className="text-xs text-muted-foreground">
                이재호 교수님과 미팅한 날짜를 선택하세요.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">논의 내용 *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="멘토링에서 논의한 내용을 작성하세요..."
                required
                disabled={isLoading}
                className="min-h-[200px] resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="professorComments">교수님 코멘트</Label>
              <Textarea
                id="professorComments"
                value={professorComments}
                onChange={(e) => setProfessorComments(e.target.value)}
                placeholder="교수님의 피드백이나 조언을 작성하세요..."
                disabled={isLoading}
                className="min-h-[100px] resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label>다음 단계 (Next Steps)</Label>
              <div className="flex gap-2">
                <Input
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  placeholder="다음에 할 일을 입력하세요"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addNextStep();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addNextStep}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {nextSteps.length > 0 && (
                <div className="space-y-2 mt-3 p-3 bg-muted/50 rounded-lg">
                  {nextSteps.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 bg-background px-3 py-2 rounded-md"
                    >
                      <span className="text-sm flex items-center gap-2">
                        <span className="text-muted-foreground">•</span>
                        {step}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeNextStep(index)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                + 항목 추가 버튼 또는 Enter 키로 추가할 수 있습니다.
              </p>
            </div>

            <div className="space-y-2">
              <Label>첨부파일</Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  <Paperclip className="h-4 w-4 inline mr-1" />
                  파일 선택 (최대 10MB, pdf/docx/xlsx/pptx/png/jpg)
                </p>
              </div>
              {files.length > 0 && (
                <div className="space-y-2 mt-3">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 bg-muted/50 px-3 py-2 rounded-md"
                    >
                      <span className="text-sm flex items-center gap-2 truncate">
                        <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-muted-foreground text-xs flex-shrink-0">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "저장 중..." : "저장"}
              </Button>
              <Link href={backUrl}>
                <Button type="button" variant="outline" disabled={isLoading}>
                  취소
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
