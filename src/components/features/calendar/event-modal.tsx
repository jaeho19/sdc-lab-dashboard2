"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CALENDAR_CATEGORY_CONFIG } from "@/lib/constants";
import type { CalendarCategory } from "@/types/database.types";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/actions/calendar";
import { Loader2, Trash2 } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  category: CalendarCategory;
  is_public: boolean;
}

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  defaultDate?: Date | null;
  onSuccess?: () => void;
}

export function EventModal({
  open,
  onOpenChange,
  event,
  defaultDate,
  onSuccess,
}: EventModalProps) {
  const isEditing = !!event;
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [isAllDay, setIsAllDay] = useState(false);
  const [category, setCategory] = useState<CalendarCategory>("lab_meeting");
  const [isShared, setIsShared] = useState(true);

  // 로컬 타임존 기준으로 날짜 문자열 생성 (YYYY-MM-DD)
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      const start = new Date(event.start_date);
      setStartDate(formatLocalDate(start));
      setStartTime(start.toTimeString().slice(0, 5));
      if (event.end_date) {
        const end = new Date(event.end_date);
        setEndDate(formatLocalDate(end));
        setEndTime(end.toTimeString().slice(0, 5));
      } else {
        setEndDate("");
        setEndTime("");
      }
      setIsAllDay(event.all_day);
      setCategory(event.category);
      setIsShared(event.is_public);
    } else if (defaultDate) {
      const dateStr = formatLocalDate(defaultDate);
      setStartDate(dateStr);
      setEndDate(dateStr);
      resetForm();
    } else {
      resetForm();
    }
  }, [event, defaultDate, open]);

  function resetForm() {
    if (!event) {
      setTitle("");
      setDescription("");
      setStartTime("09:00");
      setEndTime("10:00");
      setIsAllDay(false);
      setCategory("lab_meeting");
      setIsShared(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startDate) return;

    setLoading(true);

    const startDateStr = isAllDay
      ? `${startDate}T00:00:00`
      : `${startDate}T${startTime}:00`;

    const endDateStr =
      endDate && !isAllDay ? `${endDate}T${endTime}:00` : null;

    const input = {
      title: title.trim(),
      description: description.trim() || null,
      start_date: startDateStr,
      end_date: endDateStr,
      all_day: isAllDay,
      category,
      is_public: isShared,
    };

    try {
      const result = isEditing
        ? await updateCalendarEvent(event.id, input)
        : await createCalendarEvent(input);

      if (result.error) {
        console.error(result.error);
        alert("저장에 실패했습니다.");
      } else {
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error(error);
      alert("저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!event || !confirm("정말 삭제하시겠습니까?")) return;

    setDeleting(true);
    try {
      const result = await deleteCalendarEvent(event.id);
      if (result.error) {
        console.error(result.error);
        alert("삭제에 실패했습니다.");
      } else {
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error(error);
      alert("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "일정 수정" : "새 일정"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="일정 제목"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="일정 설명 (선택)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as CalendarCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CALENDAR_CATEGORY_CONFIG).map(
                  ([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        {config.label}
                      </div>
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_all_day"
              checked={isAllDay}
              onCheckedChange={(checked) => setIsAllDay(checked === true)}
            />
            <Label htmlFor="is_all_day" className="cursor-pointer">
              종일
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">시작일 *</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            {!isAllDay && (
              <div className="space-y-2">
                <Label htmlFor="start_time">시작 시간</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            )}
          </div>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="end_date">종료일</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">종료 시간</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_shared"
              checked={isShared}
              onCheckedChange={(checked) => setIsShared(checked === true)}
            />
            <Label htmlFor="is_shared" className="cursor-pointer">
              공용 일정 (모든 연구원에게 공개)
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting || loading}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="ml-2">삭제</span>
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isEditing ? "수정" : "저장"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
