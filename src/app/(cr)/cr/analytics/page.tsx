import { PageHeader } from "@/components/layout/page-header";
import { EngagementAnalytics } from "@/components/staff/engagement-analytics";
export default function AnalyticsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Class insights" />
      <EngagementAnalytics />
    </div>
  );
}
