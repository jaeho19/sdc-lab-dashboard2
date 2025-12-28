"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Clock, User, Tag, Globe, Lock, Edit, Trash2 } from "lucide-react";
import { EventForm } from "./event-form";
import { deleteCalendarEvent } from "@/lib/actions/calendar";
import type { CalendarEvent } from "@/types/database";

interface EventDetailProps {
  event: CalendarEvent;
  members: { id: string; name: string }[];
  currentUserId?: string;
  isAdmin: boolean;
  onClose: () => void;
}

const categoryLabels: Record<string, string> = {
  meeting: "미팅",
  deadline: "마감",
  seminar: "세미나",
  holiday: "휴일",
  personal: "개인",
  other: "기타",
};

const categoryColors: Record<string, string> = {
  meeting: "bg-blue-100 text-blue-700",
  deadline: "bg-red-100 text-red-700",
  seminar: "bg-purple-100 text-purple-700",
  holiday: "bg-green-100 text-green-700",
  personal: "bg-slate-100 text-slate-700",
  other: "bg-gray-100 text-gray-700",
};

export function EventDetail({
  event,
  members,
  currentUserId,
  isAdmin,
  onClose,
}: EventDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canModify = isAdmin || event.created_by === currentUserId;

  const assignedMember = members.find((m) => m.id === event.member_id);

  const formatDate = (dateStr: string, allDay: boolean) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    };
    if (!allDay) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
    return date.toLocaleDateString("ko-KR", options);
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 일정을 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    const result = await deleteCalendarEvent(event.id);
    setIsDeleting(false);

    if (result.success) {
      onClose();
    } else {
      alert(result.error || "삭제에 실패했습니다.");
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <EventForm
          event={event}
          members={members}
          onSuccess={() => {
            setIsEditing(false);
            onClose();
          }}
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsEditing(false)}
        >
          취소
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title & Category */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              categoryColors[event.category]
            }`}
          >
            {categoryLabels[event.category]}
          </span>
          {event.is_public ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              공개
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              비공개
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold">{event.title}</h3>
      </div>

      {/* Description */}
      {event.description && (
        <p className="text-sm text-muted-foreground">{event.description}</p>
      )}

      {/* Date/Time */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(event.start_date, event.all_day)}</span>
        </div>
        {event.end_date && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>~ {formatDate(event.end_date, event.all_day)}</span>
          </div>
        )}
        {event.all_day && (
          <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            종일
          </span>
        )}
      </div>

      {/* Assigned Member */}
      {assignedMember && (
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{assignedMember.name}</span>
        </div>
      )}

      {/* Actions */}
      {canModify && (
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            수정
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </Button>
        </div>
      )}
    </div>
  );
}
