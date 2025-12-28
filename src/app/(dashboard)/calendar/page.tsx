import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarView } from "@/components/features/calendar";
import { CALENDAR_CATEGORY_CONFIG } from "@/lib/constants";
import { Plus } from "lucide-react";
import type { CalendarCategory } from "@/types/database.types";

export default async function CalendarPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .order("start_date", { ascending: true });

  const eventList = (events || []) as Array<{
    id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
    all_day: boolean;
    category: CalendarCategory;
    is_public: boolean;
  }>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            연구실 일정을 확인하고 관리하세요.
          </p>
        </div>
      </div>

      {/* Category Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CALENDAR_CATEGORY_CONFIG).map(([key, config]) => (
          <Badge
            key={key}
            variant="outline"
            className="flex items-center gap-1.5"
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            {config.label}
          </Badge>
        ))}
      </div>

      {/* Calendar */}
      <CalendarView events={eventList} />

      {/* Usage Hint */}
      <p className="text-sm text-muted-foreground text-center">
        날짜를 클릭하여 새 일정을 추가하거나, 일정을 드래그하여 날짜를 변경할 수
        있습니다.
      </p>
    </div>
  );
}
