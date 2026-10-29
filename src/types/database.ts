export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type StaffProfile =
  Database["public"]["Tables"]["staff_profiles"]["Row"];
export type TimetableRow =
  Database["public"]["Tables"]["timetable_entries"]["Row"];
export type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
export type ModuleTopicRow =
  Database["public"]["Tables"]["module_topics"]["Row"];
export type MonitoredStudentRow =
  Database["public"]["Tables"]["monitored_students"]["Row"];
export type IssueRow = Database["public"]["Tables"]["issues"]["Row"];
export type AuditLogRow = Database["public"]["Tables"]["audit_log"]["Row"];

export type Database = {
  public: {
    Tables: {
      student_admissions: {
        Row: import("@/lib/auth/admission").StudentAdmission;
        Insert: { user_id: string; registration_number?: string | null; status?: string; submitted_at?: string | null; reviewed_by?: string | null; reviewed_at?: string | null; welcome_seen_at?: string | null; legacy_approved?: boolean };
        Update: { registration_number?: string | null; status?: string; submitted_at?: string | null; reviewed_by?: string | null; reviewed_at?: string | null; welcome_seen_at?: string | null };
        Relationships: [{ foreignKeyName: "student_admissions_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      academic_classes: {
        Row: { id: string; label: string; institution: string; programme: string; year: number; semester: number; is_evening: boolean; archived: boolean; created_by: string | null; created_at: string };
        Insert: { id: string; label: string; institution: string; programme: string; year: number; semester: number; is_evening?: boolean; archived?: boolean; created_by?: string | null; created_at?: string };
        Update: { archived?: boolean };
        Relationships: [];
      };

      notifications: {
        Row: { id: string; recipient_id: string; source_type: string; source_id: string; title: string; body: string; type: string; href: string; created_at: string; read_at: string | null };
        Insert: { recipient_id: string; source_type: string; source_id: string; title: string; body: string; type: string; href: string; id?: string; created_at?: string; read_at?: string | null };
        Update: { read_at?: string | null };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          email: string | null;
          institution: string | null;
          programme: string | null;
          year_of_study: number | null;
          semester: number | null;
          class_name: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          institution?: string | null;
          programme?: string | null;
          year_of_study?: number | null;
          semester?: number | null;
          class_name?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          institution?: string | null;
          programme?: string | null;
          year_of_study?: number | null;
          semester?: number | null;
          class_name?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_profiles: {
        Row: {
          id: string;
          role: "admin" | "class_rep" | "lecturer";
          full_name: string | null;
          email: string | null;
          stream_id: string | null;
          stream_ids: string[];
          module_ids: string[];
          onboarding_completed: boolean;
          phone: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: "admin" | "class_rep" | "lecturer";
          full_name?: string | null;
          email?: string | null;
          stream_id?: string | null;
          stream_ids?: string[];
          module_ids?: string[];
          onboarding_completed?: boolean;
          phone?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "admin" | "class_rep" | "lecturer";
          full_name?: string | null;
          email?: string | null;
          stream_id?: string | null;
          stream_ids?: string[];
          module_ids?: string[];
          onboarding_completed?: boolean;
          phone?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      timetable_entries: {
        Row: {
          id: string;
          stream_id: string;
          module_id: string;
          day: number;
          start_time: string;
          end_time: string;
          room: string;
          lecturer: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          stream_id: string;
          module_id: string;
          day: number;
          start_time: string;
          end_time: string;
          room?: string;
          lecturer?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          stream_id?: string;
          module_id?: string;
          day?: number;
          start_time?: string;
          end_time?: string;
          room?: string;
          lecturer?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      materials: {
        Row: {
          id: string;
          title: string;
          kind: string;
          module_id: string | null;
          stream_id: string | null;
          status: string;
          programme: string;
          year_of_study: number;
          semester: number;
          due_at: string | null;
          uploaded_by: string;
          uploaded_by_id: string | null;
          role: string | null;
          file_path: string | null;
          file_url: string | null;
          file_name: string | null;
          file_fingerprint: string | null;
          mime_type: string | null;
          size_bytes: number | null;
          size_label: string | null;
          body: string | null;
          downloads: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          kind: string;
          module_id?: string | null;
          stream_id?: string | null;
          status?: string;
          programme?: string;
          year_of_study?: number;
          semester?: number;
          due_at?: string | null;
          uploaded_by?: string;
          uploaded_by_id?: string | null;
          role?: string | null;
          file_path?: string | null;
          file_url?: string | null;
          file_name?: string | null;
          file_fingerprint?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
          size_label?: string | null;
          body?: string | null;
          downloads?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          kind?: string;
          module_id?: string | null;
          stream_id?: string | null;
          status?: string;
          programme?: string;
          year_of_study?: number;
          semester?: number;
          due_at?: string | null;
          uploaded_by?: string;
          uploaded_by_id?: string | null;
          role?: string | null;
          file_path?: string | null;
          file_url?: string | null;
          file_name?: string | null;
          file_fingerprint?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
          size_label?: string | null;
          body?: string | null;
          downloads?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      module_topics: {
        Row: {
          id: string;
          module_id: string;
          number: number;
          title: string;
          duration_minutes: number;
          summary: string | null;
          content: string | null;
          learning_objectives: string[];
          published: boolean;
          created_by: string;
          created_by_id: string | null;
          role: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          module_id: string;
          number: number;
          title: string;
          duration_minutes?: number;
          summary?: string | null;
          content?: string | null;
          learning_objectives?: string[];
          published?: boolean;
          created_by?: string;
          created_by_id?: string | null;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string;
          number?: number;
          title?: string;
          duration_minutes?: number;
          summary?: string | null;
          content?: string | null;
          learning_objectives?: string[];
          published?: boolean;
          created_by?: string;
          created_by_id?: string | null;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      monitored_students: {
        Row: {
          id: string;
          profile_id: string | null;
          name: string;
          email: string;
          stream_id: string;
          year: number;
          attendance_pct: number;
          assignments_done: number;
          assignments_total: number;
          last_active: string;
          risk: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          stream_id: string;
          year?: number;
          attendance_pct?: number;
          assignments_done?: number;
          assignments_total?: number;
          last_active?: string;
          risk?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          stream_id?: string;
          year?: number;
          attendance_pct?: number;
          assignments_done?: number;
          assignments_total?: number;
          last_active?: string;
          risk?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      issues: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          severity: string;
          status: string;
          stream_id: string | null;
          module_id: string | null;
          reported_by: string;
          reported_by_id: string | null;
          assignee: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          description?: string;
          category?: string;
          severity?: string;
          status?: string;
          stream_id?: string | null;
          module_id?: string | null;
          reported_by?: string;
          reported_by_id?: string | null;
          assignee?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          severity?: string;
          status?: string;
          stream_id?: string | null;
          module_id?: string | null;
          reported_by?: string;
          reported_by_id?: string | null;
          assignee?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: number;
          at: string;
          actor: string;
          role: string;
          action: string;
          summary: string;
          detail: string | null;
          stream_id: string | null;
          actor_id: string | null;
        };
        Insert: {
          at?: string;
          actor?: string;
          role?: string;
          action?: string;
          summary?: string;
          detail?: string | null;
          stream_id?: string | null;
          actor_id?: string | null;
        };
        Update: {
          at?: string;
          actor?: string;
          role?: string;
          action?: string;
          summary?: string;
          detail?: string | null;
          stream_id?: string | null;
          actor_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_announcement_reactions: { Args: { announcement_ids: string[] }; Returns: import("@/lib/announcement-reactions").ReactionSummary[] };
      set_announcement_reaction: { Args: { announcement_id: string; reaction_emoji: string | null }; Returns: undefined };
      cancel_timetable_today: { Args: { target_class: string; reason_text: string; request_key: string }; Returns: number };
      get_timetable_occurrences: { Args: { range_start: string; range_end: string }; Returns: import("@/lib/timetable-dates").TimetableOccurrence[] };
      change_timetable_session: { Args: { entry_id: string; occurrence_date: string; change_scope: string; new_date: string; new_start: string; new_end: string; new_room: string; new_lecturer: string; new_module: string; change_status: string; change_reason: string; request_id: string }; Returns: undefined };
      get_push_public_key: { Args: Record<string, never>; Returns: string };
      get_push_device: { Args: { push_endpoint: string }; Returns: Json };
      register_push_subscription: { Args: { push_endpoint: string; push_p256dh: string; push_auth: string; push_origin: string }; Returns: Json };
      remove_push_subscription: { Args: { push_endpoint: string }; Returns: undefined };
      set_push_preferences: { Args: { device_id: string; receive_updates: boolean; lesson_reminders: boolean }; Returns: undefined };
      admin_email_verified: { Args: Record<string, never>; Returns: boolean };
      start_admin_email_check: { Args: { challenge_token: string; browser_token: string }; Returns: Json };
      admin_email_attempt: { Args: { challenge_token: string }; Returns: boolean };
      finish_admin_email_check: { Args: { challenge_token: string; browser_token: string }; Returns: undefined };
      forget_admin_browser: { Args: { browser_token: string }; Returns: undefined };
      lecturer_application_status: { Args: Record<string, never>; Returns: Json };
      list_lecturer_applications: { Args: Record<string, never>; Returns: Json };
      review_lecturer_application: { Args: { applicant_id: string; decision: string }; Returns: undefined };
      complete_lecturer_registration: { Args: Record<string, never>; Returns: undefined };
      complete_lecturer_setup: { Args: { selected_classes: string[]; selected_modules: string[] }; Returns: undefined };
      list_staff_students: { Args: Record<string, never>; Returns: Json };
      resolve_class_invitation: { Args: { invite_code: string }; Returns: Json };
      manage_class_invitation: { Args: { invite_action: string }; Returns: Json };
      redeem_class_invitation: { Args: { invite_code: string; reg_number: string }; Returns: undefined };
      submit_student_registration: { Args: { reg_number: string; target_class: string }; Returns: undefined };
      list_student_registrations: { Args: Record<string, never>; Returns: Json };
      review_student_registration: { Args: { student_id: string; decision: string }; Returns: undefined };
      acknowledge_student_welcome: { Args: Record<string, never>; Returns: undefined };
      record_sign_in: { Args: Record<string, never>; Returns: undefined };
      site_visitor_summary: { Args: Record<string, never>; Returns: Json };
      staff_material_scope: { Args: { target_stream: string; target_module: string | null }; Returns: boolean };
      update_my_registration_number: { Args: { reg_number: string }; Returns: undefined };
      admin_edit_student_registration: { Args: { roster_id: string; reg_number: string; roster_patch: Json }; Returns: Json };
      material_file_exists: { Args: { candidate_name: string; candidate_fingerprint: string; exclude_id: string | null }; Returns: boolean };
      can_publish_material: { Args: { target_stream: string | null; target_module: string | null }; Returns: boolean };
      can_manage_material: { Args: { owner_id: string | null; target_stream: string | null; target_module: string | null }; Returns: boolean };
      create_material_share: { Args: {mid: string}; Returns: string };
      get_shared_material: { Args: {share_token: string}; Returns: Json };

      add_academic_class: { Args: {class_id: string; class_label: string; class_institution: string; class_programme: string; class_year: number; class_semester: number; evening?: boolean}; Returns: void };
      archive_academic_class: { Args: {class_id: string}; Returns: void };

      record_student_activity: { Args: Record<string, never>; Returns: void };
      record_material_view: { Args: { mid: string }; Returns: void };
      engagement_summary: { Args: { period_days?: number }; Returns: Json };

      appoint_class_rep: {
        Args: { student_email: string; assigned_stream: string; display_name: string; contact_phone: string | null; account_status: string };
        Returns: StaffProfile;
      };
      increment_material_downloads: {
        Args: { mid: string };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
