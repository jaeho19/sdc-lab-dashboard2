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
  DialogTrigger,
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
} from "lucide-react";

interface ResearchMeeting {
  id: string;
  project_id: string;
  meeting_date: string;
  discussion_content: string;
  next_steps: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
}

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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showOlder, setShowOlder] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add form
  const [newDate, setNewDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [newContent, setNewContent] = useState("");
  const [newNextSteps, setNewNextSteps] = useState("");

  // Edit form
  const [editingMeeting, setEditingMeeting] =
    useState<ResearchMeeting | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editNextSteps, setEditNextSteps] = useState("");

  // Sort meetings by date descending
  const sortedMeetings = [...meetings].sort(
    (a, b) =>
      new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
  );

  const recentMeetings = sortedMeetings.slice(0, 2);
  const olderMeetings = sortedMeetings.slice(2);

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    setSaving(true);

    await addMeeting(projectId, newDate, newContent, newNextSteps);

    setNewDate(new Date().toISOString().split("T")[0]);
    setNewContent("");
    setNewNextSteps("");
    setIsAddOpen(false);
    setSaving(false);
    onRefresh();
  };

  const handleEdit = (meeting: ResearchMeeting) => {
    setEditingMeeting(meeting);
    setEditDate(meeting.meeting_date);
    setEditContent(meeting.discussion_content);
    setEditNextSteps(meeting.next_steps || "");
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMeeting || !editContent.trim()) return;
    setSaving(true);

    await updateMeeting(
      editingMeeting.id,
      projectId,
      editDate,
      editContent,
      editNextSteps
    );

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

  const renderMeetingCard = (
    meeting: ResearchMeeting,
    label?: string
  ) => (
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
          {label && (
            <span className="text-xs text-muted-foreground">({label})</span>
          )}
        </div>
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
      </div>

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
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                미팅 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>미팅 기록 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>미팅 날짜</Label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>회의 내용</Label>
                  <Textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="오늘 미팅에서 논의한 내용을 작성하세요..."
                    className="min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>다음 미팅까지 할 일 (선택)</Label>
                  <Textarea
                    value={newNextSteps}
                    onChange={(e) => setNewNextSteps(e.target.value)}
                    placeholder="다음 미팅까지 완료해야 할 작업들..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleAdd}
                    disabled={!newContent.trim() || saving}
                  >
                    {saving && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    추가
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddOpen(false)}
                  >
                    취소
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedMeetings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>등록된 미팅 기록이 없습니다.</p>
            <p className="text-sm">
              미팅 추가 버튼을 클릭하여 첫 미팅을 기록하세요.
            </p>
          </div>
        ) : (
          <>
            {/* Recent meetings (up to 2) */}
            {recentMeetings.map((meeting, index) =>
              renderMeetingCard(
                meeting,
                index === 0 ? "최근 미팅" : "이전 미팅"
              )
            )}

            {/* Older meetings (collapsible) */}
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
                {showOlder &&
                  olderMeetings.map((meeting) =>
                    renderMeetingCard(meeting)
                  )}
              </>
            )}
          </>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
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
