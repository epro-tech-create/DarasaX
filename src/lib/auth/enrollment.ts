import type { Profile } from "@/types/database";

export function studentEnrollmentError(profile: Profile | null): string | null {
  if (!profile) return null;
  if ((profile.institution && profile.institution !== "Dar es Salaam Institute of Technology (DIT)") ||
      (profile.programme && profile.programme !== "BENG24COE") ||
      (profile.year_of_study !== null && profile.year_of_study !== 3) ||
      (profile.semester !== null && profile.semester !== 1)) {
    return "This account is outside the active DIT BENG24COE Year 3 Semester 1 cohort. Contact your administrator.";
  }
  return null;
}
