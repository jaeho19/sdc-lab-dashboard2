export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_pinned: boolean
          priority: Database["public"]["Enums"]["announcement_priority"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          priority?: Database["public"]["Enums"]["announcement_priority"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          priority?: Database["public"]["Enums"]["announcement_priority"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean
          category: Database["public"]["Enums"]["event_category"]
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          is_public: boolean
          member_id: string | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_public?: boolean
          member_id?: string | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_public?: boolean
          member_id?: string | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          content: string
          created_at: string
          id: string
          is_completed: boolean
          milestone_id: string
          order_index: number
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_completed?: boolean
          milestone_id: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          milestone_id?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_requests: {
        Row: {
          agree_privacy: boolean | null
          contacted_at: string | null
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string
          notes: string | null
          password: string | null
          phone: string
          preferred_date: string | null
          preferred_time: string | null
          source: string | null
          status: string
          treatment_type: string
          updated_at: string
        }
        Insert: {
          agree_privacy?: boolean | null
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name: string
          notes?: string | null
          password?: string | null
          phone: string
          preferred_date?: string | null
          preferred_time?: string | null
          source?: string | null
          status?: string
          treatment_type: string
          updated_at?: string
        }
        Update: {
          agree_privacy?: boolean | null
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          notes?: string | null
          password?: string | null
          phone?: string
          preferred_date?: string | null
          preferred_time?: string | null
          source?: string | null
          status?: string
          treatment_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string
          created_at: string
          description_en: string
          description_ja: string
          description_ko: string
          description_zh: string
          end_date: string
          featured: boolean | null
          gallery_images: string[] | null
          id: string
          is_published: boolean | null
          poster_image: string | null
          related_treatments: string[] | null
          slug: string
          sort_order: number | null
          start_date: string
          thumbnail_image: string | null
          title_en: string
          title_ja: string
          title_ko: string
          title_zh: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description_en?: string
          description_ja?: string
          description_ko: string
          description_zh?: string
          end_date: string
          featured?: boolean | null
          gallery_images?: string[] | null
          id?: string
          is_published?: boolean | null
          poster_image?: string | null
          related_treatments?: string[] | null
          slug: string
          sort_order?: number | null
          start_date: string
          thumbnail_image?: string | null
          title_en?: string
          title_ja?: string
          title_ko: string
          title_zh?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description_en?: string
          description_ja?: string
          description_ko?: string
          description_zh?: string
          end_date?: string
          featured?: boolean | null
          gallery_images?: string[] | null
          id?: string
          is_published?: boolean | null
          poster_image?: string | null
          related_treatments?: string[] | null
          slug?: string
          sort_order?: number | null
          start_date?: string
          thumbnail_image?: string | null
          title_en?: string
          title_ja?: string
          title_ko?: string
          title_zh?: string
          updated_at?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["file_entity_type"]
          id: string
          mime_type: string
          name: string
          size: number
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["file_entity_type"]
          id?: string
          mime_type: string
          name: string
          size: number
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["file_entity_type"]
          id?: string
          mime_type?: string
          name?: string
          size?: number
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_courses: {
        Row: {
          course_name: string
          created_at: string
          id: string
          member_id: string
          semester: string
        }
        Insert: {
          course_name: string
          created_at?: string
          id?: string
          member_id: string
          semester: string
        }
        Update: {
          course_name?: string
          created_at?: string
          id?: string
          member_id?: string
          semester?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_courses_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          admission_date: string | null
          avatar_url: string | null
          created_at: string
          email: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          graduation_date: string | null
          id: string
          interests: string | null
          name: string
          name_en: string | null
          phone: string | null
          position: Database["public"]["Enums"]["member_position"]
          research_interests: string[] | null
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
        }
        Insert: {
          admission_date?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          graduation_date?: string | null
          id: string
          interests?: string | null
          name: string
          name_en?: string | null
          phone?: string | null
          position?: Database["public"]["Enums"]["member_position"]
          research_interests?: string[] | null
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
        }
        Update: {
          admission_date?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          graduation_date?: string | null
          id?: string
          interests?: string | null
          name?: string
          name_en?: string | null
          phone?: string | null
          position?: Database["public"]["Enums"]["member_position"]
          research_interests?: string[] | null
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
        }
        Relationships: []
      }
      mentoring_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentoring_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentoring_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "mentoring_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      mentoring_likes: {
        Row: {
          created_at: string
          id: string
          member_id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          post_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentoring_likes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentoring_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "mentoring_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      mentoring_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          likes_count: number
          meeting_date: string
          next_steps: string[] | null
          professor_comment: string | null
          target_member_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          meeting_date: string
          next_steps?: string[] | null
          professor_comment?: string | null
          target_member_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          meeting_date?: string
          next_steps?: string[] | null
          professor_comment?: string | null
          target_member_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentoring_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentoring_posts_target_member_id_fkey"
            columns: ["target_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          order_index: number
          progress: number
          project_id: string
          start_date: string | null
          title: string
          updated_at: string
          weight: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          order_index?: number
          progress?: number
          project_id: string
          start_date?: string | null
          title: string
          updated_at?: string
          weight?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          order_index?: number
          progress?: number
          project_id?: string
          start_date?: string | null
          title?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          member_id: string
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          member_id: string
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          member_id?: string
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_fetch_logs: {
        Row: {
          completed_at: string | null
          details: Json | null
          errors: Json | null
          fields_searched: number
          id: string
          papers_found: number
          papers_inserted: number
          papers_skipped: number
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          details?: Json | null
          errors?: Json | null
          fields_searched?: number
          id?: string
          papers_found?: number
          papers_inserted?: number
          papers_skipped?: number
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          details?: Json | null
          errors?: Json | null
          fields_searched?: number
          id?: string
          papers_found?: number
          papers_inserted?: number
          papers_skipped?: number
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      paper_field_links: {
        Row: {
          field_id: string
          paper_id: string
          relevance: number
        }
        Insert: {
          field_id: string
          paper_id: string
          relevance?: number
        }
        Update: {
          field_id?: string
          paper_id?: string
          relevance?: number
        }
        Relationships: [
          {
            foreignKeyName: "paper_field_links_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "research_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paper_field_links_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
        ]
      }
      papers: {
        Row: {
          abstract: string | null
          authors: Json
          citation_count: number
          created_at: string
          doi: string | null
          external_id: string | null
          id: string
          is_hidden: boolean
          is_lab_member: boolean
          journal: string | null
          member_id: string | null
          publication_date: string | null
          publication_year: number | null
          raw_data: Json | null
          source: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          abstract?: string | null
          authors?: Json
          citation_count?: number
          created_at?: string
          doi?: string | null
          external_id?: string | null
          id?: string
          is_hidden?: boolean
          is_lab_member?: boolean
          journal?: string | null
          member_id?: string | null
          publication_date?: string | null
          publication_year?: number | null
          raw_data?: Json | null
          source: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          abstract?: string | null
          authors?: Json
          citation_count?: number
          created_at?: string
          doi?: string | null
          external_id?: string | null
          id?: string
          is_hidden?: boolean
          is_lab_member?: boolean
          journal?: string | null
          member_id?: string | null
          publication_date?: string | null
          publication_year?: number | null
          raw_data?: Json | null
          source?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "papers_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_reviews: {
        Row: {
          content: string
          created_at: string | null
          id: string
          member_id: string
          project_id: string | null
          review_result: string | null
          review_status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          member_id: string
          project_id?: string | null
          review_result?: string | null
          review_status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          member_id?: string
          project_id?: string | null
          review_result?: string | null
          review_status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peer_reviews_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      popups: {
        Row: {
          created_at: string
          display_end: string
          display_start: string
          id: string
          image_url: string | null
          is_active: boolean | null
          link_target: string | null
          link_url: string | null
          show_on_mobile: boolean | null
          sort_order: number | null
          title: string
          updated_at: string
          width: number | null
        }
        Insert: {
          created_at?: string
          display_end: string
          display_start: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_target?: string | null
          link_url?: string | null
          show_on_mobile?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          created_at?: string
          display_end?: string
          display_start?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_target?: string | null
          link_url?: string | null
          show_on_mobile?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: []
      }
      progress_logs: {
        Row: {
          assignee_id: string | null
          assignee_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          hours_spent: number | null
          id: string
          log_date: string
          log_type: Database["public"]["Enums"]["progress_log_type"]
          project_id: string
          status: Database["public"]["Enums"]["progress_log_status"]
          sub_project_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          assignee_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hours_spent?: number | null
          id?: string
          log_date: string
          log_type?: Database["public"]["Enums"]["progress_log_type"]
          project_id: string
          status?: Database["public"]["Enums"]["progress_log_status"]
          sub_project_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          assignee_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hours_spent?: number | null
          id?: string
          log_date?: string
          log_type?: Database["public"]["Enums"]["progress_log_type"]
          project_id?: string
          status?: Database["public"]["Enums"]["progress_log_status"]
          sub_project_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_logs_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_sub_project_id_fkey"
            columns: ["sub_project_id"]
            isOneToOne: false
            referencedRelation: "sub_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_authors: {
        Row: {
          created_at: string | null
          id: string
          name: string
          project_id: string
          responsibilities: string | null
          role: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          project_id: string
          responsibilities?: string | null
          role?: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          project_id?: string
          responsibilities?: string | null
          role?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_authors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          member_id: string
          project_id: string
          role: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          project_id: string
          role?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          project_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          code: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          short_name: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          short_name?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          short_name?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          header_config: Json | null
          id: string
          is_active: boolean
          name: string
          period_type: Database["public"]["Enums"]["report_period_type"]
          project_id: string | null
          scope: Database["public"]["Enums"]["report_scope"]
          sections: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          header_config?: Json | null
          id?: string
          is_active?: boolean
          name: string
          period_type?: Database["public"]["Enums"]["report_period_type"]
          project_id?: string | null
          scope?: Database["public"]["Enums"]["report_scope"]
          sections?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          header_config?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          period_type?: Database["public"]["Enums"]["report_period_type"]
          project_id?: string | null
          scope?: Database["public"]["Enums"]["report_scope"]
          sections?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assignee_id: string | null
          content: Json
          created_at: string
          created_by: string | null
          id: string
          period_end: string
          period_start: string
          project_id: string | null
          status: Database["public"]["Enums"]["report_status"]
          submitted_at: string | null
          template_id: string
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assignee_id?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          period_end: string
          period_start: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          submitted_at?: string | null
          template_id: string
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assignee_id?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          period_end?: string
          period_start?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          submitted_at?: string | null
          template_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      research_fields: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_fetched_at: string | null
          map_node_id: string | null
          name: string
          name_en: string
          search_queries: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_fetched_at?: string | null
          map_node_id?: string | null
          name: string
          name_en: string
          search_queries?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_fetched_at?: string | null
          map_node_id?: string | null
          name?: string
          name_en?: string
          search_queries?: Json
          updated_at?: string
        }
        Relationships: []
      }
      research_meetings: {
        Row: {
          author_id: string
          created_at: string
          discussion_content: string
          id: string
          meeting_date: string
          next_steps: string | null
          previous_content: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          discussion_content: string
          id?: string
          meeting_date: string
          next_steps?: string | null
          previous_content?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          discussion_content?: string
          id?: string
          meeting_date?: string
          next_steps?: string | null
          previous_content?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      research_note_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          note_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          note_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          note_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_note_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_note_comments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "research_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      research_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          keywords: string[] | null
          milestone_id: string | null
          project_id: string
          stage: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          milestone_id?: string | null
          project_id: string
          stage?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          milestone_id?: string | null
          project_id?: string
          stage?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_notes_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      research_project_favorites: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_project_favorites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_project_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      research_projects: {
        Row: {
          category: Database["public"]["Enums"]["project_category"]
          co_authors: string | null
          corresponding_author: string | null
          created_at: string
          created_by: string
          description: string | null
          first_author: string | null
          flowchart_md: string | null
          id: string
          is_archived: boolean | null
          overall_progress: number
          project_type: string | null
          status: Database["public"]["Enums"]["project_status"]
          submission_status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string | null
          target_date: string | null
          target_journal: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["project_category"]
          co_authors?: string | null
          corresponding_author?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          first_author?: string | null
          flowchart_md?: string | null
          id?: string
          is_archived?: boolean | null
          overall_progress?: number
          project_type?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          submission_status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          target_date?: string | null
          target_journal?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["project_category"]
          co_authors?: string | null
          corresponding_author?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          first_author?: string | null
          flowchart_md?: string | null
          id?: string
          is_archived?: boolean | null
          overall_progress?: number
          project_type?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          submission_status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          target_date?: string | null
          target_journal?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_projects: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          project_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          project_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          project_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_goals: {
        Row: {
          completed_at: string | null
          content: string
          created_at: string
          deadline: string
          id: string
          is_completed: boolean
          linked_stage: string | null
          project_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          content: string
          created_at?: string
          deadline: string
          id?: string
          is_completed?: boolean
          linked_stage?: string | null
          project_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          content?: string
          created_at?: string
          deadline?: string
          id?: string
          is_completed?: boolean
          linked_stage?: string | null
          project_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_goals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_project_progress_by_milestone: {
        Args: { p_milestone_id: string }
        Returns: undefined
      }
      update_project_progress_by_project: {
        Args: { p_project_id: string }
        Returns: undefined
      }
    }
    Enums: {
      announcement_priority: "normal" | "important" | "urgent"
      employment_type: "full-time" | "part-time"
      event_category:
        | "meeting"
        | "deadline"
        | "seminar"
        | "holiday"
        | "personal"
        | "other"
        | "lab_meeting"
        | "conference"
        | "social"
        | "study"
        | "field_trip"
        | "vacation"
        | "lecture"
        | "proposal"
        | "dinner"
      file_entity_type: "project" | "mentoring"
      member_position: "professor" | "post-doc" | "phd" | "ms" | "researcher"
      member_status: "pending" | "active" | "graduated" | "leave"
      notification_type: "deadline" | "comment" | "like" | "project_update"
      progress_log_status: "completed" | "in_progress" | "planned"
      progress_log_type:
        | "task"
        | "meeting"
        | "report"
        | "consulting"
        | "fieldwork"
        | "other"
      project_category:
        | "thesis"
        | "submission"
        | "revision"
        | "publication"
        | "other"
        | "individual"
        | "grant"
      project_status:
        | "preparing"
        | "in_progress"
        | "under_review"
        | "revision"
        | "completed"
        | "on_hold"
        | "submitting"
        | "accepted"
        | "published"
      report_period_type: "weekly" | "monthly" | "quarterly" | "custom"
      report_scope: "project" | "personal"
      report_status: "draft" | "submitted" | "approved"
      submission_status:
        | "not_submitted"
        | "under_review"
        | "major_revision"
        | "minor_revision"
        | "revision_submitted"
        | "accepted"
        | "submitted"
        | "rejected"
        | "under_revision"
        | "resubmitted"
        | "under_2nd_review"
        | "in_press"
        | "published"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      announcement_priority: ["normal", "important", "urgent"],
      employment_type: ["full-time", "part-time"],
      event_category: [
        "meeting",
        "deadline",
        "seminar",
        "holiday",
        "personal",
        "other",
        "lab_meeting",
        "conference",
        "social",
        "study",
        "field_trip",
        "vacation",
        "lecture",
        "proposal",
        "dinner",
      ],
      file_entity_type: ["project", "mentoring"],
      member_position: ["professor", "post-doc", "phd", "ms", "researcher"],
      member_status: ["pending", "active", "graduated", "leave"],
      notification_type: ["deadline", "comment", "like", "project_update"],
      progress_log_status: ["completed", "in_progress", "planned"],
      progress_log_type: [
        "task",
        "meeting",
        "report",
        "consulting",
        "fieldwork",
        "other",
      ],
      project_category: [
        "thesis",
        "submission",
        "revision",
        "publication",
        "other",
        "individual",
        "grant",
      ],
      project_status: [
        "preparing",
        "in_progress",
        "under_review",
        "revision",
        "completed",
        "on_hold",
        "submitting",
        "accepted",
        "published",
      ],
      report_period_type: ["weekly", "monthly", "quarterly", "custom"],
      report_scope: ["project", "personal"],
      report_status: ["draft", "submitted", "approved"],
      submission_status: [
        "not_submitted",
        "under_review",
        "major_revision",
        "minor_revision",
        "revision_submitted",
        "accepted",
        "submitted",
        "rejected",
        "under_revision",
        "resubmitted",
        "under_2nd_review",
        "in_press",
        "published",
      ],
    },
  },
} as const

// ─── Convenience type aliases ───
export type AnnouncementPriority = Database["public"]["Enums"]["announcement_priority"]
export type MemberPosition = Database["public"]["Enums"]["member_position"]
export type EmploymentType = Database["public"]["Enums"]["employment_type"]
export type MemberStatus = Database["public"]["Enums"]["member_status"]
export type CalendarCategory = Database["public"]["Enums"]["event_category"]
export type SubmissionStatus = Database["public"]["Enums"]["submission_status"]
export type ResearchMeeting = Database["public"]["Tables"]["research_meetings"]["Row"]
export type MilestoneStage =
  | "literature_review"
  | "methodology"
  | "data_collection"
  | "analysis"
  | "draft_writing"
  | "submission"
  | "review_revision"
  | "publication"
