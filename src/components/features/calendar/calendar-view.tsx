"use client";

import { useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, DateSelectArg } from "@fullcalendar/core";
import { CALENDAR_CATEGORY_CONFIG } from "@/lib/constants";
import type { CalendarCategory } from "@/types/database.types";
import { EventModal } from "./event-modal";
import { updateEventDates } from "@/lib/actions/calendar";
import { useRouter } from "next/navigation";

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

  // FullCalendar 이벤트 형식으로 변환
  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start_date,
    end: event.end_date || undefined,
    allDay: event.all_day,
    backgroundColor: CALENDAR_CATEGORY_CONFIG[event.category]?.color || "#6b7280",
    borderColor: CALENDAR_CATEGORY_CONFIG[event.category]?.color || "#6b7280",
    extendedProps: {
      description: event.description,
      category: event.category,
      is_public: event.is_public,
    },
  }));

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
    async (info: { event: { id: string; start: Date | null; end: Date | null } }) => {
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

  return (
    <>
      <div className="bg-white rounded-lg border p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="ko"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek",
          }}
          buttonText={{
            today: "오늘",
            month: "월",
            week: "주",
          }}
          events={calendarEvents}
          selectable={true}
          selectMirror={true}
          editable={true}
          dayMaxEvents={3}
          weekends={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          height="auto"
          aspectRatio={1.8}
          eventDisplay="block"
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
            hour12: false,
          }}
          dayHeaderFormat={{
            weekday: "short",
          }}
          titleFormat={{
            year: "numeric",
            month: "long",
          }}
        />
      </div>

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
