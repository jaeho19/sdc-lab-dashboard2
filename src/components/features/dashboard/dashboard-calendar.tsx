"use client";

import { useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { CALENDAR_CATEGORY_CONFIG } from "@/lib/constants";
import type { CalendarCategory } from "@/types/database.types";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CalendarEvent {
  id: string;
  title: string;
  start_date: string;
  end_date?: string | null;
  category: CalendarCategory;
  all_day: boolean;
}

interface DashboardCalendarProps {
  events: CalendarEvent[];
}

export function DashboardCalendar({ events }: DashboardCalendarProps) {
  const router = useRouter();

  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start_date,
    end: event.end_date || undefined,
    allDay: event.all_day,
    backgroundColor: CALENDAR_CATEGORY_CONFIG[event.category]?.color || "#6b7280",
    borderColor: CALENDAR_CATEGORY_CONFIG[event.category]?.color || "#6b7280",
  }));

  const handleEventClick = useCallback(() => {
    router.push("/calendar");
  }, [router]);

  const handleDateClick = useCallback(() => {
    router.push("/calendar");
  }, [router]);

  return (
    <Card>
      <CardHeader className="p-4 md:p-6 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Calendar className="h-4 w-4 md:h-5 md:w-5" />
          캘린더
        </CardTitle>
        <Link
          href="/calendar"
          className="text-xs md:text-sm text-primary hover:underline"
        >
          전체 보기
        </Link>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
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
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            selectable={false}
            editable={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}
