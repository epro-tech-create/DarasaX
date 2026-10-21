"use client";
import { useTranslate } from "@/components/providers/language-provider";
import { PageHeader } from "@/components/layout/page-header";
import { EngagementAnalytics } from "@/components/staff/engagement-analytics";
export default function AnalyticsPage() {
  const translateUI = useTranslate();
  return (
    <div className="space-y-5">
      <PageHeader title={translateUI("Class insights")} />
      <EngagementAnalytics />
    </div>
  );
}
