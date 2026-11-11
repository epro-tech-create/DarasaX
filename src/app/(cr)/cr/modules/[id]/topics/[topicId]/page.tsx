import { TopicDetail } from "@/components/modules/topic-detail";
import { requireStaff } from "@/lib/auth/require-staff";

export default async function ClassRepTopicPage() {
  const profile = await requireStaff("class_rep");
  return <TopicDetail crClassId={profile.stream_id} />;
}
