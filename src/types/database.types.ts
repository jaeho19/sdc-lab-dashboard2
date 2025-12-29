export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MemberPosition =
  | "professor"
  | "post_doc"
  | "phd"
  | "researcher"
  | "ms";

export type EmploymentType = "full-time" | "part-time";

export type MemberStatus = "pending" | "active" | "graduated" | "leave";

export type ProjectCategory =
  | "thesis"
  | "submission"
  | "revision"
  | "individual"
  | "grant";

export type ProjectStatus =
  | "preparing"
  | "submitting"
  | "under_review"
  | "revision"
  | "accepted"
  | "published";

// 6단계 마일스톤 (투고까지 100%)
export type MilestoneStage =
  | "literature_review"   // 문헌조사 15%
  | "methodology"         // 방법론 설계 15%
  | "data_collection"     // 데이터 수집 15%
  | "analysis"            // 분석 25%
  | "draft_writing"       // 초고 작성 20%
  | "submission";         // 투고 10%

export type ProjectType = "advanced" | "general";  // 선진연구 / 일반연구

export type ProjectMemberRole = "first_author" | "corresponding" | "co_author";

export type CalendarCategory =
  | "lab_meeting"
  | "conference"
  | "social"
  | "deadline"
  | "seminar"
  | "study"
  | "field_trip"
  | "vacation";

export type NotificationType =
  | "deadline_reminder"
  | "mentoring_comment"
  | "mentoring_like"
  | "project_update";

export type WeeklyGoalStatus = "pending" | "completed";

export type FileEntityType = "project" | "mentoring_post" | "flowchart";

export type PeerReviewStatus = "pending" | "processing" | "completed" | "error";

// 투고 상태 (진행률 100% 이후)
export type SubmissionStatus =
  | "not_submitted"      // 아직 투고 전 (진행 중인 연구)
  | "under_review"       // 최초 투고 후 심사 대기/진행 중
  | "major_revision"     // 대폭 수정 요청받음
  | "minor_revision"     // 소폭 수정 요청받음
  | "revision_submitted" // 수정본 재투고 완료, 재심사 중
  | "accepted";          // 게재 확정

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          avatar_url: string | null;
          position: MemberPosition;
          employment_type: EmploymentType;
          enrollment_year: number | null;
          expected_graduation_year: number | null;
          admission_date: string | null;
          graduation_date: string | null;
          interests: string | null;
          is_completed: boolean;
          status: MemberStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email: string;
          avatar_url?: string | null;
          position: MemberPosition;
          employment_type: EmploymentType;
          enrollment_year?: number | null;
          expected_graduation_year?: number | null;
          admission_date?: string | null;
          graduation_date?: string | null;
          interests?: string | null;
          is_completed?: boolean;
          status?: MemberStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          avatar_url?: string | null;
          position?: MemberPosition;
          employment_type?: EmploymentType;
          enrollment_year?: number | null;
          expected_graduation_year?: number | null;
          admission_date?: string | null;
          graduation_date?: string | null;
          interests?: string | null;
          is_completed?: boolean;
          status?: MemberStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      research_projects: {
        Row: {
          id: string;
          title: string;
          category: ProjectCategory;
          project_type: ProjectType;
          description: string | null;
          target_journal: string | null;
          deadline: string | null;
          status: ProjectStatus;
          overall_progress: number;
          flowchart_md: string | null;
          first_author: string | null;
          co_authors: string | null;
          corresponding_author: string | null;
          submission_status: SubmissionStatus;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          category: ProjectCategory;
          project_type?: ProjectType;
          description?: string | null;
          target_journal?: string | null;
          deadline?: string | null;
          status?: ProjectStatus;
          overall_progress?: number;
          flowchart_md?: string | null;
          first_author?: string | null;
          co_authors?: string | null;
          corresponding_author?: string | null;
          submission_status?: SubmissionStatus;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: ProjectCategory;
          project_type?: ProjectType;
          description?: string | null;
          target_journal?: string | null;
          deadline?: string | null;
          status?: ProjectStatus;
          overall_progress?: number;
          flowchart_md?: string | null;
          first_author?: string | null;
          co_authors?: string | null;
          corresponding_author?: string | null;
          submission_status?: SubmissionStatus;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_authors: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          role: ProjectMemberRole;
          responsibilities: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          role: ProjectMemberRole;
          responsibilities?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          role?: ProjectMemberRole;
          responsibilities?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          member_id: string;
          role: ProjectMemberRole;
          responsibilities: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          member_id: string;
          role: ProjectMemberRole;
          responsibilities?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          member_id?: string;
          role?: ProjectMemberRole;
          responsibilities?: string | null;
        };
      };
      milestones: {
        Row: {
          id: string;
          project_id: string;
          stage: MilestoneStage;
          weight: number;
          is_current: boolean;
          completed_at: string | null;
          notes: string | null;
          sort_order: number | null;
          start_date: string | null;
          end_date: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          stage: MilestoneStage;
          weight?: number;
          is_current?: boolean;
          completed_at?: string | null;
          notes?: string | null;
          sort_order?: number | null;
          start_date?: string | null;
          end_date?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          stage?: MilestoneStage;
          weight?: number;
          is_current?: boolean;
          completed_at?: string | null;
          notes?: string | null;
          sort_order?: number | null;
          start_date?: string | null;
          end_date?: string | null;
        };
      };
      checklist_items: {
        Row: {
          id: string;
          milestone_id: string;
          content: string;
          is_completed: boolean;
          completed_at: string | null;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          milestone_id: string;
          content: string;
          is_completed?: boolean;
          completed_at?: string | null;
          sort_order?: number | null;
        };
        Update: {
          id?: string;
          milestone_id?: string;
          content?: string;
          is_completed?: boolean;
          completed_at?: string | null;
          sort_order?: number | null;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          start_datetime: string;
          end_datetime: string | null;
          is_all_day: boolean;
          category: CalendarCategory;
          is_shared: boolean;
          member_id: string | null;
          project_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          start_datetime: string;
          end_datetime?: string | null;
          is_all_day?: boolean;
          category: CalendarCategory;
          is_shared?: boolean;
          member_id?: string | null;
          project_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          start_datetime?: string;
          end_datetime?: string | null;
          is_all_day?: boolean;
          category?: CalendarCategory;
          is_shared?: boolean;
          member_id?: string | null;
          project_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      member_courses: {
        Row: {
          id: string;
          member_id: string;
          course_name: string;
          semester: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          course_name: string;
          semester?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          course_name?: string;
          semester?: string | null;
          created_at?: string;
        };
      };
      mentoring_posts: {
        Row: {
          id: string;
          author_id: string;
          target_member_id: string | null;
          content: string;
          meeting_date: string | null;
          professor_comments: string | null;
          next_steps: string[] | null;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          target_member_id?: string | null;
          content: string;
          meeting_date?: string | null;
          professor_comments?: string | null;
          next_steps?: string[] | null;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          target_member_id?: string | null;
          content?: string;
          meeting_date?: string | null;
          professor_comments?: string | null;
          next_steps?: string[] | null;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      mentoring_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          content?: string;
          created_at?: string;
        };
      };
      mentoring_likes: {
        Row: {
          id: string;
          post_id: string;
          member_id: string;
          created_at: string;
        };
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
      };
      files: {
        Row: {
          id: string;
          filename: string;
          original_filename: string;
          file_path: string;
          file_size: number | null;
          mime_type: string | null;
          uploaded_by: string | null;
          entity_type: FileEntityType;
          entity_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          filename: string;
          original_filename: string;
          file_path: string;
          file_size?: number | null;
          mime_type?: string | null;
          uploaded_by?: string | null;
          entity_type: FileEntityType;
          entity_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          filename?: string;
          original_filename?: string;
          file_path?: string;
          file_size?: number | null;
          mime_type?: string | null;
          uploaded_by?: string | null;
          entity_type?: FileEntityType;
          entity_id?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          member_id: string;
          type: NotificationType;
          title: string;
          message: string | null;
          entity_type: string | null;
          entity_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          type: NotificationType;
          title: string;
          message?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          type?: NotificationType;
          title?: string;
          message?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      weekly_goals: {
        Row: {
          id: string;
          project_id: string;
          content: string;
          deadline: string;
          linked_stage: MilestoneStage | null;
          is_completed: boolean;
          completed_at: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          content: string;
          deadline: string;
          linked_stage?: MilestoneStage | null;
          is_completed?: boolean;
          completed_at?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          content?: string;
          deadline?: string;
          linked_stage?: MilestoneStage | null;
          is_completed?: boolean;
          completed_at?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      peer_reviews: {
        Row: {
          id: string;
          member_id: string;
          project_id: string | null;
          title: string;
          content: string;
          review_result: string | null;
          review_status: PeerReviewStatus;
          created_at: string;
          updated_at: string;
        };
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
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
