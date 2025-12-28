"use client";

import { useState } from "react";
import { Sidebar, MobileMenuTrigger } from "./sidebar";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type Member = Database["public"]["Tables"]["members"]["Row"];

interface DashboardLayoutProps {
  member: Member;
  children: React.ReactNode;
}

export function DashboardLayout({ member, children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        member={member}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onMobileToggle={() => setIsMobileOpen(!isMobileOpen)}
      />

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
        <MobileMenuTrigger onClick={() => setIsMobileOpen(true)} />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">SDC</span>
          </div>
          <span className="font-semibold text-sm">SDC Lab</span>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={cn(
          "transition-all duration-300",
          // Mobile: no left margin, add top padding for mobile header
          "pt-14 md:pt-0",
          // Desktop: left margin based on sidebar state
          isCollapsed ? "md:ml-16" : "md:ml-60"
        )}
      >
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
