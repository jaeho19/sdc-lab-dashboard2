"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  createCalendarEventForm,
  updateCalendarEventForm,
  type CalendarFormState,
} from "@/lib/actions/calendar";
import type { CalendarEvent } from "@/types/database";

interface EventFormProps {
  event?: CalendarEvent;
  members: { id: string; name: string }[];
  onSuccess: () => void;
}

const initialState: CalendarFormState = {};

export function EventForm({ event, members, onSuccess }: EventFormProps) {
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [isPublic, setIsPublic] = useState(event?.is_public ?? true);

  const actionFn = event
    ? updateCalendarEventForm.bind(null, event.id)
    : createCalendarEventForm;

  const [state, formAction, isPending] = useActionState(
    async (prevState: CalendarFormState, formData: FormData) => {
      const result = await actionFn(prevState, formData);
      if (result.success) {
        onSuccess();
      }
      return result;
    },
    initialState
  );

  // 기존 이벤트 날짜/시간 파싱
  const parseDateTime = (dateStr: string | null) => {
    if (!dateStr) return { date: "", time: "" };
    const d = new Date(dateStr);
    return {
      date: d.toISOString().split("T")[0],
      time: d.toTimeString().slice(0, 5),
    };
  };

  const startParsed = parseDateTime(event?.start_date ?? null);
  const endParsed = parseDateTime(event?.end_date ?? null);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">제목 *</Label>
        <Input
          id="title"
          name="title"
          placeholder="일정 제목"
          defaultValue={event?.title}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <textarea
          id="description"
          name="description"
          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="일정에 대한 설명"
          defaultValue={event?.description || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">카테고리</Label>
        <Select name="category" defaultValue={event?.category || "other"}>
          <SelectTrigger>
            <SelectValue placeholder="카테고리 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="meeting">미팅</SelectItem>
            <SelectItem value="deadline">마감</SelectItem>
            <SelectItem value="seminar">세미나</SelectItem>
            <SelectItem value="holiday">휴일</SelectItem>
            <SelectItem value="personal">개인</SelectItem>
            <SelectItem value="other">기타</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="all_day"
          name="all_day"
          checked={allDay}
          onCheckedChange={(checked) => setAllDay(checked === true)}
          value="true"
        />
        <input type="hidden" name="all_day" value={allDay ? "true" : "false"} />
        <Label htmlFor="all_day" className="font-normal">
          종일
        </Label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start_date">시작일 *</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={startParsed.date}
            required
          />
        </div>
        {!allDay && (
          <div className="space-y-2">
            <Label htmlFor="start_time">시작 시간</Label>
            <Input
              id="start_time"
              name="start_time"
              type="time"
              defaultValue={startParsed.time}
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="end_date">종료일</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={endParsed.date}
          />
        </div>
        {!allDay && (
          <div className="space-y-2">
            <Label htmlFor="end_time">종료 시간</Label>
            <Input
              id="end_time"
              name="end_time"
              type="time"
              defaultValue={endParsed.time}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="member_id">담당자</Label>
        <Select name="member_id" defaultValue={event?.member_id || ""}>
          <SelectTrigger>
            <SelectValue placeholder="담당자 선택 (선택사항)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">없음</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="is_public"
          checked={isPublic}
          onCheckedChange={(checked) => setIsPublic(checked === true)}
        />
        <input type="hidden" name="is_public" value={isPublic ? "true" : "false"} />
        <Label htmlFor="is_public" className="font-normal">
          전체 공개
        </Label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {event ? "수정" : "생성"}
        </Button>
      </div>
    </form>
  );
}
