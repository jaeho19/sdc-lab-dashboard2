# Design: Report Auto Generation (월간/주간보고 출력 자동화)

## Feature Name
`report-auto-generation`

## References
- Plan: `docs/01-plan/features/report-auto-generation.plan.md`

---

## 1. Database Schema

### 1.1 NEW TABLE: `projects`

ERP의 프로젝트(사업) 정보를 관리한다. 기존 `research_projects`(연구 프로젝트)와 별도의 테이블.

```sql
-- Migration: 00020_create_projects_table.sql

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,           -- "2612" 같은 사업 코드
  name TEXT NOT NULL,                  -- "청양읍 농촌중심지활성화사업 지역역량강화용역"
  short_name TEXT,                     -- "청양읍" (보고서 표시용 약칭)
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage projects"
  ON projects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.user_id = auth.uid()
      AND members.position = 'professor'
    )
  );

-- Index
CREATE INDEX idx_projects_code ON projects (code);
CREATE INDEX idx_projects_is_active ON projects (is_active);
```

### 1.2 NEW TABLE: `sub_projects`

단위사업(업무구분) 정보. 보고서 양식의 행(row)과 1:1 매핑.

```sql
-- Migration: 00021_create_sub_projects_table.sql

CREATE TABLE sub_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL,                  -- "26121" 같은 단위사업 코드
  name TEXT NOT NULL,                  -- "거버넌스 역량강화"
  sort_order INT NOT NULL DEFAULT 0,   -- 보고서에서의 표시 순서
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE sub_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sub_projects"
  ON sub_projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage sub_projects"
  ON sub_projects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.user_id = auth.uid()
      AND members.position = 'professor'
    )
  );

-- Index
CREATE INDEX idx_sub_projects_project_id ON sub_projects (project_id);
CREATE INDEX idx_sub_projects_code ON sub_projects (code);
```

### 1.3 NEW TABLE: `progress_logs`

추진경과 데이터. 보고서 자동 생성의 핵심 데이터 소스.

```sql
-- Migration: 00022_create_progress_logs_table.sql

CREATE TYPE progress_log_type AS ENUM (
  'task',        -- 일반 업무
  'meeting',     -- 회의
  'report',      -- 보고
  'consulting',  -- 컨설팅
  'fieldwork',   -- 현장활동
  'other'        -- 기타
);

CREATE TYPE progress_log_status AS ENUM (
  'completed',   -- 완료
  'in_progress', -- 진행중
  'planned'      -- 계획 (차주/차월 반영용)
);

CREATE TABLE progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sub_project_id UUID REFERENCES sub_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  log_date DATE NOT NULL,
  log_type progress_log_type NOT NULL DEFAULT 'task',
  status progress_log_status NOT NULL DEFAULT 'completed',
  assignee_id UUID REFERENCES members(id) ON DELETE SET NULL,
  assignee_name TEXT,                  -- 비회원 담당자 이름 (fallback)
  hours_spent NUMERIC(4,1),            -- 투입 시간 (선택)
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read progress_logs"
  ON progress_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert progress_logs"
  ON progress_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authors can update own progress_logs"
  ON progress_logs FOR UPDATE
  TO authenticated
  USING (
    created_by IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete own progress_logs"
  ON progress_logs FOR DELETE
  TO authenticated
  USING (
    created_by IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Indexes (핵심: 기간별 조회 성능)
CREATE INDEX idx_progress_logs_project_date ON progress_logs (project_id, log_date);
CREATE INDEX idx_progress_logs_sub_project ON progress_logs (sub_project_id);
CREATE INDEX idx_progress_logs_assignee ON progress_logs (assignee_id);
CREATE INDEX idx_progress_logs_date ON progress_logs (log_date);
CREATE INDEX idx_progress_logs_status ON progress_logs (status);
```

### 1.4 NEW TABLE: `report_templates`

보고서 양식 정의. 양식의 구조(섹션, 컬럼)를 JSONB로 저장.

```sql
-- Migration: 00023_create_report_templates_table.sql

CREATE TYPE report_period_type AS ENUM (
  'weekly',      -- 주간
  'monthly',     -- 월간
  'quarterly',   -- 분기
  'custom'       -- 사용자 지정
);

CREATE TYPE report_scope AS ENUM (
  'project',     -- 프로젝트 단위 (주간 공정보고 등)
  'personal'     -- 개인 단위 (월간 업무보고 등)
);

CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                  -- "주간 공정보고 (청양읍)"
  description TEXT,
  period_type report_period_type NOT NULL DEFAULT 'weekly',
  scope report_scope NOT NULL DEFAULT 'project',
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- 특정 프로젝트용
  sections JSONB NOT NULL DEFAULT '[]',  -- 양식 섹션 정의 (아래 상세)
  header_config JSONB DEFAULT '{}',      -- 헤더 설정 (로고, 기관명 등)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read report_templates"
  ON report_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage report_templates"
  ON report_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.user_id = auth.uid()
      AND members.position = 'professor'
    )
  );
```

**`sections` JSONB 구조:**

```typescript
// 주간 공정보고 양식의 sections 예시
[
  {
    "id": "progress-table",
    "type": "progress_matrix",   // 업무구분 × 금주실적/차주계획 매트릭스
    "title": "사업 추진 현황",
    "columns": [
      { "key": "current_week", "label": "추진경과 (금주)" },
      { "key": "next_week", "label": "추진계획 (차주)" }
    ],
    "auto_fill": {
      "current_week": { "status": ["completed", "in_progress"], "period": "current" },
      "next_week": { "status": ["planned"], "period": "next" }
    }
  },
  {
    "id": "meetings",
    "type": "list",
    "title": "보고 / 회의 등",
    "auto_fill": { "log_type": ["meeting", "report", "consulting"] }
  },
  {
    "id": "remarks",
    "type": "text",
    "title": "기타 사항"
  }
]
```

### 1.5 NEW TABLE: `reports`

생성된 보고서 인스턴스.

```sql
-- Migration: 00024_create_reports_table.sql

CREATE TYPE report_status AS ENUM (
  'draft',       -- 작성중
  'submitted',   -- 제출됨
  'approved'     -- 승인됨
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,                  -- "2026년 3월 4주차 주간 공정보고 (청양읍)"
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  assignee_id UUID REFERENCES members(id) ON DELETE SET NULL,  -- 개인보고 시 담당자
  content JSONB NOT NULL DEFAULT '{}', -- 섹션별 채워진 데이터
  status report_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES members(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reports"
  ON reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authors can update own reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    created_by IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete draft reports"
  ON reports FOR DELETE
  TO authenticated
  USING (
    status = 'draft'
    AND created_by IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_reports_template ON reports (template_id);
CREATE INDEX idx_reports_project ON reports (project_id);
CREATE INDEX idx_reports_period ON reports (period_start, period_end);
CREATE INDEX idx_reports_status ON reports (status);
CREATE INDEX idx_reports_assignee ON reports (assignee_id);
```

**`content` JSONB 구조:**

```typescript
// 생성된 보고서의 content 예시
{
  "progress-table": {
    // sub_project_id → { column_key → content[] }
    "uuid-sub-1": {
      "current_week": [
        { "log_id": "uuid-log-1", "text": "DB구축 돌봄 분야 설정 및 활용방안 구상" },
        { "log_id": "uuid-log-2", "text": "다-돌봄 웹사이트 메뉴 개편 완료" }
      ],
      "next_week": [
        { "log_id": "uuid-log-5", "text": "3차년도 해볼랩 세부운영계획" }
      ]
    },
    "uuid-sub-2": {
      "current_week": [
        { "log_id": "uuid-log-3", "text": "업무분석" }
      ],
      "next_week": []
    }
  },
  "meetings": {
    "items": [
      { "log_id": "uuid-log-4", "text": "3/25 재단회의 실무자 상세회의 14시" }
    ]
  },
  "remarks": {
    "text": ""
  }
}
```

---

## 2. TypeScript Types

### 2.1 `src/types/database.types.ts` 추가

```typescript
// ── NEW Enums ──

export type ProgressLogType =
  | "task"
  | "meeting"
  | "report"
  | "consulting"
  | "fieldwork"
  | "other";

export type ProgressLogStatus =
  | "completed"
  | "in_progress"
  | "planned";

export type ReportPeriodType =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "custom";

export type ReportScope =
  | "project"
  | "personal";

export type ReportStatus =
  | "draft"
  | "submitted"
  | "approved";

// ── NEW Interfaces ──

export interface Project {
  id: string;
  code: string;
  name: string;
  short_name: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubProject {
  id: string;
  project_id: string;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgressLog {
  id: string;
  project_id: string;
  sub_project_id: string | null;
  title: string;
  description: string | null;
  log_date: string;
  log_type: ProgressLogType;
  status: ProgressLogStatus;
  assignee_id: string | null;
  assignee_name: string | null;
  hours_spent: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportTemplateSectionAutoFill {
  status?: ProgressLogStatus[];
  period?: "current" | "next";
  log_type?: ProgressLogType[];
}

export interface ReportTemplateSectionColumn {
  key: string;
  label: string;
}

export interface ReportTemplateSection {
  id: string;
  type: "progress_matrix" | "list" | "text";
  title: string;
  columns?: ReportTemplateSectionColumn[];
  auto_fill?: ReportTemplateSectionAutoFill;
}

export interface ReportTemplateHeaderConfig {
  logo_url?: string;
  org_name?: string;
  show_author?: boolean;
  show_date?: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  period_type: ReportPeriodType;
  scope: ReportScope;
  project_id: string | null;
  sections: ReportTemplateSection[];
  header_config: ReportTemplateHeaderConfig;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportContentLogEntry {
  log_id: string;
  text: string;
}

export interface ReportContentMatrixCell {
  [columnKey: string]: ReportContentLogEntry[];
}

export interface ReportContentMatrix {
  [subProjectId: string]: ReportContentMatrixCell;
}

export interface ReportContentList {
  items: ReportContentLogEntry[];
}

export interface ReportContentText {
  text: string;
}

export type ReportSectionContent =
  | ReportContentMatrix
  | ReportContentList
  | ReportContentText;

export interface ReportContent {
  [sectionId: string]: ReportSectionContent;
}

export interface Report {
  id: string;
  template_id: string;
  project_id: string | null;
  title: string;
  period_start: string;
  period_end: string;
  assignee_id: string | null;
  content: ReportContent;
  status: ReportStatus;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
```

### 2.2 Database Tables 타입 (`Database.public.Tables` 확장)

```typescript
// projects, sub_projects, progress_logs, report_templates, reports
// 각각 Row / Insert / Update 패턴으로 추가 (기존 패턴 동일)
```

### 2.3 조인된 뷰 타입

```typescript
// 추진경과 + 담당자 정보 + 단위사업 정보
export interface ProgressLogWithDetails extends ProgressLog {
  sub_project?: SubProject | null;
  assignee?: { id: string; name: string } | null;
}

// 보고서 + 양식 + 프로젝트
export interface ReportWithDetails extends Report {
  template?: ReportTemplate;
  project?: Project | null;
  assignee?: { id: string; name: string } | null;
  created_by_member?: { id: string; name: string } | null;
}
```

---

## 3. Server Actions

### 3.1 NEW: `src/lib/actions/reports.ts`

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./research";
import type {
  ProgressLogStatus,
  ProgressLogType,
  ReportContent,
  ReportStatus,
} from "@/types/database.types";

// ── Projects & Sub-projects ──

export async function getProjects(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_active", true)
    .order("code");
  if (error) return { error: error.message };
  return { success: true, data };
}

export async function getSubProjects(projectId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sub_projects")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .order("sort_order");
  if (error) return { error: error.message };
  return { success: true, data };
}

// ── Progress Logs (추진경과) ──

export async function getProgressLogs(params: {
  projectId: string;
  startDate: string;
  endDate: string;
  subProjectId?: string;
  assigneeId?: string;
  status?: ProgressLogStatus[];
  logType?: ProgressLogType[];
}): Promise<ActionResult> {
  const supabase = await createClient();
  let query = supabase
    .from("progress_logs")
    .select("*, sub_projects(id, code, name, sort_order)")
    .eq("project_id", params.projectId)
    .gte("log_date", params.startDate)
    .lte("log_date", params.endDate)
    .order("log_date", { ascending: true });

  if (params.subProjectId) {
    query = query.eq("sub_project_id", params.subProjectId);
  }
  if (params.assigneeId) {
    query = query.eq("assignee_id", params.assigneeId);
  }
  if (params.status?.length) {
    query = query.in("status", params.status);
  }
  if (params.logType?.length) {
    query = query.in("log_type", params.logType);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { success: true, data };
}

export async function getPersonalProgressLogs(params: {
  assigneeId: string;
  startDate: string;
  endDate: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("progress_logs")
    .select(`
      *,
      sub_projects(id, code, name, sort_order),
      projects!inner(id, code, name, short_name)
    `)
    .eq("assignee_id", params.assigneeId)
    .gte("log_date", params.startDate)
    .lte("log_date", params.endDate)
    .order("log_date", { ascending: true });
  if (error) return { error: error.message };
  return { success: true, data };
}

export async function addProgressLog(params: {
  projectId: string;
  subProjectId?: string;
  title: string;
  description?: string;
  logDate: string;
  logType: ProgressLogType;
  status: ProgressLogStatus;
  assigneeId?: string;
  assigneeName?: string;
  hoursSpent?: number;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const member = await supabase
    .from("members")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (member.error) return { error: "Member not found" };

  const { data, error } = await supabase
    .from("progress_logs")
    .insert({
      project_id: params.projectId,
      sub_project_id: params.subProjectId || null,
      title: params.title.trim(),
      description: params.description?.trim() || null,
      log_date: params.logDate,
      log_type: params.logType,
      status: params.status,
      assignee_id: params.assigneeId || member.data.id,
      assignee_name: params.assigneeName || null,
      hours_spent: params.hoursSpent || null,
      created_by: member.data.id,
    } as never)
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/reports");
  return { success: true, id: data.id };
}

export async function updateProgressLog(
  logId: string,
  params: Partial<{
    subProjectId: string | null;
    title: string;
    description: string | null;
    logDate: string;
    logType: ProgressLogType;
    status: ProgressLogStatus;
    assigneeId: string | null;
    assigneeName: string | null;
    hoursSpent: number | null;
  }>
): Promise<ActionResult> {
  const supabase = await createClient();
  const updateData: Record<string, unknown> = {};
  if (params.subProjectId !== undefined) updateData.sub_project_id = params.subProjectId;
  if (params.title !== undefined) updateData.title = params.title.trim();
  if (params.description !== undefined) updateData.description = params.description?.trim() || null;
  if (params.logDate !== undefined) updateData.log_date = params.logDate;
  if (params.logType !== undefined) updateData.log_type = params.logType;
  if (params.status !== undefined) updateData.status = params.status;
  if (params.assigneeId !== undefined) updateData.assignee_id = params.assigneeId;
  if (params.assigneeName !== undefined) updateData.assignee_name = params.assigneeName;
  if (params.hoursSpent !== undefined) updateData.hours_spent = params.hoursSpent;

  const { error } = await supabase
    .from("progress_logs")
    .update(updateData as never)
    .eq("id", logId);
  if (error) return { error: error.message };
  revalidatePath("/reports");
  return { success: true };
}

export async function deleteProgressLog(logId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("progress_logs")
    .delete()
    .eq("id", logId);
  if (error) return { error: error.message };
  revalidatePath("/reports");
  return { success: true };
}

// ── Report Templates (양식) ──

export async function getReportTemplates(params?: {
  projectId?: string;
  scope?: "project" | "personal";
}): Promise<ActionResult> {
  const supabase = await createClient();
  let query = supabase
    .from("report_templates")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (params?.projectId) {
    query = query.or(`project_id.eq.${params.projectId},project_id.is.null`);
  }
  if (params?.scope) {
    query = query.eq("scope", params.scope);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { success: true, data };
}

// ── Reports (보고서) ──

export async function getReports(params?: {
  projectId?: string;
  templateId?: string;
  status?: ReportStatus;
  assigneeId?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  let query = supabase
    .from("reports")
    .select(`
      *,
      report_templates(id, name, period_type, scope),
      projects(id, name, short_name)
    `)
    .order("period_start", { ascending: false });

  if (params?.projectId) query = query.eq("project_id", params.projectId);
  if (params?.templateId) query = query.eq("template_id", params.templateId);
  if (params?.status) query = query.eq("status", params.status);
  if (params?.assigneeId) query = query.eq("assignee_id", params.assigneeId);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { success: true, data };
}

export async function getReport(reportId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      report_templates(*, projects(id, name, short_name)),
      projects(id, code, name, short_name)
    `)
    .eq("id", reportId)
    .single();
  if (error) return { error: error.message };
  return { success: true, data };
}

export async function createReport(params: {
  templateId: string;
  projectId?: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  assigneeId?: string;
  content: ReportContent;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const member = await supabase
    .from("members")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (member.error) return { error: "Member not found" };

  const { data, error } = await supabase
    .from("reports")
    .insert({
      template_id: params.templateId,
      project_id: params.projectId || null,
      title: params.title,
      period_start: params.periodStart,
      period_end: params.periodEnd,
      assignee_id: params.assigneeId || null,
      content: params.content as never,
      status: "draft",
      created_by: member.data.id,
    } as never)
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/reports");
  return { success: true, id: data.id };
}

export async function updateReport(
  reportId: string,
  params: Partial<{
    title: string;
    content: ReportContent;
    status: ReportStatus;
  }>
): Promise<ActionResult> {
  const supabase = await createClient();
  const updateData: Record<string, unknown> = {};
  if (params.title !== undefined) updateData.title = params.title;
  if (params.content !== undefined) updateData.content = params.content;
  if (params.status !== undefined) {
    updateData.status = params.status;
    if (params.status === "submitted") {
      updateData.submitted_at = new Date().toISOString();
    }
  }

  const { error } = await supabase
    .from("reports")
    .update(updateData as never)
    .eq("id", reportId);
  if (error) return { error: error.message };
  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
  return { success: true };
}

export async function deleteReport(reportId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", reportId);
  if (error) return { error: error.message };
  revalidatePath("/reports");
  return { success: true };
}
```

---

## 4. Components

### 4.1 페이지 라우트 구조

```
src/app/(dashboard)/reports/
├── page.tsx                    -- 보고서 목록 (ReportsListPage)
├── loading.tsx                 -- 스켈레톤 로딩
├── [id]/
│   ├── page.tsx               -- 보고서 상세 (ReportDetailPage)
│   └── edit/
│       └── page.tsx           -- 보고서 편집 (ReportEditPage)
└── progress/
    └── page.tsx               -- 추진경과 관리 (ProgressLogsPage)
```

### 4.2 컴포넌트 구조

```
src/components/features/reports/
├── report-list.tsx                  -- 보고서 목록 카드/테이블
├── report-detail-view.tsx           -- 보고서 상세 보기 (테이블 렌더링)
├── report-edit-form.tsx             -- 보고서 편집 폼
├── auto-generate-dialog.tsx         -- ★ 보고서 자동 생성 다이얼로그
├── progress-log-form.tsx            -- 추진경과 입력/수정 폼
├── progress-log-list.tsx            -- 추진경과 목록
├── progress-preview-tree.tsx        -- 자동 생성 미리보기 (업무구분별 트리)
├── presentation-mode.tsx            -- ★ 발표 모드
├── print-dialog.tsx                 -- ★ 인쇄 설정 다이얼로그
└── print-layout.tsx                 -- ★ 인쇄 전용 레이아웃
```

### 4.3 AutoGenerateDialog (핵심 컴포넌트)

**File:** `src/components/features/reports/auto-generate-dialog.tsx`

```typescript
interface AutoGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (reportId: string) => void;
}
```

**상태 관리:**
```typescript
// Step 1: 양식 & 프로젝트 선택
const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
const [selectedProjectId, setSelectedProjectId] = useState<string>("");
const [periodStart, setPeriodStart] = useState<string>("");
const [periodEnd, setPeriodEnd] = useState<string>("");

// Step 2: 추진경과 미리보기
const [progressLogs, setProgressLogs] = useState<ProgressLogWithDetails[]>([]);
const [checkedLogIds, setCheckedLogIds] = useState<Set<string>>(new Set());
const [loading, setLoading] = useState(false);

// Step 3: 추가 옵션
const [includeNextPeriodPlans, setIncludeNextPeriodPlans] = useState(true);
const [includeMeetings, setIncludeMeetings] = useState(true);
```

**UI 레이아웃:**
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 보고서 자동 생성                                       ✕ │
│                                                             │
│  ┌─ 양식 선택 ──────────────────────────────────────────┐   │
│  │ <Select> 양식 목록                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─ 프로젝트 ──────────────────────────────────────────┐    │
│  │ <Select> (양식의 project_id가 있으면 자동 선택)      │    │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─ 기간 ──────┐ ┌─────────────┐                            │
│  │ <Input date> │ │ <Input date> │  [금주] [이번달] 버튼     │
│  └──────────────┘ └─────────────┘                            │
│                                                             │
│  ── 추진경과 미리보기 ────────────────────────              │
│                                                             │
│  ▼ 1. 거버넌스 역량강화                                     │
│    └ (해당 기간 추진경과 없음)                               │
│  ▼ 2. 돌봄공급자 간 협업체계 구축                            │
│    ☑ 3/24 DB구축 돌봄 분야 설정 (오형은)                     │
│    ☑ 3/25 다-돌봄 웹사이트 메뉴 개편 (오형은)               │
│    ☐ 3/23 내부 자료정리 (강수아)                             │
│  ▼ 3. 온라인 플랫폼 기획 및 활용                            │
│    ☑ 3/24 업무분석 (오형은)                                  │
│  ...                                                        │
│                                                             │
│  ── 추가 옵션 ──────────────────                            │
│  ☑ 차주 계획 자동 반영 (상태='계획')                        │
│  ☑ 회의/보고 유형 자동 포함                                  │
│                                                             │
│                       [취소]  [미리보기]  [생성]              │
└─────────────────────────────────────────────────────────────┘
```

**동작 흐름:**
1. 양식 선택 → `getReportTemplates()` 호출
2. 프로젝트 선택 + 기간 입력 → `getProgressLogs()` 호출
3. 추진경과를 `sub_project` 기준으로 그룹핑하여 트리 표시
4. 체크박스로 포함/제외 선택
5. "생성" 클릭 → 체크된 항목으로 `ReportContent` 객체 생성 → `createReport()` 호출
6. 성공 시 `onGenerated(reportId)` → 편집 화면으로 이동

### 4.4 ProgressPreviewTree

**File:** `src/components/features/reports/progress-preview-tree.tsx`

```typescript
interface ProgressPreviewTreeProps {
  subProjects: SubProject[];
  progressLogs: ProgressLogWithDetails[];
  checkedLogIds: Set<string>;
  onToggleLog: (logId: string) => void;
  onToggleSubProject: (subProjectId: string) => void;
}
```

**구현:**
- `subProjects`를 `sort_order` 기준으로 렌더링
- 각 단위사업 아래에 해당 추진경과 목록 (Collapsible)
- 단위사업 레벨 체크박스: 하위 전체 토글
- 개별 추진경과 체크박스: 개별 토글
- 추진경과 없는 단위사업: "(해당 기간 추진경과 없음)" 표시

### 4.5 PresentationMode

**File:** `src/components/features/reports/presentation-mode.tsx`

```typescript
interface PresentationModeProps {
  report: ReportWithDetails;
  subProjects: SubProject[];
  onClose: () => void;
}
```

**상태:**
```typescript
const [currentSlide, setCurrentSlide] = useState(0);
const [isFullscreen, setIsFullscreen] = useState(false);
```

**슬라이드 분할 로직:**
```typescript
function splitIntoSlides(
  subProjects: SubProject[],
  content: ReportContentMatrix,
  maxRowsPerSlide: number = 3
): Slide[] {
  // 단위사업을 maxRowsPerSlide개씩 묶어서 슬라이드 생성
  // 마지막 슬라이드에 meetings, remarks 섹션 추가
}
```

**키보드 이벤트:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === " ") nextSlide();
    if (e.key === "ArrowLeft") prevSlide();
    if (e.key === "Escape") onClose();
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [currentSlide]);
```

**전체화면 API:**
```typescript
const enterFullscreen = () => {
  document.documentElement.requestFullscreen();
  setIsFullscreen(true);
};
```

**UI 레이아웃:**
```
┌──────────────────────────────────────────────────────────────┐
│ (fixed top bar)                           [이전][다음][닫기] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  (centered content, large font)                              │
│                                                              │
│  Title: 2026년 3월 4주차 주간 공정보고 (청양읍)             │
│  Subtitle: 보고기간 3.23~29                                  │
│                                                              │
│  ┌──────────┬────────────────────┬────────────────────┐      │
│  │ 업무구분  │ 추진경과 (금주)    │ 추진계획 (차주)    │      │
│  ├──────────┼────────────────────┼────────────────────┤      │
│  │ rows...  │ ...                │ ...                │      │
│  └──────────┴────────────────────┴────────────────────┘      │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ (fixed bottom bar)                      슬라이드 1 / 3       │
└──────────────────────────────────────────────────────────────┘
```

**스타일링:**
- 배경: `bg-white dark:bg-slate-900`
- 글씨: `text-lg md:text-xl lg:text-2xl` (반응형 확대)
- 테이블: `border-2 border-slate-300` (선명한 테두리)
- 전체화면: `fixed inset-0 z-50`

### 4.6 PrintDialog & PrintLayout

**File:** `src/components/features/reports/print-dialog.tsx`

```typescript
interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ReportWithDetails;
  subProjects: SubProject[];
}
```

**상태:**
```typescript
const [format, setFormat] = useState<"basic" | "official">("official");
const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
const [includeSections, setIncludeSections] = useState({
  info: true,
  progressTable: true,
  meetings: true,
  remarks: false,
});
```

**File:** `src/components/features/reports/print-layout.tsx`

```typescript
interface PrintLayoutProps {
  report: ReportWithDetails;
  subProjects: SubProject[];
  format: "basic" | "official";
  includeSections: Record<string, boolean>;
}
```

**인쇄 CSS (`src/app/globals.css` 또는 별도 print.css):**

```css
@media print {
  /* 사이드바, 네비게이션 숨김 */
  [data-sidebar],
  nav,
  header:not(.print-header) {
    display: none !important;
  }

  /* 인쇄 영역만 표시 */
  .print-layout {
    display: block !important;
    width: 100%;
    margin: 0;
    padding: 0;
  }

  /* 페이지 설정 */
  @page {
    size: A4 portrait;
    margin: 15mm 20mm;
  }

  @page :first {
    margin-top: 10mm;
  }

  /* 테이블 행 분할 방지 */
  .print-table tr {
    page-break-inside: avoid;
  }

  /* 섹션 분할 방지 */
  .print-section {
    page-break-inside: avoid;
  }

  /* 기관 로고/헤더 */
  .print-header {
    display: flex !important;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  /* 푸터 (작성일) */
  .print-footer {
    display: block !important;
    text-align: right;
    margin-top: 20px;
    font-size: 10pt;
  }
}

/* 화면에서는 인쇄 전용 요소 숨김 */
@media screen {
  .print-only {
    display: none !important;
  }
}
```

### 4.7 ReportDetailView

**File:** `src/components/features/reports/report-detail-view.tsx`

```typescript
interface ReportDetailViewProps {
  report: ReportWithDetails;
  subProjects: SubProject[];
}
```

보고서 content JSONB를 해석하여 양식에 맞는 테이블로 렌더링.
- `progress_matrix` 타입: 업무구분 × 컬럼 테이블 (shadcn Table)
- `list` 타입: 불릿 목록
- `text` 타입: 텍스트 블록

### 4.8 ReportEditForm

**File:** `src/components/features/reports/report-edit-form.tsx`

```typescript
interface ReportEditFormProps {
  report: ReportWithDetails;
  subProjects: SubProject[];
  onSave: () => void;
}
```

- 각 섹션별 편집 UI 제공
- `progress_matrix` → 셀별 텍스트 편집 (Textarea)
- `list` → 항목 추가/삭제/편집
- `text` → Textarea
- "저장" 버튼 → `updateReport()` 호출

---

## 5. Page Integration

### 5.1 보고서 목록 페이지

**File:** `src/app/(dashboard)/reports/page.tsx`

```typescript
export const revalidate = 60;

export default async function ReportsPage() {
  const supabase = await createClient();
  // Fetch reports, templates
  // Render: 보고서 목록 + "새 보고서" + "보고서 자동 생성" 버튼
}
```

**UI:**
```
┌────────────────────────────────────────────────────────────┐
│ 📊 보고서 관리                  [+ 새 보고서] [⚡ 자동 생성] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  필터: [전체 ▼] [전체 양식 ▼] [전체 상태 ▼]               │
│                                                            │
│  ┌─ Card ──────────────────────────────────────────────┐   │
│  │ 2026년 3월 4주차 주간 공정보고 (청양읍)             │   │
│  │ 주간 공정보고 · 3.23~29 · 작성자: 오형은            │   │
│  │ [제출됨] Badge                              [상세 →] │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─ Card ──────────────────────────────────────────────┐   │
│  │ ...                                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### 5.2 보고서 상세 페이지

**File:** `src/app/(dashboard)/reports/[id]/page.tsx`

```typescript
export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Fetch report with template, project, sub_projects
  // Render: 보고서 상세 + 수정/인쇄/발표모드 버튼
}
```

**UI:**
```
┌────────────────────────────────────────────────────────────┐
│ 2026년 3월 4주차 주간 공정보고 (청양읍)                    │
│ [제출됨]   [✏️ 수정]  [🖨️ 인쇄]  [🖥️ 발표 모드]  [← 목록]│
├────────────────────────────────────────────────────────────┤
│                                                            │
│  <ReportDetailView report={report} subProjects={subs} />   │
│                                                            │
│  <PresentationMode />  (모달, 버튼 클릭 시)                │
│  <PrintDialog />       (모달, 버튼 클릭 시)                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 5.3 사이드바 네비게이션 추가

**File:** `src/components/layout/sidebar.tsx` (또는 해당 위치)

```typescript
// 기존 메뉴 항목에 추가
{
  title: "보고서",
  href: "/reports",
  icon: FileText,  // lucide-react
}
```

---

## 6. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/00020_create_projects_table.sql` | Create | projects 테이블 |
| `supabase/migrations/00021_create_sub_projects_table.sql` | Create | sub_projects 테이블 |
| `supabase/migrations/00022_create_progress_logs_table.sql` | Create | progress_logs 테이블 + enum |
| `supabase/migrations/00023_create_report_templates_table.sql` | Create | report_templates 테이블 + enum |
| `supabase/migrations/00024_create_reports_table.sql` | Create | reports 테이블 + enum |
| `src/types/database.types.ts` | Modify | 새 타입/인터페이스 추가 |
| `src/lib/actions/reports.ts` | Create | 보고서 관련 서버 액션 |
| `src/app/(dashboard)/reports/page.tsx` | Create | 보고서 목록 페이지 |
| `src/app/(dashboard)/reports/loading.tsx` | Create | 스켈레톤 로딩 |
| `src/app/(dashboard)/reports/[id]/page.tsx` | Create | 보고서 상세 페이지 |
| `src/app/(dashboard)/reports/[id]/edit/page.tsx` | Create | 보고서 편집 페이지 |
| `src/app/(dashboard)/reports/progress/page.tsx` | Create | 추진경과 관리 페이지 |
| `src/components/features/reports/report-list.tsx` | Create | 보고서 목록 컴포넌트 |
| `src/components/features/reports/report-detail-view.tsx` | Create | 보고서 상세 뷰 |
| `src/components/features/reports/report-edit-form.tsx` | Create | 보고서 편집 폼 |
| `src/components/features/reports/auto-generate-dialog.tsx` | Create | 자동 생성 다이얼로그 |
| `src/components/features/reports/progress-log-form.tsx` | Create | 추진경과 입력 폼 |
| `src/components/features/reports/progress-log-list.tsx` | Create | 추진경과 목록 |
| `src/components/features/reports/progress-preview-tree.tsx` | Create | 미리보기 트리 |
| `src/components/features/reports/presentation-mode.tsx` | Create | 발표 모드 |
| `src/components/features/reports/print-dialog.tsx` | Create | 인쇄 설정 다이얼로그 |
| `src/components/features/reports/print-layout.tsx` | Create | 인쇄 전용 레이아웃 |
| `src/app/globals.css` | Modify | @media print CSS 추가 |
| sidebar 컴포넌트 | Modify | "보고서" 메뉴 항목 추가 |

---

## 7. Implementation Order

```
Step 1: DB Migration (5개 테이블)
  ├── 00020_create_projects_table.sql
  ├── 00021_create_sub_projects_table.sql
  ├── 00022_create_progress_logs_table.sql
  ├── 00023_create_report_templates_table.sql
  └── 00024_create_reports_table.sql

Step 2: TypeScript Types
  └── src/types/database.types.ts (타입 추가)

Step 3: Server Actions
  └── src/lib/actions/reports.ts

Step 4: 추진경과 관리 (기본 CRUD)
  ├── src/components/features/reports/progress-log-form.tsx
  ├── src/components/features/reports/progress-log-list.tsx
  └── src/app/(dashboard)/reports/progress/page.tsx

Step 5: 보고서 목록 & 상세 (기본 뷰)
  ├── src/components/features/reports/report-list.tsx
  ├── src/components/features/reports/report-detail-view.tsx
  ├── src/app/(dashboard)/reports/page.tsx
  ├── src/app/(dashboard)/reports/loading.tsx
  └── src/app/(dashboard)/reports/[id]/page.tsx

Step 6: 보고서 자동 생성 다이얼로그
  ├── src/components/features/reports/progress-preview-tree.tsx
  └── src/components/features/reports/auto-generate-dialog.tsx

Step 7: 보고서 편집
  ├── src/components/features/reports/report-edit-form.tsx
  └── src/app/(dashboard)/reports/[id]/edit/page.tsx

Step 8: 발표 모드
  └── src/components/features/reports/presentation-mode.tsx

Step 9: 인쇄 출력
  ├── src/components/features/reports/print-dialog.tsx
  ├── src/components/features/reports/print-layout.tsx
  └── src/app/globals.css (@media print)

Step 10: 사이드바 통합
  └── sidebar 컴포넌트 수정
```

---

## 8. Data Flow

### 8.1 보고서 자동 생성 흐름

```
사용자: "보고서 자동 생성" 클릭
  │
  ▼
AutoGenerateDialog 열림
  │
  ├─ 양식 선택 → getReportTemplates() → Select 렌더링
  ├─ 프로젝트 선택 → getProjects() → Select 렌더링
  ├─ 기간 입력 → 금주/이번달 자동 설정
  │
  ▼
"미리보기 로드" (양식+프로젝트+기간 모두 선택 시 자동 트리거)
  │
  ├─ getSubProjects(projectId) → 단위사업 목록
  ├─ getProgressLogs({ projectId, startDate, endDate }) → 추진경과 목록
  │
  ▼
ProgressPreviewTree 렌더링
  │
  ├─ 추진경과를 sub_project_id 기준 그룹핑
  ├─ 각 항목에 체크박스 (기본: 전부 체크)
  │
  ▼
사용자: 체크 조정 후 "생성" 클릭
  │
  ▼
buildReportContent(template, checkedLogs, subProjects)
  │
  ├─ progress_matrix 섹션: sub_project별 → column별 → 체크된 log entry[]
  ├─ list 섹션: log_type 필터링된 체크된 log entry[]
  ├─ text 섹션: 빈 문자열 (수동 입력용)
  │
  ▼
createReport({ templateId, projectId, title, periodStart, periodEnd, content })
  │
  ▼
Router.push(`/reports/${newReportId}/edit`) → 편집 화면
```

### 8.2 발표 모드 흐름

```
사용자: "발표 모드" 클릭
  │
  ▼
PresentationMode 마운트 (fixed overlay, z-50)
  │
  ├─ splitIntoSlides(subProjects, content, 3)
  │    → Slide[]: 단위사업 3개씩 묶음 + 마지막 슬라이드(회의/기타)
  │
  ├─ requestFullscreen()
  │
  ▼
슬라이드 렌더링 (currentSlide state)
  │
  ├─ ArrowRight / Space → nextSlide()
  ├─ ArrowLeft → prevSlide()
  ├─ Escape → onClose() + exitFullscreen()
```

### 8.3 인쇄 흐름

```
사용자: "인쇄" 클릭
  │
  ▼
PrintDialog 열림
  │
  ├─ 출력 양식 선택 (기본/공식)
  ├─ 용지 방향 선택
  ├─ 포함 항목 체크
  │
  ▼
"미리보기" 클릭 → PrintLayout 렌더링 (새 창/탭)
  │
  ├─ @media print CSS 적용
  ├─ 기관 로고/헤더 삽입 (공식 양식)
  ├─ page-break-inside: avoid (행 분할 방지)
  │
  ▼
"인쇄" 클릭 → window.print()
```

---

## 9. 개인 월간보고 특화 로직

개인 월간보고(`scope = 'personal'`) 양식의 AutoGenerateDialog 변형:

```typescript
// scope === "personal" 일 때의 차이점

// 1. 프로젝트 선택 대신 담당자 선택
//    → 현재 로그인 사용자 자동 선택
//    → getPersonalProgressLogs({ assigneeId, startDate, endDate })

// 2. 미리보기가 프로젝트별 그룹핑
//    → 📁 프로젝트A
//       ☑ 3/16 작업1
//       ☑ 3/20 작업2
//    → 📁 프로젝트B
//       ☑ 3/15 작업3

// 3. 양식 섹션별 매핑
//    섹션 2 "주요 업무 추진실적" → 프로젝트별 행, 추진경과 제목 요약
//    섹션 3 "핵심 과업" → status === 'completed' 항목
//    섹션 3 "협업/대외" → log_type === 'meeting' 항목
//    섹션 5 "차월 계획" → status === 'planned' 항목
```

---

## 10. 초기 데이터 시드

프로젝트와 단위사업 초기 데이터:

```sql
-- supabase/seed/report_seed.sql (개발환경용)

INSERT INTO projects (code, name, short_name) VALUES
  ('2612', '청양읍 농촌중심지활성화사업 지역역량강화용역', '청양읍'),
  ('2613', '홍성군 도산1,화계2리 농업환경보전프로그램', '홍성군');

-- 청양읍 단위사업
INSERT INTO sub_projects (project_id, code, name, sort_order) VALUES
  ((SELECT id FROM projects WHERE code = '2612'), '26121', '거버넌스 역량강화', 1),
  ((SELECT id FROM projects WHERE code = '2612'), '26122', '돌봄공급자 간 협업체계 구축', 2),
  ((SELECT id FROM projects WHERE code = '2612'), '26123', '온라인 플랫폼 기획 및 활용', 3),
  ((SELECT id FROM projects WHERE code = '2612'), '26124', '면 단위 돌봄체계 구축', 4),
  ((SELECT id FROM projects WHERE code = '2612'), '26125', '돌봄 수요조사 및 분석', 5),
  ((SELECT id FROM projects WHERE code = '2612'), '26126', '기타 사업 지원', 6);
```

---

## Created
2026-03-26
