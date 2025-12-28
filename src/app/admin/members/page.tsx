"use client";

import { useActionState } from "react";
import { adminCreateMember, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, UserPlus, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminMembersPage() {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    adminCreateMember,
    {}
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdEmail, setCreatedEmail] = useState("");
  const [createdPassword, setCreatedPassword] = useState("");

  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
    }
  }, [state.success]);

  const handleSubmit = (formData: FormData) => {
    setCreatedEmail(formData.get("email") as string);
    setCreatedPassword(formData.get("password") as string);
    formAction(formData);
  };

  if (showSuccess) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <CardTitle>회원 등록 완료</CardTitle>
            </div>
            <CardDescription>
              연구원에게 아래 정보를 전달해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg space-y-2">
              <div>
                <span className="text-sm text-slate-500">이메일:</span>
                <p className="font-mono font-medium">{createdEmail}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">비밀번호:</span>
                <p className="font-mono font-medium">{createdPassword}</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setShowSuccess(false);
                setCreatedEmail("");
                setCreatedPassword("");
              }}
              className="w-full"
            >
              다른 회원 등록하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            <CardTitle>회원 등록</CardTitle>
          </div>
          <CardDescription>
            새로운 연구원을 직접 등록합니다
          </CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            {state.error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {state.error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@uos.ac.kr"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 *</Label>
              <Input
                id="password"
                name="password"
                type="text"
                placeholder="최소 6자 이상"
                required
                minLength={6}
                disabled={isPending}
              />
              <p className="text-xs text-slate-500">
                연구원에게 전달할 임시 비밀번호를 입력하세요
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름 (한글) *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="홍길동"
                  required
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">이름 (영문)</Label>
                <Input
                  id="nameEn"
                  name="nameEn"
                  type="text"
                  placeholder="Hong Gildong"
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">직위 *</Label>
                <Select name="position" defaultValue="researcher" disabled={isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder="직위 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professor">PROFESSOR</SelectItem>
                    <SelectItem value="post-doc">POST-DOC</SelectItem>
                    <SelectItem value="phd">PHD</SelectItem>
                    <SelectItem value="ms">MS</SelectItem>
                    <SelectItem value="researcher">RESEARCHER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentType">고용 형태 *</Label>
                <Select name="employmentType" defaultValue="full-time" disabled={isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder="고용 형태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <div className="p-6 pt-0">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  등록 중...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  회원 등록
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
