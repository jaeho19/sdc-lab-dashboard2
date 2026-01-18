"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import type { EventClickArg } from "@fullcalendar/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, X, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CALENDAR_CATEGORY_CONFIG } from "@/lib/constants";
import type { CalendarCategory } from "@/types/database.types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EventModal } from "@/components/features/calendar/event-modal";

// FullCalendar를 동적 임포트 (SSR 비활성화)
const DashboardCalendarInner = dynamic(
  () =>
    import("./dashboard-calendar-inner").then(
      (mod) => mod.DashboardCalendarInner
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

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
  className?: string;
}

export function DashboardCalendar({
  events,
  className,
}: DashboardCalendarProps) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // + 버튼 클릭 핸들러 (오늘 날짜로 새 일정 생성)
  const handleAddClick = useCallback(() => {
    setSelectedDate(new Date());
    setModalOpen(true);
  }, []);

  // 일정 생성 성공 시 새로고침
  const handleSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const eventId = clickInfo.event.id;
      const event = events.find((e) => e.id === eventId);
      if (event) {
        // Toggle: 같은 이벤트 클릭 시 닫기, 다른 이벤트 클릭 시 변경
        setSelectedEvent((prev) => (prev?.id === event.id ? null : event));
      }
    },
    [events]
  );

  const formatEventDate = (dateStr: string, allDay: boolean) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
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

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="p-4 md:p-6 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Calendar className="h-4 w-4 md:h-5 md:w-5" />
          캘린더
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleAddClick}
            title="일정 추가"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Link
            href="/calendar"
            className="text-xs md:text-sm text-primary hover:underline"
          >
            전체 보기
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0 flex-1">
        <DashboardCalendarInner
          events={events}
          onEventClick={handleEventClick}
        />

        {/* 선택된 이벤트 상세 정보 */}
        {selectedEvent && (
          <div className="mt-4 p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <Badge
                style={{
                  backgroundColor:
                    CALENDAR_CATEGORY_CONFIG[selectedEvent.category]?.color ||
                    "#6b7280",
                  color: "white",
                }}
              >
                {CALENDAR_CATEGORY_CONFIG[selectedEvent.category]?.label ||
                  "일정"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setSelectedEvent(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <h4 className="font-semibold text-sm md:text-base mb-1">
              {selectedEvent.title}
            </h4>
            <p className="text-xs md:text-sm text-muted-foreground mb-2">
              {formatEventDate(selectedEvent.start_date, selectedEvent.all_day)}
              {selectedEvent.end_date && (
                <>
                  {" "}
                  ~{" "}
                  {formatEventDate(
                    selectedEvent.end_date,
                    selectedEvent.all_day
                  )}
                </>
              )}
              {selectedEvent.all_day && (
                <span className="ml-2 text-xs">(종일)</span>
              )}
            </p>
            <Link
              href="/calendar"
              className="text-xs md:text-sm text-primary hover:underline"
            >
              캘린더에서 보기 →
            </Link>
          </div>
        )}
      </CardContent>

      {/* 일정 추가 모달 */}
      <EventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultDate={selectedDate}
        onSuccess={handleSuccess}
      />
    </Card>
  );
}
