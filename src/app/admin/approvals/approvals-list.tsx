"use client";

import { useState } from "react";
import { Check, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { approveMember, rejectMember } from "@/lib/supabase/actions";
import {
  getPositionLabel,
  getEmploymentTypeLabel,
  formatDate,
} from "@/lib/utils";
import type { Database } from "@/types/database.types";

type Member = Database["public"]["Tables"]["members"]["Row"];

interface ApprovalsListProps {
  members: Member[];
}

export function ApprovalsList({ members }: ApprovalsListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

  async function handleApprove(memberId: string) {
    setLoadingId(memberId);
    setError(null);

    const result = await approveMember(memberId);

    if (result.error) {
      setError(result.error);
    } else {
      setApprovedIds(new Set([...approvedIds, memberId]));
    }

    setLoadingId(null);
  }

  async function handleReject(memberId: string) {
    if (!confirm("정말로 이 가입 신청을 거절하시겠습니까?")) {
      return;
    }

    setLoadingId(memberId);
    setError(null);

    const result = await rejectMember(memberId);

    if (result.error) {
      setError(result.error);
    } else {
      setRejectedIds(new Set([...rejectedIds, memberId]));
    }

    setLoadingId(null);
  }

  const visibleMembers = members.filter(
    (m) => !approvedIds.has(m.id) && !rejectedIds.has(m.id)
  );

  if (visibleMembers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>승인 대기 중인 회원이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleMembers.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription>{member.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">직책: </span>
                  <span className="font-medium">
                    {getPositionLabel(member.position)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">근무형태: </span>
                  <span className="font-medium">
                    {getEmploymentTypeLabel(member.employment_type)}
                  </span>
                </div>
                {member.enrollment_year && (
                  <div>
                    <span className="text-muted-foreground">입학년도: </span>
                    <span className="font-medium">{member.enrollment_year}년</span>
                  </div>
                )}
                {member.expected_graduation_year && (
                  <div>
                    <span className="text-muted-foreground">졸업예정: </span>
                    <span className="font-medium">
                      {member.expected_graduation_year}년
                    </span>
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                신청일: {formatDate(member.created_at)}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleApprove(member.id)}
                  disabled={loadingId === member.id}
                >
                  <Check className="w-4 h-4 mr-1" />
                  승인
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleReject(member.id)}
                  disabled={loadingId === member.id}
                >
                  <X className="w-4 h-4 mr-1" />
                  거절
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
