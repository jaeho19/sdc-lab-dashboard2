"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

interface DashboardContentProps {
  children: React.ReactNode;
}

export function DashboardContent({ children }: DashboardContentProps) {
  const { sidebarOpen } = useUIStore();

  return (
    <main
      className={cn(
        "min-h-screen pt-16 transition-all duration-300",
        sidebarOpen ? "pl-60" : "pl-16"
      )}
    >
      <div className="p-6">{children}</div>
    </main>
  );
}
