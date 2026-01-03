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

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
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
  milestone_id: string;
  author_id: string;
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
          milestone_id: string;
          author_id: string;
          title: string;
          content: string;
          keywords?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          milestone_id?: string;
          author_id?: string;
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
