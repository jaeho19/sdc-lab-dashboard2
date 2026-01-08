"use client";

import { useState, useEffect } from "react";
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
  ChevronDown,
  ChevronRight,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
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
import { getFavoriteProjects } from "@/lib/actions/research";

type Member = Database["public"]["Tables"]["members"]["Row"];

interface FulltimeMember {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface FavoriteProject {
  id: string;
  title: string;
  category: string;
}

// 사이드바 멤버 커스텀 순서
const SIDEBAR_MEMBER_ORDER: Record<string, number> = {
  "강성익": 1,
  "오재인": 2,
  "이지윤": 3,
  "김은솔": 4,
  "이다연": 5,
  "최희진": 6,
  "배성훈": 7,
  "이은진": 8,
};

// 사이드바에서 제외할 멤버
const SIDEBAR_EXCLUDED_MEMBERS = ["이재호"];

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
  const [fulltimeMembers, setFulltimeMembers] = useState<FulltimeMember[]>([]);
  const [isMembersExpanded, setIsMembersExpanded] = useState(true);
  const [favoriteProjects, setFavoriteProjects] = useState<FavoriteProject[]>([]);
  const [isResearchExpanded, setIsResearchExpanded] = useState(true);

  // 풀타임 멤버 목록 로드
  useEffect(() => {
    async function loadFulltimeMembers() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("members")
        .select("id, name, avatar_url, position")
        .eq("employment_type", "full-time")
        .eq("status", "active")
        .neq("position", "professor");

      if (error) {
        console.error("Failed to load fulltime members:", error);
        return;
      }

      if (data) {
        // 제외할 멤버 필터링 및 커스텀 순서 정렬
        const filteredAndSorted = (data as FulltimeMember[])
          .filter(m => !SIDEBAR_EXCLUDED_MEMBERS.includes(m.name))
          .sort((a, b) => {
            const orderA = SIDEBAR_MEMBER_ORDER[a.name] || 99;
            const orderB = SIDEBAR_MEMBER_ORDER[b.name] || 99;
            return orderA - orderB;
          });
        setFulltimeMembers(filteredAndSorted);
      }
    }

    loadFulltimeMembers();
  }, []);

  // 즐겨찾기 프로젝트 목록 로드
  useEffect(() => {
    async function loadFavoriteProjects() {
      const result = await getFavoriteProjects();
      if (result.data) {
        setFavoriteProjects(result.data);
      }
    }

    loadFavoriteProjects();
  }, [pathname]); // pathname 변경 시 새로고침 (즐겨찾기 토글 후 반영)

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
          const isMembers = item.name === "Members";

          const isResearch = item.name === "Research";
          const hasFavorites = favoriteProjects.length > 0;

          return (
            <div key={item.name}>
              {isMembers && !isCollapsed ? (
                <>
                  {/* Members 메뉴 with 펼침/접기 */}
                  <button
                    onClick={() => setIsMembersExpanded(!isMembersExpanded)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full",
                      isActive
                        ? "bg-sidebar-primary text-white"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {isMembersExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {/* 풀타임 멤버 목록 */}
                  {isMembersExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {/* 전체 멤버 보기 링크 */}
                      <Link
                        href="/members"
                        onClick={onLinkClick}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          pathname === "/members"
                            ? "bg-sidebar-accent text-sidebar-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>전체 멤버</span>
                      </Link>
                      {/* 풀타임 멤버들 */}
                      {fulltimeMembers.map((m) => {
                        const isMemberActive = pathname === `/members/${m.id}`;
                        return (
                          <Link
                            key={m.id}
                            href={`/members/${m.id}`}
                            onClick={onLinkClick}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                              isMemberActive
                                ? "bg-sidebar-accent text-sidebar-foreground"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            )}
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={m.avatar_url || undefined} />
                              <AvatarFallback className="bg-sidebar-primary text-white text-[10px]">
                                {getInitials(m.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{m.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : isResearch && !isCollapsed && hasFavorites ? (
                <>
                  {/* Research 메뉴 with 즐겨찾기 */}
                  <button
                    onClick={() => setIsResearchExpanded(!isResearchExpanded)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full",
                      isActive
                        ? "bg-sidebar-primary text-white"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {isResearchExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {/* 즐겨찾기 프로젝트 목록 */}
                  {isResearchExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {/* 전체 연구 보기 링크 */}
                      <Link
                        href="/research"
                        onClick={onLinkClick}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          pathname === "/research"
                            ? "bg-sidebar-accent text-sidebar-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>전체 연구</span>
                      </Link>
                      {/* 즐겨찾기 프로젝트들 */}
                      {favoriteProjects.map((project) => {
                        const isProjectActive = pathname === `/research/${project.id}`;
                        return (
                          <Link
                            key={project.id}
                            href={`/research/${project.id}`}
                            onClick={onLinkClick}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                              isProjectActive
                                ? "bg-sidebar-accent text-sidebar-foreground"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            )}
                          >
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="truncate">{project.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
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
              )}
            </div>
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
