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
          role: "admin" | "class_rep";
          full_name: string | null;
          email: string | null;
          stream_id: string | null;
          phone: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: "admin" | "class_rep";
          full_name?: string | null;
          email?: string | null;
          stream_id?: string | null;
          phone?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "admin" | "class_rep";
          full_name?: string | null;
          email?: string | null;
          stream_id?: string | null;
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
          uploaded_by: string;
          uploaded_by_id: string | null;
          role: string | null;
          file_path: string | null;
          file_url: string | null;
          file_name: string | null;
          mime_type: string | null;
          size_bytes: number | null;
          size_label: string | null;
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
          uploaded_by?: string;
          uploaded_by_id?: string | null;
          role?: string | null;
          file_path?: string | null;
          file_url?: string | null;
          file_name?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
          size_label?: string | null;
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
          uploaded_by?: string;
          uploaded_by_id?: string | null;
          role?: string | null;
          file_path?: string | null;
          file_url?: string | null;
          file_name?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
          size_label?: string | null;
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
