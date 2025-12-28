"use client";

import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logout } from "@/lib/supabase/actions";

export default function PendingApprovalPage() {
  async function handleLogout() {
    await logout();
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">승인 대기 중</CardTitle>
        <CardDescription>
          회원가입이 완료되었습니다
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          관리자의 승인을 기다리고 있습니다.
          <br />
          승인이 완료되면 대시보드에 접근할 수 있습니다.
        </p>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            문의사항이 있으시면 관리자에게 연락해주세요.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.location.reload()}
        >
          상태 새로고침
        </Button>
        <form action={handleLogout} className="w-full">
          <Button type="submit" variant="ghost" className="w-full">
            로그아웃
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
