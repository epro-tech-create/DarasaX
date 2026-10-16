import { ClassManager } from "@/components/staff/class-manager";
import { PageHeader } from "@/components/layout/page-header";
export default function ClassesPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Classes" />
      <ClassManager />
    </div>
  );
}
