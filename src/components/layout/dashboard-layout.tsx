"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Sidebar, MobileMenuTrigger } from "./sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type Member = Database["public"]["Tables"]["members"]["Row"];

interface DashboardLayoutProps {
  member: Member;
  notificationCount?: number;
  children: React.ReactNode;
}

export function DashboardLayout({ member, notificationCount = 0, children }: DashboardLayoutProps) {
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
      <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
        <div className="flex items-center gap-4">
          <MobileMenuTrigger onClick={() => setIsMobileOpen(true)} />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">SDC</span>
            </div>
            <span className="font-semibold text-sm">SDC Lab</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/notifications">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </header>

      {/* Desktop Header */}
      <header
        className={cn(
          "fixed top-0 z-30 hidden h-14 items-center justify-end border-b bg-background px-6 md:flex",
          isCollapsed ? "left-16" : "left-60",
          "right-0"
        )}
      >
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/notifications">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={cn(
          "transition-all duration-300",
          // Top padding for header (both mobile and desktop)
          "pt-14",
          // Desktop: left margin based on sidebar state
          isCollapsed ? "md:ml-16" : "md:ml-60"
        )}
      >
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
