// Supabase Database Types
// 실제 스키마 생성 후 `npx supabase gen types typescript` 명령으로 대체 가능

export type MemberPosition = "professor" | "post-doc" | "phd" | "ms" | "researcher";
export type MemberStatus = "pending" | "active" | "graduated" | "leave";
export type EmploymentType = "full-time" | "part-time";
export type ProjectCategory = "thesis" | "submission" | "revision" | "publication" | "other";
export type ProjectStatus = "preparing" | "in_progress" | "under_review" | "revision" | "completed" | "on_hold";
export type EventCategory = "meeting" | "deadline" | "seminar" | "holiday" | "personal" | "other";
export type FileEntityType = "project" | "mentoring" | "research_note";
export type NotificationType = "deadline" | "comment" | "like" | "project_update" | "research_note_comment";
export type PeerReviewStatus = "pending" | "processing" | "completed" | "error";

export interface Member {
  id: string;
  email: string;
  name: string;
  name_en: string | null;
  position: MemberPosition;
  employment_type: EmploymentType;
  status: MemberStatus;
  avatar_url: string | null;
  phone: string | null;
  research_interests: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchProject {
  id: string;
  title: string;
  description: string | null;
  category: ProjectCategory;
  status: ProjectStatus;
  overall_progress: number;
  start_date: string | null;
  target_date: string | null;
  flowchart_url: string | null;
  created_by: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  member_id: string;
  role: string;
  created_at: string;
}

export type MilestoneStage =
  | "literature_review"
  | "methodology"
  | "data_collection"
  | "analysis"
  | "draft_writing"
  | "submission"
  | "review_revision"
  | "publication";

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  stage: MilestoneStage | null;
  description: string | null;
  weight: number;
  order_index: number;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  milestone_id: string;
  content: string;
  is_completed: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  is_public: boolean;
  member_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MemberCourse {
  id: string;
  member_id: string;
  course_name: string;
  semester: string;
  created_at: string;
}

export interface MentoringPost {
  id: string;
  author_id: string;
  meeting_date: string;
  content: string;
  professor_comment: string | null;
  next_steps: string[] | null;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface MentoringComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface MentoringLike {
  id: string;
  post_id: string;
  member_id: string;
  created_at: string;
}

export interface FileRecord {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  size: number;
  entity_type: FileEntityType;
  entity_id: string;
  uploaded_by: string;
  created_at: string;
}

export interface Notification {
  id: string;
  member_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PeerReview {
  id: string;
  member_id: string;
  project_id: string | null;
  title: string;
  content: string;
  review_result: string | null;
  review_status: PeerReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface ResearchNote {
  id: string;
  project_id: string;
  milestone_id: string | null;
  author_id: string;
  stage: MilestoneStage;
  title: string;
  content: string;
  keywords: string[];
  created_at: string;
  updated_at: string;
}

export interface ResearchNoteComment {
  id: string;
  note_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Supabase Database 타입 정의
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      members: {
        Row: Member;
        Insert: {
          id: string;
          email: string;
          name: string;
          name_en?: string | null;
          position?: MemberPosition;
          employment_type?: EmploymentType;
          status?: MemberStatus;
          avatar_url?: string | null;
          phone?: string | null;
          research_interests?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          name_en?: string | null;
          position?: MemberPosition;
          employment_type?: EmploymentType;
          status?: MemberStatus;
          avatar_url?: string | null;
          phone?: string | null;
          research_interests?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      research_projects: {
        Row: ResearchProject;
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: ProjectCategory;
          status?: ProjectStatus;
          overall_progress?: number;
          start_date?: string | null;
          target_date?: string | null;
          flowchart_url?: string | null;
          created_by: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: ProjectCategory;
          status?: ProjectStatus;
          overall_progress?: number;
          start_date?: string | null;
          target_date?: string | null;
          flowchart_url?: string | null;
          created_by?: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_members: {
        Row: ProjectMember;
        Insert: {
          id?: string;
          project_id: string;
          member_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          member_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      milestones: {
        Row: Milestone;
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          weight?: number;
          order_index?: number;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          weight?: number;
          order_index?: number;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      checklist_items: {
        Row: ChecklistItem;
        Insert: {
          id?: string;
          milestone_id: string;
          content: string;
          is_completed?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          milestone_id?: string;
          content?: string;
          is_completed?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      calendar_events: {
        Row: CalendarEvent;
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: EventCategory;
          start_date: string;
          end_date?: string | null;
          all_day?: boolean;
          is_public?: boolean;
          member_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: EventCategory;
          start_date?: string;
          end_date?: string | null;
          all_day?: boolean;
          is_public?: boolean;
          member_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      member_courses: {
        Row: MemberCourse;
        Insert: {
          id?: string;
          member_id: string;
          course_name: string;
          semester: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          course_name?: string;
          semester?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      mentoring_posts: {
        Row: MentoringPost;
        Insert: {
          id?: string;
          author_id: string;
          meeting_date: string;
          content: string;
          professor_comment?: string | null;
          next_steps?: string[] | null;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          meeting_date?: string;
          content?: string;
          professor_comment?: string | null;
          next_steps?: string[] | null;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mentoring_comments: {
        Row: MentoringComment;
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mentoring_likes: {
        Row: MentoringLike;
        Insert: {
          id?: string;
          post_id: string;
          member_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          member_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      files: {
        Row: FileRecord;
        Insert: {
          id?: string;
          name: string;
          storage_path: string;
          mime_type: string;
          size: number;
          entity_type: FileEntityType;
          entity_id: string;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          storage_path?: string;
          mime_type?: string;
          size?: number;
          entity_type?: FileEntityType;
          entity_id?: string;
          uploaded_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: {
          id?: string;
          member_id: string;
          type: NotificationType;
          title: string;
          message: string;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          type?: NotificationType;
          title?: string;
          message?: string;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      peer_reviews: {
        Row: PeerReview;
        Insert: {
          id?: string;
          member_id: string;
          project_id?: string | null;
          title: string;
          content: string;
          review_result?: string | null;
          review_status?: PeerReviewStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          project_id?: string | null;
          title?: string;
          content?: string;
          review_result?: string | null;
          review_status?: PeerReviewStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      research_notes: {
        Row: ResearchNote;
        Insert: {
          id?: string;
          project_id: string;
          milestone_id?: string | null;
          author_id: string;
          stage: MilestoneStage;
          title: string;
          content: string;
          keywords?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          milestone_id?: string | null;
          author_id?: string;
          stage?: MilestoneStage;
          title?: string;
          content?: string;
          keywords?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      research_note_comments: {
        Row: ResearchNoteComment;
        Insert: {
          id?: string;
          note_id: string;
          author_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          note_id?: string;
          author_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      member_position: MemberPosition;
      member_status: MemberStatus;
      employment_type: EmploymentType;
      project_category: ProjectCategory;
      project_status: ProjectStatus;
      event_category: EventCategory;
      file_entity_type: FileEntityType;
      notification_type: NotificationType;
      peer_review_status: PeerReviewStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ── Report Auto-Generation Types ──

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

// Joined view types
export interface ProgressLogWithDetails extends ProgressLog {
  sub_project?: SubProject | null;
  assignee?: { id: string; name: string } | null;
}

export interface ReportWithDetails extends Report {
  template?: ReportTemplate;
  project?: Project | null;
  assignee?: { id: string; name: string } | null;
  created_by_member?: { id: string; name: string } | null;
}
