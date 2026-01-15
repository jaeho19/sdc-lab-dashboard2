"use client";

import { useState, useEffect, useCallback } from "react";
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

// 30분 단위 시간 옵션 생성 (구글 캘린더 스타일)
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const period = hours < 12 ? "오전" : "오후";
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const label = `${period} ${hour12}:${String(minutes).padStart(2, "0")}`;
  return { value, label };
});

// 시간을 가장 가까운 30분 단위로 변환 (HH:MM -> HH:00 or HH:30)
const roundToHalfHour = (timeStr: string) => {
  const [hoursStr, minutesStr] = timeStr.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  const roundedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 0;
  const roundedHours = minutes >= 45 ? (hours + 1) % 24 : hours;
  return `${String(roundedHours).padStart(2, "0")}:${String(roundedMinutes).padStart(2, "0")}`;
};

// 시작 시간에 30분을 더한 종료 시간 계산
const addMinutesToTime = (timeStr: string, minutesToAdd: number) => {
  const [hoursStr, minutesStr] = timeStr.split(":");
  const totalMinutes = parseInt(hoursStr, 10) * 60 + parseInt(minutesStr, 10) + minutesToAdd;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
};

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
  const [category, setCategory] = useState<CalendarCategory>("meeting");
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
      // 기존 시간을 30분 단위로 변환 (드롭다운 호환)
      const startTimeRaw = start.toTimeString().slice(0, 5);
      setStartTime(roundToHalfHour(startTimeRaw));
      if (event.end_date) {
        const end = new Date(event.end_date);
        setEndDate(formatLocalDate(end));
        const endTimeRaw = end.toTimeString().slice(0, 5);
        setEndTime(roundToHalfHour(endTimeRaw));
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
      setEndTime("09:30"); // 기본 30분 미팅
      setIsAllDay(false);
      setCategory("meeting");
      setIsShared(true);
    }
  }

  // 시작 시간 변경 시 종료 시간을 자동으로 +30분 설정 (구글 캘린더 스타일)
  const handleStartTimeChange = useCallback((value: string) => {
    setStartTime(value);
    // 종료 시간을 시작 시간 + 30분으로 설정
    const newEndTime = addMinutesToTime(value, 30);
    setEndTime(newEndTime);
    // 시작 시간이 23:30인 경우 종료일도 다음날로 설정
    const [hoursStr] = value.split(":");
    const hours = parseInt(hoursStr, 10);
    const [, minutesStr] = value.split(":");
    const minutes = parseInt(minutesStr, 10);
    if (hours === 23 && minutes === 30 && startDate) {
      const nextDay = new Date(startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setEndDate(formatLocalDate(nextDay));
    } else if (startDate) {
      setEndDate(startDate);
    }
  }, [startDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startDate) return;

    setLoading(true);

    // 타임존 버그 수정: 로컬 Date 객체를 생성한 후 ISO 문자열로 변환
    // 이렇게 하면 타임존 정보가 포함되어 서버에서 올바르게 처리됨
    let startDateStr: string;
    if (isAllDay) {
      // 종일 이벤트는 날짜만 사용
      startDateStr = `${startDate}T00:00:00`;
    } else {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      startDateStr = startDateTime.toISOString();
    }

    let endDateStr: string | null = null;
    if (endDate && !isAllDay) {
      const endDateTime = new Date(`${endDate}T${endTime}`);
      endDateStr = endDateTime.toISOString();
    }

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
                <Label>시작 시간</Label>
                <Select value={startTime} onValueChange={handleStartTimeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="시간 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>종료 시간</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="시간 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
