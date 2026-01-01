"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BookOpen,
  Download,
  ExternalLink,
  Home,
  LayoutDashboard,
  FileText,
  Calendar,
  MessageSquare,
  Users,
} from "lucide-react";

const WELCOME_MODAL_KEY = "sdclab-welcome-seen";

interface WelcomeModalProps {
  memberName: string;
}

export function WelcomeModal({ memberName }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome modal
    const hasSeenWelcome = localStorage.getItem(WELCOME_MODAL_KEY);
    if (!hasSeenWelcome) {
      // Small delay to allow page to render first
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(WELCOME_MODAL_KEY, "true");
    }
    setIsOpen(false);
  };

  const handleDownloadGuide = () => {
    window.open("/SDC_Lab_Dashboard_사용설명서.pdf", "_blank");
  };

  const menuItems = [
    { icon: LayoutDashboard, name: "Dashboard", desc: "연구실 현황 요약" },
    { icon: Users, name: "Members", desc: "구성원 프로필 관리" },
    { icon: FileText, name: "Research", desc: "연구 프로젝트 진행 관리" },
    { icon: Calendar, name: "Calendar", desc: "일정 등록 및 확인" },
    { icon: MessageSquare, name: "Mentoring", desc: "멘토링 기록 관리" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <span className="text-2xl">👋</span>
            {memberName}님, 환영합니다!
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            SDC Lab Dashboard에 오신 것을 환영합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick intro */}
          <p className="text-sm text-muted-foreground">
            이 대시보드는 연구 진행 상황, 일정, 멘토링 기록을 통합 관리하는 시스템입니다.
          </p>

          {/* Menu overview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">주요 메뉴</h4>
            <div className="grid gap-2">
              {menuItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                >
                  <item.icon className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      - {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleDownloadGuide}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              사용 설명서
              <Download className="h-3 w-3 ml-1 opacity-60" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              asChild
            >
              <a
                href="https://sdclab.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Home className="h-4 w-4 mr-2" />
                연구실 홈페이지
                <ExternalLink className="h-3 w-3 ml-1 opacity-60" />
              </a>
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 text-sm">
            <p className="font-medium text-emerald-700 dark:text-emerald-400">
              💡 시작 팁
            </p>
            <ul className="mt-1 text-emerald-600 dark:text-emerald-500 text-xs space-y-1">
              <li>• Members에서 본인 프로필을 먼저 완성해주세요</li>
              <li>• Research에서 연구 진행 현황을 업데이트하세요</li>
              <li>• 좌측 사이드바에서 사용 설명서를 언제든 다운로드할 수 있습니다</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <label
              htmlFor="dont-show"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              다시 보지 않기
            </label>
          </div>
          <Button onClick={handleClose}>
            시작하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
