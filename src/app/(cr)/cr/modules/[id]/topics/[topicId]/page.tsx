import { redirect } from "next/navigation";

export default async function ClassRepTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/cr/modules/${encodeURIComponent(id)}`);
}
