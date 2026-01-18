"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { EventClickArg, DateSelectArg } from "@fullcalendar/core";
import type { CalendarCategory } from "@/types/database.types";
import { EventModal } from "./event-modal";
import { updateEventDates } from "@/lib/actions/calendar";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

// FullCalendar를 동적 임포트 (SSR 비활성화)
const CalendarViewInner = dynamic(
  () => import("./calendar-view-inner").then((mod) => mod.CalendarViewInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px] bg-white rounded-lg border">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

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

interface CalendarViewProps {
  events: CalendarEvent[];
}

export function CalendarView({ events }: CalendarViewProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 날짜 클릭 핸들러
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    setSelectedEvent(null);
    setSelectedDate(selectInfo.start);
    setModalOpen(true);
  }, []);

  // 이벤트 클릭 핸들러
  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const eventId = clickInfo.event.id;
      const event = events.find((e) => e.id === eventId);
      if (event) {
        setSelectedEvent(event);
        setSelectedDate(null);
        setModalOpen(true);
      }
    },
    [events]
  );

  // 드래그 앤 드롭 핸들러
  const handleEventDrop = useCallback(
    async (info: {
      event: { id: string; start: Date | null; end: Date | null };
    }) => {
      const { id, start, end } = info.event;
      if (!start) return;

      const startDatetime = start.toISOString();
      const endDatetime = end ? end.toISOString() : null;

      const result = await updateEventDates(id, startDatetime, endDatetime);
      if (result.error) {
        console.error(result.error);
        alert("일정 이동에 실패했습니다.");
        router.refresh();
      }
    },
    [router]
  );

  const handleSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  // + 버튼 클릭 핸들러 (오늘 날짜로 새 일정 생성)
  const handleAddClick = useCallback(() => {
    setSelectedEvent(null);
    setSelectedDate(new Date());
    setModalOpen(true);
  }, []);

  return (
    <>
      {/* 안내 메시지 및 추가 버튼 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <p className="text-xs md:text-sm text-muted-foreground">
          날짜를 클릭하여 새 일정을 추가하거나, 일정을 드래그하여 날짜를 변경할
          수 있습니다.
        </p>
        <Button size="sm" onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-1" />
          일정 추가
        </Button>
      </div>

      <CalendarViewInner
        events={events}
        onDateSelect={handleDateSelect}
        onEventClick={handleEventClick}
        onEventDrop={handleEventDrop}
      />

      <EventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        event={selectedEvent}
        defaultDate={selectedDate}
        onSuccess={handleSuccess}
      />
    </>
  );
}
