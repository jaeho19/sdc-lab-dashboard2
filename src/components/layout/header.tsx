"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { signOut } from "@/lib/actions/auth";
import type { Member } from "@/types/database";

const positionLabels: Record<string, string> = {
  professor: "PROFESSOR",
  "post-doc": "POST-DOC",
  phd: "PHD",
  ms: "MS",
  researcher: "RESEARCHER",
};

const positionColors: Record<string, string> = {
  professor: "bg-red-100 text-red-700",
  "post-doc": "bg-amber-100 text-amber-700",
  phd: "bg-blue-100 text-blue-700",
  ms: "bg-teal-100 text-teal-700",
  researcher: "bg-purple-100 text-purple-700",
};

interface HeaderProps {
  member: Member | null;
  notificationCount?: number;
}

export function Header({ member, notificationCount = 0 }: HeaderProps) {
  const { sidebarOpen } = useUIStore();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
  };

  return (
    <header
      className={cn(
        "fixed top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6 transition-all duration-300",
        sidebarOpen ? "left-60" : "left-16",
        "right-0"
      )}
    >
      {/* Left side - Page title or breadcrumb can go here */}
      <div className="flex items-center gap-4">
        {/* Placeholder for page-specific content */}
      </div>

      {/* Right side - Notifications and User menu */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
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

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 hover:bg-accent"
            >
              <Avatar className="h-8 w-8">
                {member?.avatar_url ? (
                  <AvatarImage src={member.avatar_url} alt={member.name} priority />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary">
                  {member?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-sm font-medium">{member?.name}</span>
                {member?.position && (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs font-medium",
                      positionColors[member.position]
                    )}
                  >
                    {positionLabels[member.position]}
                  </span>
                )}
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{member?.name}</p>
                <p className="text-xs text-muted-foreground">{member?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/members/${member?.id}`} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                내 프로필
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isSigningOut ? "로그아웃 중..." : "로그아웃"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
