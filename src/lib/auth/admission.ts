import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type StudentAdmission = {
  user_id: string;
  registration_number: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  welcome_seen_at: string | null;
  legacy_approved: boolean;
  created_at: string;
};

export function validRegistrationNumber(value: string): boolean {
  return /^[0-9]{1,64}$(?![\s\S])/.test(value);
}

export async function getStudentAdmission(client: SupabaseClient<Database>, userId: string): Promise<StudentAdmission | null> {
  const { data, error } = await client.from("student_admissions").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}
