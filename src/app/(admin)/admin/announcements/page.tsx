"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection } from "@/components/staff/staff-ui";
import { useMaterialsStore } from "@/lib/materials-store";
import { useStaffSession } from "@/lib/staff-auth";

export default function AdminAnnouncementsPage() {
  const { session } = useStaffSession();
  const { items, publishNotice } = useMaterialsStore();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const live = items.filter(
    (item) => item.kind === "announcement" && item.status === "published",
  );

  async function publish() {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await publishNotice({
        title,
        body,
        uploadedBy: session?.name ?? "Admin",
        role: "admin",
        streamId: "all",
      });
      setTitle("");
      setBody("");
      setMessage("Announcement published. Students can see it now.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not publish. Run the latest Supabase migration, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Announcements"
        description="Broadcast a notice to every stream. Students see it on Announcements and in notifications."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface rounded-[20px] p-4 sm:p-5">
          <h2 className="font-heading text-[14px] font-semibold">Compose</h2>
          <div className="mt-3 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Headline"
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Details students need…"
              rows={5}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button type="button" disabled={busy} onClick={() => void publish()}>
              {busy ? "Publishing…" : "Publish"}
            </Button>
            {message ? (
              <p className="text-[12px] font-medium text-success">{message}</p>
            ) : null}
            {error ? (
              <p className="text-[12px] font-medium text-danger">{error}</p>
            ) : null}
          </div>
        </div>

        <StaffSection title="Live feed" description="Published announcements students can open">
          <div className="max-h-[420px] space-y-2.5 overflow-y-auto scrollbar-thin">
            {live.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-muted-foreground">
                No announcements published yet.
              </p>
            ) : (
              live.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/70 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12px] font-semibold">{item.title}</p>
                    <Badge tone="primary">{item.streamId ?? "All streams"}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-3 text-[11px] text-muted-foreground">
                    {item.body || "Published notice"}
                  </p>
                </div>
              ))
            )}
          </div>
        </StaffSection>
      </div>
    </div>
  );
}
