"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  UserCheck,
  Bot,
  X,
  ExternalLink,
  Download,
  Home,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { logout } from "@/lib/supabase/actions";
import { getInitials, getPositionLabel } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type Member = Database["public"]["Tables"]["members"]["Row"];

interface SidebarProps {
  member: Member;
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/members", icon: Users },
  { name: "Research", href: "/research", icon: BookOpen },
  { name: "Research Notes", href: "/research-notes", icon: FileText },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Mentoring", href: "/mentoring", icon: MessageSquare },
  { name: "AI Peer Review", href: "/peer-review", icon: Bot },
];

const adminNavigation = [
  { name: "회원 등록", href: "/admin/members", icon: UserCheck },
  { name: "가입 승인", href: "/admin/approvals", icon: Settings },
];

const externalLinks = [
  {
    name: "연구실 홈페이지",
    href: "https://sdclab.netlify.app/",
    icon: Home,
    isExternal: true,
  },
  {
    name: "사용 설명서",
    href: "/SDC_Lab_Dashboard_사용설명서.pdf",
    icon: BookOpen,
    isDownload: true,
  },
];

// Shared sidebar content component
function SidebarContent({
  member,
  isCollapsed,
  onToggle,
  onLinkClick,
}: {
  member: Member;
  isCollapsed: boolean;
  onToggle?: () => void;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const isAdmin = member.position === "professor";

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onLinkClick}>
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center">
              <span className="text-sm font-bold text-white">SDC</span>
            </div>
            <span className="font-semibold text-sidebar-foreground">
              SDC Lab
            </span>
          </Link>
        )}
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isCollapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <Separator className="my-4" />
            <div
              className={cn(
                "px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider",
                isCollapsed && "sr-only"
              )}
            >
              Admin
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onLinkClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-white"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </>
        )}

        {/* External Links Section */}
        <Separator className="my-4" />
        <div
          className={cn(
            "px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider",
            isCollapsed && "sr-only"
          )}
        >
          Links
        </div>
        {externalLinks.map((item) => {
          const linkProps = item.isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : item.isDownload
            ? { download: true }
            : {};

          return (
            <a
              key={item.name}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
              {...linkProps}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && (
                <span className="flex items-center gap-1.5">
                  {item.name}
                  {item.isExternal && (
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  )}
                  {item.isDownload && (
                    <Download className="h-3 w-3 opacity-60" />
                  )}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* User Menu */}
      <div className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm hover:bg-sidebar-accent transition-colors",
                isCollapsed && "justify-center"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback className="bg-sidebar-primary text-white text-xs">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium text-sidebar-foreground truncate">
                    {member.name}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {getPositionLabel(member.position)}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/members/${member.id}`} onClick={onLinkClick}>
                <Users className="mr-2 h-4 w-4" />
                프로필
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" onClick={onLinkClick}>
                <Settings className="mr-2 h-4 w-4" />
                설정
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function Sidebar({
  member,
  isCollapsed,
  onToggle,
  isMobileOpen,
  onMobileToggle,
}: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar-background border-r border-sidebar-border transition-all duration-300",
          "hidden md:block",
          isCollapsed ? "w-16" : "w-60"
        )}
      >
        <SidebarContent
          member={member}
          isCollapsed={isCollapsed}
          onToggle={onToggle}
        />
      </aside>

      {/* Mobile Sidebar - Sheet */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileToggle}>
        <SheetContent
          side="left"
          className="w-72 p-0 bg-sidebar-background border-sidebar-border"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>메뉴</SheetTitle>
          </SheetHeader>
          <SidebarContent
            member={member}
            isCollapsed={false}
            onLinkClick={onMobileToggle}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

// Mobile menu trigger button component
export function MobileMenuTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="md:hidden"
      aria-label="메뉴 열기"
    >
      <Menu className="h-6 w-6" />
    </Button>
  );
}
