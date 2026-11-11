import { ModulesBrowser } from "@/components/modules/modules-browser";
import { requireStaff } from "@/lib/auth/require-staff";

export default async function ClassRepModulesPage() {
  const profile = await requireStaff("class_rep");
  return <ModulesBrowser streamId={profile.stream_id} />;
}
