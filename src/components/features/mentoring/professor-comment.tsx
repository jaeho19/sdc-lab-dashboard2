"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GraduationCap, Edit, Loader2, MessageSquarePlus } from "lucide-react";
import { addProfessorComment } from "@/lib/actions/mentoring";

// Simple component for adding professor comment when none exists
interface ProfessorCommentProps {
  postId: string;
}

export function ProfessorComment({ postId }: ProfessorCommentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!comment.trim()) return;

    setIsLoading(true);
    const result = await addProfessorComment(postId, comment);

    if (result.error) {
      alert(result.error);
    } else {
      setIsEditing(false);
    }
    setIsLoading(false);
  };

  if (!isEditing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="mb-4"
      >
        <MessageSquarePlus className="h-4 w-4 mr-2" />
        교수 코멘트 추가
      </Button>
    );
  }

  return (
    <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 mb-4">
      <h4 className="font-medium mb-2 text-primary flex items-center gap-2">
        <GraduationCap className="h-4 w-4" />
        교수 코멘트 작성
      </h4>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mb-2"
        placeholder="코멘트를 작성하세요..."
      />
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsEditing(false);
            setComment("");
          }}
        >
          취소
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isLoading || !comment.trim()}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          저장
        </Button>
      </div>
    </div>
  );
}

// Full component with display and edit capabilities
interface ProfessorCommentSectionProps {
  postId: string;
  professorComment: string | null;
  isAdmin: boolean;
}

export function ProfessorCommentSection({
  postId,
  professorComment,
  isAdmin,
}: ProfessorCommentSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState(professorComment || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    const result = await addProfessorComment(postId, comment);

    if (result.error) {
      alert(result.error);
    } else {
      setIsEditing(false);
    }
    setIsLoading(false);
  };

  if (!professorComment && !isAdmin) {
    return null;
  }

  return (
    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold flex items-center gap-2 text-amber-800">
          <GraduationCap className="h-4 w-4" />
          교수 코멘트
        </h3>
        {isAdmin && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-7 text-amber-700 hover:text-amber-800"
          >
            <Edit className="h-3 w-3 mr-1" />
            {professorComment ? "수정" : "작성"}
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex min-h-24 w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
            placeholder="교수 코멘트를 작성하세요..."
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setComment(professorComment || "");
              }}
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-amber-800 whitespace-pre-wrap">
          {professorComment || "아직 코멘트가 없습니다."}
        </p>
      )}
    </div>
  );
}
