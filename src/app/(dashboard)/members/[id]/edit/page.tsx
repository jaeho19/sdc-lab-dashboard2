"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateMemberProfile } from "@/lib/supabase/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { use } from "react";

interface MemberEditPageProps {
  params: Promise<{ id: string }>;
}

interface Member {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  position: string;
  admission_date: string | null;
  graduation_date: string | null;
  interests: string | null;
}

export default function MemberEditPage({ params }: MemberEditPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [admissionDate, setAdmissionDate] = useState("");
  const [graduationDate, setGraduationDate] = useState("");
  const [interests, setInterests] = useState("");

  useEffect(() => {
    async function fetchMember() {
      const supabase = createClient();

      // Check if user can edit this profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: currentMember } = await supabase
        .from("members")
        .select("id, position")
        .eq("id", user.id)
        .single() as { data: { id: string; position: string } | null };

      if (!currentMember) {
        setError("회원 정보를 찾을 수 없습니다.");
        setLoading(false);
        return;
      }

      const isAdmin = currentMember.position === "professor";
      const isOwner = currentMember.id === id;

      if (!isAdmin && !isOwner) {
        setError("본인의 정보만 수정할 수 있습니다.");
        setLoading(false);
        return;
      }

      // Fetch member data
      const { data: memberData, error: fetchError } = await supabase
        .from("members")
        .select("id, name, email, avatar_url, position, admission_date, graduation_date, interests")
        .eq("id", id)
        .single() as { data: Member | null; error: unknown };

      if (fetchError || !memberData) {
        setError("회원 정보를 불러올 수 없습니다.");
        setLoading(false);
        return;
      }

      setMember(memberData);
      // Convert date to month format (YYYY-MM)
      const toMonthFormat = (dateStr: string | null) => {
        if (!dateStr) return "";
        return dateStr.substring(0, 7); // YYYY-MM
      };
      setAdmissionDate(toMonthFormat(memberData.admission_date));
      setGraduationDate(toMonthFormat(memberData.graduation_date));
      setInterests(memberData.interests || "");
      setLoading(false);
    }

    fetchMember();
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Convert month format (YYYY-MM) to date format (YYYY-MM-01)
    const toDateFormat = (monthStr: string) => {
      if (!monthStr) return "";
      return `${monthStr}-01`;
    };

    const formData = new FormData();
    formData.set("admission_date", toDateFormat(admissionDate));
    formData.set("graduation_date", toDateFormat(graduationDate));
    formData.set("interests", interests);

    const result = await updateMemberProfile(id, formData);

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);

    // Redirect after short delay
    setTimeout(() => {
      router.push(`/members/${id}`);
    }, 1000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !member) {
    return (
      <div className="space-y-4">
        <Link
          href={`/members/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Link>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href={`/members/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        돌아가기
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback className="text-lg bg-gradient-to-br from-slate-600 to-slate-800 text-white">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{member.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{member.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                정보가 성공적으로 수정되었습니다.
              </div>
            )}

            {(() => {
              const isStudent = member.position === "phd" || member.position === "ms";
              const startLabel = isStudent ? "입학일" : "계약일";
              const endLabel = isStudent ? "졸업예정일" : "계약 만료일";

              return (
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* 입학일/계약일 */}
                  <div className="space-y-2">
                    <Label htmlFor="admission_date">{startLabel}</Label>
                    <Input
                      id="admission_date"
                      type="month"
                      value={admissionDate}
                      onChange={(e) => setAdmissionDate(e.target.value)}
                    />
                  </div>

                  {/* 졸업예정일/계약 만료일 */}
                  <div className="space-y-2">
                    <Label htmlFor="graduation_date">{endLabel}</Label>
                    <Input
                      id="graduation_date"
                      type="month"
                      value={graduationDate}
                      onChange={(e) => setGraduationDate(e.target.value)}
                    />
                  </div>
                </div>
              );
            })()}

            {/* 관심분야 */}
            <div className="space-y-2">
              <Label htmlFor="interests">관심분야</Label>
              <Textarea
                id="interests"
                placeholder="예: 도시계획, GIS, 공간분석, 머신러닝"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                관심 연구 분야나 키워드를 입력해주세요.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/members/${id}`)}
              >
                취소
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    저장
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
