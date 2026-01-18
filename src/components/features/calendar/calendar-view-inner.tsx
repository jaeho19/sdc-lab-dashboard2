"use client";

import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, DateSelectArg } from "@fullcalendar/core";
import { CALENDAR_CATEGORY_CONFIG } from "@/lib/constants";
import type { CalendarCategory } from "@/types/database.types";

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

interface CalendarViewInnerProps {
  events: CalendarEvent[];
  onDateSelect: (selectInfo: DateSelectArg) => void;
  onEventClick: (clickInfo: EventClickArg) => void;
  onEventDrop: (info: {
    event: { id: string; start: Date | null; end: Date | null };
  }) => void;
}

export function CalendarViewInner({
  events,
  onDateSelect,
  onEventClick,
  onEventDrop,
}: CalendarViewInnerProps) {
  // FullCalendar 이벤트 형식으로 변환 (메모이제이션)
  const calendarEvents = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start_date,
        end: event.end_date || undefined,
        allDay: event.all_day,
        backgroundColor:
          CALENDAR_CATEGORY_CONFIG[event.category]?.color || "#6b7280",
        borderColor:
          CALENDAR_CATEGORY_CONFIG[event.category]?.color || "#6b7280",
        extendedProps: {
          description: event.description,
          category: event.category,
          is_public: event.is_public,
        },
      })),
    [events]
  );

  return (
    <div className="bg-white rounded-lg border p-2 md:p-4 calendar-mobile">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ko"
        headerToolbar={{
          left: "prev,next",
          center: "title",
          right: "today",
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
        dayMaxEvents={2}
        weekends={true}
        select={onDateSelect}
        eventClick={onEventClick}
        eventDrop={onEventDrop}
        height="auto"
        aspectRatio={1.2}
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
  );
}
