"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type Member = Database["public"]["Tables"]["members"]["Row"];

interface DashboardLayoutProps {
  member: Member;
  children: React.ReactNode;
}

export function DashboardLayout({ member, children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        member={member}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />
      <main
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "ml-16" : "ml-60"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
