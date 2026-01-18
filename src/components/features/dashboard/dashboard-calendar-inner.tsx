"use client";

import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import type { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import { CALENDAR_CATEGORY_CONFIG } from "@/lib/constants";
import type { CalendarCategory } from "@/types/database.types";

interface CalendarEvent {
  id: string;
  title: string;
  start_date: string;
  end_date?: string | null;
  category: CalendarCategory;
  all_day: boolean;
}

interface DashboardCalendarInnerProps {
  events: CalendarEvent[];
  onEventClick: (clickInfo: EventClickArg) => void;
}

export function DashboardCalendarInner({
  events,
  onEventClick,
}: DashboardCalendarInnerProps) {
  // 이벤트 변환을 메모이제이션
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
      })),
    [events]
  );

  return (
    <div className="dashboard-mini-calendar">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        locale="ko"
        headerToolbar={{
          left: "prev",
          center: "title",
          right: "next",
        }}
        events={calendarEvents}
        height="auto"
        aspectRatio={1.2}
        dayMaxEvents={3}
        eventDisplay="block"
        displayEventTime={false}
        titleFormat={{
          year: "numeric",
          month: "short",
        }}
        dayHeaderFormat={{
          weekday: "narrow",
        }}
        eventClick={onEventClick}
        selectable={false}
        editable={false}
      />
    </div>
  );
}
