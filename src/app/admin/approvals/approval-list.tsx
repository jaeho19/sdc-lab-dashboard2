"use client";

import { useState, useTransition } from "react";
import { approveMember, rejectMember } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, Loader2, UserPlus } from "lucide-react";
import type { Member } from "@/types/database";

const positionLabels: Record<string, string> = {
  "post-doc": "POST-DOC",
  phd: "PHD",
  ms: "MS",
  researcher: "RESEARCHER",
};

const positionColors: Record<string, string> = {
  "post-doc": "bg-amber-100 text-amber-700",
  phd: "bg-blue-100 text-blue-700",
  ms: "bg-teal-100 text-teal-700",
  researcher: "bg-purple-100 text-purple-700",
};

interface ApprovalListProps {
  members: Member[];
}

export function ApprovalList({ members }: ApprovalListProps) {
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const handleApprove = (memberId: string) => {
    setProcessingId(memberId);
    startTransition(async () => {
      await approveMember(memberId);
      setProcessingId(null);
    });
  };

  const handleReject = () => {
    if (!selectedMember) return;
    setProcessingId(selectedMember.id);
    startTransition(async () => {
      await rejectMember(selectedMember.id);
      setProcessingId(null);
      setRejectDialogOpen(false);
      setSelectedMember(null);
    });
  };

  const openRejectDialog = (member: Member) => {
    setSelectedMember(member);
    setRejectDialogOpen(true);
  };

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-lg font-medium text-slate-900">
            승인 대기 중인 신청이 없습니다
          </p>
          <p className="text-muted-foreground mt-1">
            새로운 가입 신청이 있으면 여기에 표시됩니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>승인 대기 목록</CardTitle>
          <CardDescription>
            {members.length}명의 가입 신청이 대기 중입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-white"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-slate-100 text-slate-600">
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.name}</span>
                      {member.name_en && (
                        <span className="text-muted-foreground text-sm">
                          ({member.name_en})
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          positionColors[member.position]
                        }`}
                      >
                        {positionLabels[member.position]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      신청일:{" "}
                      {new Date(member.created_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openRejectDialog(member)}
                    disabled={isPending && processingId === member.id}
                  >
                    {isPending && processingId === member.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        거절
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(member.id)}
                    disabled={isPending && processingId === member.id}
                  >
                    {isPending && processingId === member.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        승인
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>가입 신청 거절</DialogTitle>
            <DialogDescription>
              {selectedMember?.name}님의 가입 신청을 거절하시겠습니까?
              <br />
              거절하면 해당 계정이 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "거절"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
