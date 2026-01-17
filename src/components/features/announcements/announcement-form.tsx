"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions/announcements";
import { useRouter } from "next/navigation";
import type { AnnouncementPriority } from "@/types/database.types";

interface AnnouncementFormProps {
  id?: string;
  defaultValues?: {
    title: string;
    content: string;
    priority: AnnouncementPriority;
    is_pinned: boolean;
    expires_at: string | null;
  };
}

export function AnnouncementForm({ id, defaultValues }: AnnouncementFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(defaultValues?.title || "");
  const [content, setContent] = useState(defaultValues?.content || "");
  const [priority, setPriority] = useState<AnnouncementPriority>(
    defaultValues?.priority || "normal"
  );
  const [isPinned, setIsPinned] = useState(defaultValues?.is_pinned || false);
  const [expiresAt, setExpiresAt] = useState(
    defaultValues?.expires_at ? defaultValues.expires_at.split("T")[0] : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("priority", priority);
      formData.append("is_pinned", isPinned.toString());
      if (expiresAt) {
        formData.append("expires_at", new Date(expiresAt).toISOString());
      }

      const result = id
        ? await updateAnnouncement(id, formData)
        : await createAnnouncement(formData);

      if (result.error) {
        setError(result.error);
      } else {
        router.push(id ? `/announcements/${id}` : "/announcements");
        router.refresh();
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* 제목 */}
      <div className="space-y-2">
        <Label htmlFor="title">제목 *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="공지사항 제목을 입력하세요"
          required
        />
      </div>

      {/* 내용 */}
      <div className="space-y-2">
        <Label htmlFor="content">내용 *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="공지사항 내용을 입력하세요"
          rows={8}
          required
        />
      </div>

      {/* 우선순위 */}
      <div className="space-y-2">
        <Label htmlFor="priority">우선순위</Label>
        <Select value={priority} onValueChange={(value) => setPriority(value as AnnouncementPriority)}>
          <SelectTrigger>
            <SelectValue placeholder="우선순위 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">일반</SelectItem>
            <SelectItem value="important">중요</SelectItem>
            <SelectItem value="urgent">긴급</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 상단 고정 */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_pinned"
          checked={isPinned}
          onCheckedChange={(checked) => setIsPinned(checked === true)}
        />
        <Label htmlFor="is_pinned" className="cursor-pointer">
          상단에 고정
        </Label>
      </div>

      {/* 만료일 */}
      <div className="space-y-2">
        <Label htmlFor="expires_at">만료일 (선택)</Label>
        <Input
          id="expires_at"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          만료일이 지나면 공지사항이 자동으로 숨겨집니다. 비워두면 무기한 표시됩니다.
        </p>
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : id ? "수정" : "등록"}
        </Button>
      </div>
    </form>
  );
}
