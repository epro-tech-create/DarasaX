import { ModuleDetail } from "@/components/modules/module-detail";
import { requireStaff } from "@/lib/auth/require-staff";

export default async function ClassRepModulePage() {
  const profile = await requireStaff("class_rep");
  return <ModuleDetail crClassId={profile.stream_id} />;
}
