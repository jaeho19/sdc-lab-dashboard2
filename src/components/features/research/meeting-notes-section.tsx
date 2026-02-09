"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addMeeting,
  updateMeeting,
  deleteMeeting,
} from "@/lib/actions/research";
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  CalendarDays,
  ClipboardList,
  History,
  X,
} from "lucide-react";
import type { ResearchMeeting } from "@/types/database.types";

interface MeetingNotesProps {
  projectId: string;
  meetings: ResearchMeeting[];
  onRefresh: () => void;
}

function formatMeetingDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = days[date.getDay()];
  return `${year}. ${month}. ${day}. (${dayOfWeek})`;
}

export function MeetingNotesSection({
  projectId,
  meetings,
  onRefresh,
}: MeetingNotesProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showOlder, setShowOlder] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add form - 3-column structure
  const [newDate, setNewDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [newPreviousContent, setNewPreviousContent] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newNextSteps, setNewNextSteps] = useState("");

  // Edit form
  const [editingMeeting, setEditingMeeting] =
    useState<ResearchMeeting | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editPreviousContent, setEditPreviousContent] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editNextSteps, setEditNextSteps] = useState("");

  // Sort meetings by date descending, then by created_at descending for same-date meetings
  const sortedMeetings = [...meetings].sort(
    (a, b) =>
      new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime() ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // 3-column layout data
  const latestMeeting = sortedMeetings[0] || null;
  const previousMeeting = sortedMeetings[1] || null;
  const olderMeetings = sortedMeetings.slice(2);

  // Left column: prefer latest meeting's previous_content, fallback to previous meeting's discussion
  const leftColumnContent = latestMeeting?.previous_content
    ? { text: latestMeeting.previous_content, date: latestMeeting.meeting_date, type: "previous_content" as const }
    : previousMeeting
    ? { text: previousMeeting.discussion_content, date: previousMeeting.meeting_date, type: "fallback" as const }
    : null;

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    setSaving(true);

    const result = await addMeeting(
      projectId,
      newDate,
      newContent,
      newNextSteps,
      newPreviousContent
    );

    if (result.error) {
      alert(result.error);
      setSaving(false);
      return;
    }

    setNewDate(new Date().toISOString().split("T")[0]);
    setNewPreviousContent("");
    setNewContent("");
    setNewNextSteps("");
    setIsFormOpen(false);
    setSaving(false);
    onRefresh();
  };

  const handleEdit = (meeting: ResearchMeeting) => {
    setEditingMeeting(meeting);
    setEditDate(meeting.meeting_date);
    setEditPreviousContent(meeting.previous_content || "");
    setEditContent(meeting.discussion_content);
    setEditNextSteps(meeting.next_steps || "");
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMeeting || !editContent.trim()) return;
    setSaving(true);

    const result = await updateMeeting(
      editingMeeting.id,
      projectId,
      editDate,
      editContent,
      editNextSteps,
      editPreviousContent
    );

    if (result.error) {
      alert(result.error);
      setSaving(false);
      return;
    }

    setEditingMeeting(null);
    setIsEditOpen(false);
    setSaving(false);
    onRefresh();
  };

  const handleDelete = async (meetingId: string) => {
    if (!confirm("이 미팅 기록을 삭제하시겠습니까?")) return;

    await deleteMeeting(meetingId, projectId);
    onRefresh();
  };

  const renderMeetingActions = (meeting: ResearchMeeting) => (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => handleEdit(meeting)}
      >
        <Edit2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={() => handleDelete(meeting.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  // 이전 미팅 기록 카드 (접기/펼치기용)
  const renderOlderMeetingCard = (meeting: ResearchMeeting) => (
    <div
      key={meeting.id}
      className="border rounded-lg p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">
            {formatMeetingDate(meeting.meeting_date)}
          </span>
        </div>
        {renderMeetingActions(meeting)}
      </div>

      {meeting.previous_content && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <History className="h-3.5 w-3.5" />
            이전 미팅 내용
          </div>
          <p className="text-sm whitespace-pre-wrap pl-5">
            {meeting.previous_content}
          </p>
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          회의 내용
        </div>
        <p className="text-sm whitespace-pre-wrap pl-5">
          {meeting.discussion_content}
        </p>
      </div>

      {meeting.next_steps && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ClipboardList className="h-3.5 w-3.5" />
            다음 미팅까지 할 일
          </div>
          <p className="text-sm whitespace-pre-wrap pl-5">
            {meeting.next_steps}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            미팅 기록
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setIsFormOpen(!isFormOpen)}
            variant={isFormOpen ? "outline" : "default"}
          >
            {isFormOpen ? (
              <>
                <X className="h-4 w-4 mr-1" />
                닫기
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                미팅 추가
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inline 3-Column Input Form */}
        {isFormOpen && (
          <Card className="border-2 border-dashed border-primary/40 bg-primary/5">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 좌측: 이전 미팅 주요 내용 */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <History className="h-4 w-4" />
                    이전 미팅 주요 내용
                  </Label>
                  {previousMeeting && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {formatMeetingDate(previousMeeting.meeting_date)}
                    </div>
                  )}
                  <Textarea
                    value={newPreviousContent}
                    onChange={(e) => setNewPreviousContent(e.target.value)}
                    placeholder="이전 미팅에서 논의한 내용을 작성하세요..."
                    className="min-h-[120px]"
                  />
                </div>

                {/* 가운데: 오늘 미팅 주요 내용 */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <MessageSquare className="h-4 w-4" />
                    오늘 미팅 주요 내용
                  </Label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="text-sm"
                  />
                  <Textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="오늘 미팅에서 논의한 내용을 작성하세요..."
                    className="min-h-[120px]"
                  />
                </div>

                {/* 우측: 다음번 미팅 전 해올 내용 */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
                    <ClipboardList className="h-4 w-4" />
                    다음번 미팅 전 해올 내용
                  </Label>
                  <div className="h-[36px]" />
                  <Textarea
                    value={newNextSteps}
                    onChange={(e) => setNewNextSteps(e.target.value)}
                    placeholder="다음 미팅까지 완료해야 할 작업들을 작성하세요..."
                    className="min-h-[120px]"
                  />
                </div>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false);
                    setNewPreviousContent("");
                    setNewContent("");
                    setNewNextSteps("");
                    setNewDate(new Date().toISOString().split("T")[0]);
                  }}
                >
                  취소
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={!newContent.trim() || saving}
                >
                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  저장
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {sortedMeetings.length === 0 && !isFormOpen ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>등록된 미팅 기록이 없습니다.</p>
            <p className="text-sm">
              미팅 추가 버튼을 클릭하여 첫 미팅을 기록하세요.
            </p>
          </div>
        ) : sortedMeetings.length > 0 ? (
          <>
            {/* 3-Column Display Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 좌측: 저번 미팅 회의 내용 */}
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <History className="h-4 w-4" />
                  저번 미팅 내용
                </div>
                {leftColumnContent ? (
                  <>
                    {leftColumnContent.type === "fallback" && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatMeetingDate(leftColumnContent.date)}
                          </span>
                        </div>
                        {previousMeeting && renderMeetingActions(previousMeeting)}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {leftColumnContent.text}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    이전 미팅 기록이 없습니다.
                  </p>
                )}
              </div>

              {/* 가운데: 오늘 미팅 회의 내용 */}
              <div className="border-2 border-primary/30 rounded-lg p-4 space-y-3 bg-primary/5">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <MessageSquare className="h-4 w-4" />
                  오늘 회의 내용
                </div>
                {latestMeeting ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatMeetingDate(latestMeeting.meeting_date)}
                        </span>
                      </div>
                      {renderMeetingActions(latestMeeting)}
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {latestMeeting.discussion_content}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    미팅 기록이 없습니다.
                  </p>
                )}
              </div>

              {/* 우측: 다음번 미팅까지 해올 내용 */}
              <div className="border rounded-lg p-4 space-y-3 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/30">
                <div className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
                  <ClipboardList className="h-4 w-4" />
                  다음번 해올 내용
                </div>
                {latestMeeting?.next_steps ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {latestMeeting.next_steps}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {latestMeeting
                      ? "다음 미팅까지 할 일이 없습니다."
                      : "미팅 기록이 없습니다."}
                  </p>
                )}
              </div>
            </div>

            {/* 이전 미팅 기록 (접기/펼치기) */}
            {olderMeetings.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setShowOlder(!showOlder)}
                >
                  {showOlder ? (
                    <ChevronUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  )}
                  이전 미팅 기록 {showOlder ? "접기" : "더보기"} (
                  {olderMeetings.length}건)
                </Button>
                {showOlder && (
                  <div className="space-y-3">
                    {olderMeetings.map((meeting) =>
                      renderOlderMeetingCard(meeting)
                    )}
                  </div>
                )}
              </>
            )}
          </>
        ) : null}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>미팅 기록 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>미팅 날짜</Label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>이전 미팅 주요 내용 (선택)</Label>
              <Textarea
                value={editPreviousContent}
                onChange={(e) => setEditPreviousContent(e.target.value)}
                placeholder="이전 미팅에서 논의한 내용..."
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>회의 내용</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="회의 내용..."
                className="min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label>다음 미팅까지 할 일 (선택)</Label>
              <Textarea
                value={editNextSteps}
                onChange={(e) => setEditNextSteps(e.target.value)}
                placeholder="다음 미팅까지 할 일..."
                className="min-h-[80px]"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSaveEdit}
                disabled={!editContent.trim() || saving}
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                저장
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
